"""words.json → subs.json (phrases for the overlay) + subtitles_en.srt"""
import json
w = json.load(open('words.json'))
ENDS = [2, 5, 12, 17, 24, 33, 41, 47, 51, 56, 62, 68, 75, 79, 85, 92, 96, 101, 104, 110, 114, 121, 126, 135, 138, 145]   # last word index of each phrase
subs, a = [], 0
for b in ENDS:
    cur = w[a:b + 1]; subs.append({'t': cur[0][1], 'e': cur[-1][2], 'sub': ' '.join(c[0] for c in cur)}); a = b + 1
assert a == len(w)
# hold each phrase until the next one starts (cap +0.6s past its end), min 1.0 s on screen
for i, s in enumerate(subs):
    nx = subs[i + 1]['t'] if i + 1 < len(subs) else s['e'] + .8
    s['out'] = round(min(nx - .05, s['e'] + .6), 3)
    s['t'] = round(max(0, s['t'] - .1), 3)
json.dump(subs, open('subs.json', 'w'), indent=0)
f = lambda t: '%02d:%02d:%02d,%03d' % (t // 3600, t % 3600 // 60, t % 60, round(t % 1 * 1000) % 1000)
open('subtitles_en.srt', 'w').write('\n'.join(f"{i+1}\n{f(s['t'])} --> {f(s['out'])}\n{s['sub']}\n" for i, s in enumerate(subs)))
for s in subs: print(round(s['out'] - s['t'], 2), s['sub'])
