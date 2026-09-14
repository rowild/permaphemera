import { spawn } from 'node:child_process'
import { access, readFile, readdir, stat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import SftpClient from 'ssh2-sftp-client'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputDirectory = join(projectRoot, '.output', 'public')
const localEnvironmentFile = join(projectRoot, '.env.deploy.local')
const isDryRun = process.argv.includes('--dry-run')
const shouldCleanAssets = process.argv.includes('--clean')

function log(message) {
  console.log(`[deploy] ${message}`)
}

async function loadEnvironmentFile(filePath) {
  let source

  try {
    source = await readFile(filePath, 'utf8')
  }
  catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(
        '.env.deploy.local is missing. Copy .env.deploy.example and fill in the local credentials.',
      )
    }

    throw error
  }

  for (const line of source.split(/\r?\n/u)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/u)

    if (!match) {
      continue
    }

    const [, key, rawValue] = match
    let value = rawValue.trim()

    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

function requireEnvironmentVariable(name, { allowEmpty = false } = {}) {
  const value = process.env[name]?.trim()

  if (value === undefined || (!allowEmpty && value === '')) {
    throw new Error(`The required setting ${name} is missing.`)
  }

  return value
}

/**
 * SFTP paths are absolute, so the guard differs from an FTP one: refuse
 * traversal, refuse anything shallow enough to be a shared parent, and require
 * the path to name a document root under the account's htdocs directory.
 */
function validateRemoteDirectory(remoteDirectory) {
  if (!remoteDirectory.startsWith('/') || remoteDirectory.includes('..')) {
    throw new Error(`The remote directory is invalid: ${remoteDirectory}`)
  }

  const segments = remoteDirectory.split('/').filter(Boolean)

  if (segments.length < 4 || segments[0] !== 'www' || segments[1] !== 'htdocs') {
    throw new Error(
      `Refusing to deploy to ${remoteDirectory}. Expected a document root such as `
      + '/www/htdocs/<account>/<domain>.',
    )
  }
}

async function readPrivateKey(keyPath) {
  try {
    const key = await readFile(keyPath)

    if (key.includes('PuTTY-User-Key-File')) {
      throw new Error(
        `${keyPath} is a PuTTY .ppk key, which cannot be used directly. `
        + 'Convert it with "puttygen key.ppk -O private-openssh -o key" or point '
        + 'DEPLOY_SSH_KEY at the OpenSSH private key.',
      )
    }

    if (key.includes('ssh-ed25519 ') || key.includes('ssh-rsa ')) {
      throw new Error(
        `${keyPath} is a public key. Authentication needs the matching private key `
        + '(the same path without the .pub suffix).',
      )
    }

    return key
  }
  catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`The private key was not found: ${keyPath}`)
    }

    throw error
  }
}

async function runStaticGeneration() {
  const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

  log('Generating the static SPA into .output/public …')

  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(pnpmCommand, ['exec', 'nuxt', 'generate'], {
      cwd: projectRoot,
      env: process.env,
      stdio: 'inherit',
    })

    child.on('error', rejectPromise)
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolvePromise()
        return
      }

      rejectPromise(
        new Error(
          signal
            ? `Static generation was terminated by ${signal}.`
            : `Static generation failed with exit code ${code}.`,
        ),
      )
    })
  })
}

async function inspectOutput(directory) {
  // .htaccess carries the SPA fallback. Without it every clean route 404s, and
  // it is exactly the file a dotfile-skipping upload silently drops.
  for (const required of ['index.html', '.htaccess']) {
    try {
      await access(join(directory, required))
    }
    catch {
      throw new Error(`The build output is missing ${required}.`)
    }
  }

  let fileCount = 0
  let byteCount = 0

  async function visit(currentDirectory) {
    for (const entry of await readdir(currentDirectory, { withFileTypes: true })) {
      const entryPath = join(currentDirectory, entry.name)

      if (entry.isDirectory()) {
        await visit(entryPath)
      }
      else if (entry.isFile()) {
        fileCount += 1
        byteCount += (await stat(entryPath)).size
      }
    }
  }

  await visit(directory)

  return {
    fileCount,
    sizeInMegabytes: (byteCount / 1024 / 1024).toFixed(2),
  }
}

async function uploadOutput({ host, port, user, privateKey, passphrase, remoteDirectory }) {
  const client = new SftpClient()

  try {
    log(`Connecting to ${user}@${host}:${port} over SFTP …`)
    await client.connect({
      host,
      port,
      username: user,
      privateKey,
      ...(passphrase ? { passphrase } : {}),
      readyTimeout: 30_000,
    })

    if (!await client.exists(remoteDirectory)) {
      throw new Error(`The remote directory does not exist: ${remoteDirectory}`)
    }

    if (shouldCleanAssets) {
      const assetDirectory = `${remoteDirectory}/_nuxt`

      // _nuxt holds content-hashed bundles, so stale ones are unreachable dead
      // weight rather than a rollback path. Everything else is left alone.
      if (await client.exists(assetDirectory)) {
        log('Removing the previous _nuxt bundle directory …')
        await client.rmdir(assetDirectory, true)
      }
    }

    log(`Uploading .output/public to ${remoteDirectory} …`)
    await client.uploadDir(outputDirectory, remoteDirectory)

    // Publish the entry documents last, so a new build becomes visible only
    // after its assets are in place.
    for (const entryFile of ['index.html', '200.html', '404.html']) {
      const localPath = join(outputDirectory, entryFile)

      try {
        await access(localPath)
      }
      catch {
        continue
      }

      await client.put(localPath, `${remoteDirectory}/${entryFile}`)
    }

    // Confirm the fallback survived the transfer rather than assuming it did.
    if (!await client.exists(`${remoteDirectory}/.htaccess`)) {
      throw new Error(
        'The upload finished but .htaccess is not on the server. Clean routes will 404 '
        + 'until it is uploaded.',
      )
    }

    log('Verified .htaccess is present on the server.')
  }
  finally {
    await client.end().catch(() => {})
  }
}

async function main() {
  await loadEnvironmentFile(localEnvironmentFile)

  const host = requireEnvironmentVariable('DEPLOY_SSH_HOST')
  const port = Number.parseInt(requireEnvironmentVariable('DEPLOY_SSH_PORT'), 10)
  const user = requireEnvironmentVariable('DEPLOY_SSH_USER')
  const keyPath = requireEnvironmentVariable('DEPLOY_SSH_KEY')
  const passphrase = process.env.DEPLOY_SSH_PASSPHRASE?.trim() ?? ''
  const remoteDirectory = requireEnvironmentVariable('DEPLOY_REMOTE_DIR')

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`The SSH port is invalid: ${process.env.DEPLOY_SSH_PORT}`)
  }

  validateRemoteDirectory(remoteDirectory)
  const privateKey = await readPrivateKey(keyPath.replace(/^~/u, process.env.HOME ?? '~'))

  await runStaticGeneration()
  const output = await inspectOutput(outputDirectory)
  log(`Build output checked: ${output.fileCount} files, ${output.sizeInMegabytes} MB.`)

  if (isDryRun) {
    log(`Dry run complete. Nothing was uploaded. Target would have been ${remoteDirectory}.`)
    return
  }

  await uploadOutput({ host, port, user, privateKey, passphrase, remoteDirectory })
  log(`Deployment to ${host}:${remoteDirectory} complete.`)
}

main().catch((error) => {
  console.error(`[deploy] Error: ${error.message}`)
  process.exitCode = 1
})
