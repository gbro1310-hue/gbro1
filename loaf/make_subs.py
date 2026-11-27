"""voice/words.json (+ VO offset, atempo 0.97 scale) → words.json, subs.json (phrases for the overlay), subtitles_en.srt"""
import json
VO, K = 1.0, 1.0
w = [[a, round(b * K + VO, 3), round(c * K + VO, 3), d] for a, b, c, d in json.load(open('voice/words.json'))]
json.dump(w, open('words.json', 'w'))
subs, cur = [], []
for i, x in enumerate(w):
    cur.append(x); t = x[0]
    end = t[-1] in '.?!' or x[3] or (t[-1] in ',:;' and len(cur) >= 5) or len(cur) >= 10
    if end or i == len(w) - 1:
        subs.append({'t': cur[0][1], 'e': cur[-1][2], 'sub': ' '.join(c[0] for c in cur)}); cur = []
for i, s in enumerate(subs):
    nx = subs[i + 1]['t'] if i + 1 < len(subs) else s['e'] + .8
    s['out'] = round(min(nx - .05, s['e'] + .6), 3); s['t'] = round(max(0, s['t'] - .1), 3)
json.dump(subs, open('subs.json', 'w'), indent=0)
f = lambda t: '%02d:%02d:%02d,%03d' % (t // 3600, t % 3600 // 60, t % 60, round(t % 1 * 1000) % 1000)
open('subtitles_en.srt', 'w').write('\n'.join(f"{i+1}\n{f(s['t'])} --> {f(s['out'])}\n{s['sub']}\n" for i, s in enumerate(subs)))
print(len(subs), 'phrases; last word ends', w[-1][2], '; longest', max(len(s['sub']) for s in subs))
