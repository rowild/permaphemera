#!/bin/sh
# Uses the newsletter's Brevo API key once a week. Brevo switches a key off after 90 days
# without use; without sign-ups that would break the form without any warning.
# When the key fails, it mails the owner (same SMTP settings as the monthly news report).
# The call runs inside the Directus container: it has the key in its environment and leaves
# from the server's IPv4 138.199.205.241 (the address in Brevo → Security → Authorized IPs).
# Installed by install-extension.sh as $STACK/brevo-keepalive.sh, cron of user rowild:
#   23 4 * * 1 /srv/stacks/permaphemera.project-backends.info/brevo-keepalive.sh
# Log: $STACK/brevo-keepalive.log (last 200 lines). By hand: sh <this file>
# Plan: plans/2026-11-07__newsletter.md.
set -u
STACK=/srv/stacks/permaphemera.project-backends.info
MAIL_ENV=/srv/sites/permaphemera.at/news-report-data/mail.env
LOG="$STACK/brevo-keepalive.log"
{
  ANSWER=$(cd "$STACK/app" && docker compose exec -T directus node --input-type=module -e "
    import { brevoApiKey, checkBrevoKey } from '/directus/extensions/permaphemera-newsletter/lib.js'
    const r = await checkBrevoKey(brevoApiKey(process.env.NEWSLETTER_BREVO_API_KEY))
    console.log(r.ok ? 'ok' : 'failed ' + r.status + ' ' + r.message)
  " 2>&1 | tail -n 1)
  echo "$(date -Iseconds) $ANSWER"
  case "$ANSWER" in
    ok) ;;
    *)
      if [ -f "$MAIL_ENV" ]; then
        . "$MAIL_ENV"
        printf 'From: %s\r\nTo: %s\r\nSubject: PermaPhemera: Brevo-Key des Newsletters geht nicht\r\nContent-Type: text/plain; charset=utf-8\r\n\r\nDie wöchentliche Prüfung des Brevo-API-Schlüssels ist fehlgeschlagen:\r\n\r\n  %s\r\n\r\nSolange das so ist, kann sich niemand zum Newsletter anmelden.\r\nBrevo → SMTP & API → API keys: Ist der Schlüssel "permaphemera-newsletter" aktiv?\r\nBrevo → Security → Authorized IPs: Steht 138.199.205.241 dort?\r\nLog: %s\r\n' \
          "$NEWS_REPORT_FROM" "$NEWS_REPORT_TO" "$ANSWER" "$LOG" \
        | curl --silent --show-error --ssl-reqd --connect-timeout 20 --max-time 90 --url "$SMTP_URL" \
            --user "$SMTP_USER:$SMTP_PASS" --mail-from "$NEWS_REPORT_FROM" --mail-rcpt "$NEWS_REPORT_TO" --upload-file - \
          && echo "  mail sent to $NEWS_REPORT_TO" || echo "  mail failed too"
      else
        echo "  no $MAIL_ENV, no mail"
      fi
      ;;
  esac
} >> "$LOG" 2>&1
tail -n 200 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
