#!/bin/bash
# fetch.sh <name> <url>: saves the page to pages/<name>.html and prints its plain text.
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
code=$(curl -sL -A "$UA" -o "pages/$1.html" -w "%{http_code}" "$2")
echo "== $1 [$code] $2"
python3 -c '
import re,html,sys
s=open(sys.argv[1],encoding="utf-8",errors="ignore").read()
t=re.sub(r"<script.*?</script>|<style.*?</style>|<noscript.*?</noscript>","",s,flags=re.S)
t=html.unescape(re.sub(r"<[^>]+>"," ",t)); t=re.sub(r"\s+"," ",t)
print(t[:int(sys.argv[2])])' "pages/$1.html" "${3:-2500}"
