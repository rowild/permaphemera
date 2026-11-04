// Component tests mount single components outside Nuxt: the auto-imports and globals the
// components use are stood in for here.
import { config, RouterLinkStub } from '@vue/test-utils'
import ArchiveBreadcrumb from '~/components/ArchiveBreadcrumb.vue'
import ArchiveFactLedger from '~/components/ArchiveFactLedger.vue'

Object.assign(globalThis, { useLocalePath: () => (path: string) => path })

config.global.mocks = { $t: (key: string) => key }
config.global.components = { ArchiveBreadcrumb, ArchiveFactLedger }
config.global.stubs = { ArchiveTextLink: { template: '<a><slot /></a>' }, NuxtLink: RouterLinkStub }
