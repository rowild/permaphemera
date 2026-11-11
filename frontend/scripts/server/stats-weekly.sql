-- Umami export for the weekly sums (scripts/server/stats-weekly.sh; plans/2026-11-11__umami-weekly-sums.md).
-- Read-only. One JSON object per line, for the complete weeks from :since (a Monday, Vienna time)
-- up to the start of the current week. Variables: :site (Umami website id), :since (YYYY-MM-DD).
\set ON_ERROR_STOP 1
WITH ev AS (
  SELECT date_trunc('week', e.created_at AT TIME ZONE 'Europe/Vienna')::date AS w, e.*
  FROM website_event e
  WHERE e.website_id = :'site'
    AND e.created_at >= (:'since'::date::timestamp AT TIME ZONE 'Europe/Vienna')
    AND e.created_at < (date_trunc('week', now() AT TIME ZONE 'Europe/Vienna') AT TIME ZONE 'Europe/Vienna')
)
SELECT json_build_object('t', 'v', 'w', w, 'p', url_path, 's', session_id, 'r', coalesce(referrer_domain, ''), 'n', count(*))::text
  FROM ev WHERE event_type = 1
  GROUP BY w, url_path, session_id, referrer_domain
UNION ALL
SELECT json_build_object('t', 'o', 'w', ev.w, 'tour', d.string_value, 's', ev.session_id, 'n', count(*))::text
  FROM ev JOIN event_data d ON d.website_event_id = ev.event_id AND d.data_key = 'tour'
  WHERE ev.event_type = 2 AND ev.event_name = 'tour-open'
  GROUP BY ev.w, d.string_value, ev.session_id
UNION ALL
SELECT json_build_object('t', 's', 's', s.session_id, 'c', s.country, 'r', s.region, 'ci', s.city, 'd', s.device)::text
  FROM session s
  WHERE s.website_id = :'site' AND s.session_id IN (SELECT session_id FROM ev);
