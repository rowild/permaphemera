# grep_text.py <file> <regex> [width]: shows the plain-text context around each match.
import re,html,sys
s=open(sys.argv[1],encoding='utf-8',errors='ignore').read()
t=re.sub(r'<script.*?</script>|<style.*?</style>','',s,flags=re.S); t=html.unescape(re.sub(r'<[^>]+>',' ',t)); t=re.sub(r'\s+',' ',t)
w=int(sys.argv[3]) if len(sys.argv)>3 else 400
for m in list(re.finditer(sys.argv[2],t,flags=re.I))[:6]: print('…',t[max(0,m.start()-w):m.end()+w],'…\n')
