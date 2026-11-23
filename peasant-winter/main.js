// Tonight You Sleep With the Cow — entry
const cv = document.getElementById('cv'), g = cv.getContext('2d');
await document.fonts.load('400 40px "IM Fell English"'); await document.fonts.load('400 40px "IM Fell English SC"');
const f = await import('./film.js');
await f.init();
window.DUR = f.DUR; window.EV = f.EV; window.SUBS = f.SUBS; window.TEXTS = f.texts;
window.render = t => f.render(g, t);
window.READY = true;
