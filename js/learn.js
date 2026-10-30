/* "Sterne lesen lernen": Lernpfad mit Star-Hopping-Animation, Hand-Trick, Mini-Spiel, Rotlicht-Modus */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var D2R = Math.PI / 180;
  var BY = {}; AE.stars.forEach(function (s) { if (s.name && !BY[s.name]) BY[s.name] = s; });
  function vecOf(p) { return typeof p === 'string' ? BY[p].v : AE.toVec(p[0], p[1]); }

  /* ---------- Speicher ---------- */
  var KEY = 'ae-learn-v1', store = { done: {}, best: 0 };
  try { var raw = JSON.parse(localStorage.getItem(KEY) || 'null'); if (raw) { store.done = raw.done || {}; store.best = raw.best || 0; } } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} }

  /* ---------- Himmelsausschnitt (stereografisch, Norden oben, Osten links) ---------- */
  function Patch(canvas) {
    this.cv = canvas; this.ctx = canvas.getContext('2d');
    this.ra = 0; this.dec = 0; this.fov = 40;
  }
  Patch.prototype.resize = function () {
    var r = this.cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    this.W = Math.max(150, r.width); this.H = Math.max(150, r.height);
    this.cv.width = Math.round(this.W * dpr); this.cv.height = Math.round(this.H * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.setView(this.ra, this.dec, this.fov);
  };
  Patch.prototype.setView = function (ra, dec, fov) {
    this.ra = ra; this.dec = dec; this.fov = fov;
    var a = ra * D2R, d = dec * D2R;
    this.c0 = AE.toVec(ra, dec);
    this.e = [-Math.sin(a), Math.cos(a), 0];
    this.n = [-Math.sin(d) * Math.cos(a), -Math.sin(d) * Math.sin(a), Math.cos(d)];
    this.S = (Math.max(this.W, this.H) / 2) / (2 * Math.tan(fov / 4 * D2R));
    this.ppd = this.S * D2R;
  };
  Patch.prototype.p = function (v) {
    var c = v[0] * this.c0[0] + v[1] * this.c0[1] + v[2] * this.c0[2];
    if (c < -0.2) return null;
    var k = 2 / (1 + c) * this.S;
    return [this.W / 2 - (v[0] * this.e[0] + v[1] * this.e[1] + v[2] * this.e[2]) * k, this.H / 2 - (v[0] * this.n[0] + v[1] * this.n[1] + v[2] * this.n[2]) * k];
  };
  Patch.prototype.background = function (opts) {
    opts = opts || {};
    var ctx = this.ctx, W = this.W, H = this.H;
    var g = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, '#0f1748'); g.addColorStop(1, '#03051a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    var lim = opts.lim || 5.2, sc = Math.min(1.5, 0.7 + this.ppd / 25);
    for (var i = 0; i < AE.stars.length; i++) {
      var s = AE.stars[i]; if (s.mag > lim) continue;
      var q = this.p(s.v); if (!q || q[0] < -5 || q[1] < -5 || q[0] > W + 5 || q[1] > H + 5) continue;
      var r = Math.max(0.5, (5.8 - s.mag) * 0.62 * sc), dim = opts.dimOthers && opts.dimOthers.indexOf(s.con) < 0 ? 0.55 : 1;
      if (s.mag < 2.5) {
        var gl = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], r * 4);
        gl.addColorStop(0, s.col.replace('rgb', 'rgba').replace(')', ',.45)')); gl.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(q[0], q[1], r * 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = Math.min(1, 0.45 + (lim - s.mag) * 0.25) * dim;
      ctx.fillStyle = s.col; ctx.beginPath(); ctx.arc(q[0], q[1], r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
  // Zeichnet Polylinien bis zum Anteil f (0..1) der Gesamtlänge
  Patch.prototype.polylines = function (lines, f, style) {
    var ctx = this.ctx, self = this, segs = [], total = 0;
    lines.forEach(function (pl) {
      for (var i = 1; i < pl.length; i++) {
        var a = self.p(pl[i - 1]), b = self.p(pl[i]); if (!a || !b) continue;
        var L = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push([a, b, L]); total += L;
      }
    });
    var left = total * Math.max(0, Math.min(1, f)), last = null;
    ctx.save();
    ctx.strokeStyle = style.color; ctx.lineWidth = style.width || 2; ctx.lineCap = 'round';
    ctx.shadowColor = style.glow || style.color; ctx.shadowBlur = style.blur == null ? 10 : style.blur;
    if (style.dash) ctx.setLineDash(style.dash);
    ctx.beginPath();
    for (var k = 0; k < segs.length && left > 0; k++) {
      var s = segs[k], t = Math.min(1, left / s[2]);
      var ex = s[0][0] + (s[1][0] - s[0][0]) * t, ey = s[0][1] + (s[1][1] - s[0][1]) * t;
      ctx.moveTo(s[0][0], s[0][1]); ctx.lineTo(ex, ey);
      last = [ex, ey, s[1][0] - s[0][0], s[1][1] - s[0][1]];
      left -= s[2];
    }
    ctx.stroke(); ctx.restore();
    return last;
  };
  Patch.prototype.dots = function (lines, f) {
    var ctx = this.ctx, self = this;
    ctx.save(); ctx.globalAlpha = f == null ? 1 : f; ctx.fillStyle = '#fff'; ctx.shadowColor = '#bfe6ff'; ctx.shadowBlur = 8;
    lines.forEach(function (pl) { pl.forEach(function (v) { var q = self.p(v); if (q) { ctx.beginPath(); ctx.arc(q[0], q[1], 2.6, 0, Math.PI * 2); ctx.fill(); } }); });
    ctx.restore();
  };
  Patch.prototype.label = function (txt, v, color, dy) {
    var q = this.p(v); if (!q) return;
    var ctx = this.ctx;
    ctx.font = '600 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(3,5,20,.6)';
    var w = ctx.measureText(txt).width;
    ctx.fillRect(q[0] + 7, q[1] - 8 + (dy || 0), w + 8, 17);
    ctx.fillStyle = color || '#ffe6a6'; ctx.fillText(txt, q[0] + 11, q[1] + 5 + (dy || 0));
  };
  Patch.prototype.ring = function (v, t, color) {
    var q = this.p(v); if (!q) return;
    var ctx = this.ctx, ph = (t % 1400) / 1400;
    ctx.save(); ctx.strokeStyle = color || '#8affd6'; ctx.lineWidth = 2;
    ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.arc(q[0], q[1], 8 + ph * 22, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(q[0], q[1], 9, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  };
  function arrowHead(ctx, x, y, dx, dy, col) {
    var a = Math.atan2(dy, dx); ctx.save(); ctx.fillStyle = col; ctx.translate(x, y); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(-9, -6); ctx.lineTo(-9, 6); ctx.closePath(); ctx.fill(); ctx.restore();
  }

  /* ---------- Lernpfad ---------- */
  var WAGEN = [['Alkaid', 'Mizar', 'Alioth', 'Megrez', 'Dubhe', 'Merak', 'Phecda', 'Megrez']];
  var STEPS = [
    { id: 'wagen', t: 'Der Große Wagen', e: '🐻', season: 'ganzjährig – zirkumpolar', key: 'Megrez', view: [180, 57, 42], fig: WAGEN, labels: ['Dubhe', 'Merak', 'Phecda', 'Megrez', 'Alioth', 'Mizar', 'Alkaid'],
      txt: 'Dein Startpunkt! Sieben helle Sterne bilden einen Kasten mit Deichsel. Er gehört zum Sternbild Großer Bär und geht bei uns <b>nie unter</b>. Im Herbst steht er tief im Norden, im Frühling hoch über dir.', tip: 'Suche nach einem großen „Kochtopf“ mit Stiel – er ist etwa 25° breit, also mehr als eine gespreizte Hand.' },
    { id: 'polaris', t: 'Polarstern finden', e: '⭐', season: 'ganzjährig', key: 'Polarstern', view: [140, 74, 50], fig: WAGEN, hop: ['Merak', 'Dubhe', 'Polarstern'], ticks: ['Merak', 'Dubhe'], target: 'Polarstern', labels: ['Merak', 'Dubhe', 'Polarstern'],
      txt: 'Verlängere die beiden hinteren Kastensterne <b>Merak → Dubhe</b> etwa <b>fünfmal</b> – schon landest du beim Polarstern. Er ist nicht besonders hell, aber er steht fast genau im Norden und bewegt sich nie.', tip: 'Die Höhe des Polarsterns über dem Horizont entspricht deiner geografischen Breite – in Deutschland 47–55°.' },
    { id: 'kassiopeia', t: 'Kassiopeia, das Himmels-W', e: '👑', season: 'ganzjährig, am besten im Herbst', key: 'Navi', view: [80, 80, 82], fig: WAGEN.concat([['Caph', 'Shedar', 'Navi', 'Ruchbah', 'Segin']]), hop: ['Megrez', 'Polarstern', 'Navi'], target: 'Navi', labels: ['Polarstern', 'Navi', 'Megrez'],
      txt: 'Ziehe eine Linie von <b>Megrez</b> (wo die Deichsel am Kasten sitzt) durch den <b>Polarstern</b> und gehe gleich weit weiter: Dort leuchtet das markante <b>W</b> der Kassiopeia. Wagen und W stehen sich wie auf einer Wippe gegenüber.', tip: 'Steht der Wagen tief, ist das W hoch – und umgekehrt.' },
    { id: 'arktur', t: 'Bogen zum Arktur, weiter zur Spica', e: '🏹', season: 'Frühling', key: 'Arktur', view: [200, 30, 80], fig: WAGEN, hop: ['Alioth', 'Mizar', 'Alkaid', 'Arktur', 'Spica'], target: 'Spica', labels: ['Alkaid', 'Arktur', 'Spica'],
      txt: 'Folge dem <b>Bogen</b> der Wagendeichsel weiter – „<i>arc to Arcturus</i>“ – und du triffst den orangefarbenen <b>Arktur</b>, den hellsten Stern des Nordhimmels. Gleite in derselben Kurve weiter zur bläulichen <b>Spica</b> in der Jungfrau.', tip: 'Merksatz: „Bogen zum Arktur, sause zur Spica.“' },
    { id: 'sommer', t: 'Das Sommerdreieck', e: '🔺', season: 'Sommer bis Herbst', key: 'Deneb', view: [298, 30, 52], fig: [['Vega', 'Deneb', 'Altair', 'Vega']], target: 'Altair', labels: ['Vega', 'Deneb', 'Altair'], cons: ['Lyr', 'Cyg', 'Aql'],
      txt: 'Drei helle Sterne aus drei Sternbildern: <b>Wega</b> (Leier), <b>Deneb</b> (Schwan) und <b>Atair</b> (Adler). Im Sommer steht das riesige Dreieck abends fast im Zenit – mitten in der Milchstraße.', tip: 'Wega ist der hellste der drei und steht im Sommer fast senkrecht über dir.' },
    { id: 'herbst', t: 'Herbstviereck & Andromedagalaxie', e: '🌀', season: 'Herbst', key: 'Alpheratz', view: [5, 30, 56], fig: [['Markab', 'Scheat', 'Alpheratz', 'Algenib', 'Markab']], hop: ['Alpheratz', 'Mirach', [14.0, 38.5], [10.68, 41.27]], target: [10.68, 41.27], targetName: 'M31 Andromedagalaxie', labels: ['Alpheratz', 'Mirach', 'Markab'],
      txt: 'Das große Quadrat des <b>Pegasus</b> ist dein Herbst-Wegweiser. Von der linken oberen Ecke <b>Alpheratz</b> zwei Sterne weiter nach links zu <b>Mirach</b>, dann nach oben abbiegen: Dort schimmert die <b>Andromedagalaxie</b> als kleines Nebelfleckchen.', tip: 'Ihr Licht ist 2,5 Millionen Jahre alt – älter als die Menschheit!' },
    { id: 'orion', t: 'Orion – der Himmelsjäger', e: '🏹', season: 'Winter', key: 'Alnilam', view: [80, 5, 72], fig: [['Beteigeuze', 'Bellatrix'], ['Beteigeuze', 'Alnitak', 'Alnilam', 'Mintaka', 'Bellatrix'], ['Alnitak', 'Saiph'], ['Mintaka', 'Rigel']], hop: ['Mintaka', 'Alnitak', 'Sirius'], hop2: ['Alnitak', 'Mintaka', 'Aldebaran', 'Alcyone'], target: 'Sirius', labels: ['Beteigeuze', 'Rigel', 'Sirius', 'Aldebaran', 'Alcyone'],
      txt: 'Drei Sterne in einer Reihe – der <b>Gürtel des Orion</b> – sind unverwechselbar. Nach links unten weist der Gürtel zu <b>Sirius</b>, dem hellsten Stern überhaupt. Nach rechts oben zu <b>Aldebaran</b> und weiter zu den <b>Plejaden</b> (Siebengestirn).', tip: 'Beteigeuze leuchtet rötlich, Rigel bläulich – achte auf die Farben!' },
    { id: 'sechseck', t: 'Das Wintersechseck', e: '❄️', season: 'Winter', key: 'Beteigeuze', view: [95, 18, 86], fig: [['Sirius', 'Rigel', 'Aldebaran', 'Capella', 'Pollux', 'Prokyon', 'Sirius']], target: 'Capella', labels: ['Sirius', 'Rigel', 'Aldebaran', 'Capella', 'Pollux', 'Prokyon'],
      txt: 'Sechs der hellsten Sterne bilden ein gewaltiges Sechseck: <b>Sirius, Rigel, Aldebaran, Kapella, Pollux</b> und <b>Prokyon</b>. In der Mitte leuchtet Beteigeuze. Wer das Sechseck kennt, kennt den Winterhimmel!', tip: 'Gehe im Uhrzeigersinn vom Sirius aus – so verpasst du keinen Eckstern.' }
  ];
  var lp = new Patch($('learnCanvas')), cur = 0, anim = null, t0 = 0;
  function figVecs(fig) { return fig.map(function (pl) { return pl.map(vecOf); }); }
  function drawStep(t) {
    var st = STEPS[cur];
    lp.background({ lim: 5.2 });
    // Sternbild-Linien schwach im Hintergrund
    if (st.cons) st.cons.forEach(function (id) { lp.polylines(AE.cons[id].lines, 1, { color: 'rgba(120,160,255,.35)', width: 1, blur: 0 }); });
    var fT = Math.min(1, t / 1600);
    lp.polylines(figVecs(st.fig), fT, { color: 'rgba(140,220,255,.95)', width: 2.2 });
    lp.dots(figVecs(st.fig), Math.min(1, t / 400));
    var hT = st.hop ? Math.max(0, Math.min(1, (t - 1700) / 2200)) : 0;
    if (st.hop && hT > 0) {
      var end = lp.polylines([st.hop.map(vecOf)], hT, { color: '#ffd76a', width: 2.5, dash: [8, 7], glow: '#ffb547' });
      if (end && hT < 1) arrowHead(lp.ctx, end[0], end[1], end[2], end[3], '#ffd76a');
      if (hT >= 1) { var h = st.hop.map(vecOf), a = lp.p(h[h.length - 2]), b = lp.p(h[h.length - 1]); if (a && b) arrowHead(lp.ctx, b[0], b[1], b[0] - a[0], b[1] - a[1], '#ffd76a'); }
      if (st.ticks) {
        var A = lp.p(vecOf(st.ticks[0])), B = lp.p(vecOf(st.ticks[1])), T = lp.p(vecOf(st.target));
        if (A && B && T) {
          var dl = Math.hypot(B[0] - A[0], B[1] - A[1]), ux = (T[0] - B[0]) / Math.hypot(T[0] - B[0], T[1] - B[1]), uy = (T[1] - B[1]) / Math.hypot(T[0] - B[0], T[1] - B[1]);
          var maxn = Math.floor(Math.hypot(T[0] - B[0], T[1] - B[1]) / dl * hT + 0.05);
          lp.ctx.fillStyle = '#ffd76a'; lp.ctx.font = '700 11px "Segoe UI", sans-serif';
          for (var n = 1; n <= Math.min(5, maxn); n++) {
            var x = B[0] + ux * dl * n, y = B[1] + uy * dl * n;
            lp.ctx.beginPath(); lp.ctx.arc(x, y, 3, 0, Math.PI * 2); lp.ctx.fill();
            lp.ctx.fillText(n + '×', x + 6, y - 6);
          }
        }
      }
    }
    if (st.hop2) {
      var h2 = Math.max(0, Math.min(1, (t - 3000) / 1800));
      if (h2 > 0) lp.polylines([st.hop2.map(vecOf)], h2, { color: '#ff9ad5', width: 2.5, dash: [8, 7], glow: '#ff6ab8' });
    }
    var showT = st.hop ? 3900 : 1600;
    if (t > showT && st.target) lp.ring(vecOf(st.target), t - showT, st.hop ? '#ffd76a' : '#8affd6');
    if (t > 600) (st.labels || []).forEach(function (n) { lp.label(BY[n] ? n.replace('Vega', 'Wega').replace('Altair', 'Atair') : n, vecOf(n)); });
    if (st.targetName && t > showT) lp.label(st.targetName, vecOf(st.target), '#8affd6', 0);
  }
  function play() {
    if (anim) cancelAnimationFrame(anim);
    t0 = performance.now();
    var dur = AE.reduceMotion ? 0 : 7000;
    if (!dur) { drawStep(99999); return; }
    (function frame(now) {
      var t = now - t0; drawStep(t);
      if (t < dur) anim = requestAnimationFrame(frame); else anim = null;
    })(t0);
  }
  function whenVisible(st) {
    var n = AE.nightInfo(new Date()), now = new Date();
    var sun = AE.bodyHor('Sun', now).alt;
    var ref = sun < -6 ? now : new Date(Math.min(n.darkTo.getTime(), n.darkFrom.getTime() + 1.5 * 3600e3));
    var h = AE.vecToHor(AE.horMatrix(ref), vecOf(st.key));
    return { ref: ref, alt: h.alt, az: h.az, now: sun < -6 };
  }
  function renderSteps() {
    var ol = $('learnSteps');
    ol.innerHTML = STEPS.map(function (st, i) {
      return '<li class="learn-step glass' + (i === cur ? ' active' : '') + (store.done[st.id] ? ' done' : '') + '" data-i="' + i + '"><button class="ls-main" data-i="' + i + '"><span class="ls-num">' + (store.done[st.id] ? '✓' : i + 1) + '</span><span class="ls-t"><b>' + st.e + ' ' + st.t + '</b><small>' + st.season + '</small></span></button></li>';
    }).join('');
    var n = STEPS.filter(function (s) { return store.done[s.id]; }).length;
    var ranks = [[0, '🌱', 'Sternenneuling'], [1, '👀', 'Sternengucker'], [3, '🏹', 'Sternbild-Jäger'], [5, '🧭', 'Himmelsnavigator'], [8, '🏆', 'Sternenmeister']];
    var r = ranks.filter(function (x) { return n >= x[0]; }).pop();
    $('rankIc').textContent = r[1]; $('rankName').textContent = r[2];
    $('rankTxt').textContent = n + ' von ' + STEPS.length + ' Stationen am echten Himmel gefunden';
    $('learnBar').style.width = (n / STEPS.length * 100) + '%';
  }
  function renderText() {
    var st = STEPS[cur], w = whenVisible(st), done = !!store.done[st.id];
    var vis = w.alt > 5 ? '<span class="pill ok">' + (w.now ? 'Jetzt' : 'Heute ab ' + AE.fmtTime(w.ref) + ' Uhr') + ' sichtbar</span> ' + AE.dirText(w.az) + ', ' + AE.altText(w.alt)
      : '<span class="pill no">' + (w.now ? 'Gerade' : 'Heute Abend') + ' unter dem Horizont</span> Beste Zeit: ' + st.season;
    $('learnText').innerHTML = '<p class="eyebrow">Station ' + (cur + 1) + ' von ' + STEPS.length + '</p><h3>' + st.e + ' ' + st.t + '</h3><p>' + st.txt + '</p><p class="fun">💡 ' + st.tip + '</p><p class="vis-line small">' + vis + '</p>' +
      '<div class="learn-actions"><button class="btn ' + (done ? 'btn-ghost' : 'btn-primary') + '" id="learnDone">' + (done ? '✓ Gefunden – rückgängig' : '🔭 Am Himmel gefunden!') + '</button>' +
      (w.alt > 5 ? '<button class="mini-btn" data-show="' + w.alt.toFixed(1) + ',' + w.az.toFixed(1) + ',' + w.ref.getTime() + '">Auf der Himmelskarte zeigen →</button>' : '') +
      (cur < STEPS.length - 1 ? '<button class="chip" id="learnNext">Nächste Station →</button>' : '') + '</div>';
    $('learnDone').addEventListener('click', function () {
      if (store.done[st.id]) delete store.done[st.id]; else { store.done[st.id] = Date.now(); AE.toast('⭐ Station „' + st.t + '“ geschafft!'); }
      save(); renderSteps(); renderText();
      if (STEPS.every(function (s) { return store.done[s.id]; })) { AE.confetti($('learnSteps')); AE.toast('🏆 Glückwunsch, Sternenmeister! Du kannst den Himmel lesen.'); }
    });
    var nx = $('learnNext'); if (nx) nx.addEventListener('click', function () { select(cur + 1); });
    $('learnHint').textContent = st.hop ? 'Star-Hopping: folge der gestrichelten Linie' : 'Präge dir die Form ein';
  }
  function select(i) {
    cur = i; var st = STEPS[i];
    lp.setView(st.view[0], st.view[1], st.view[2]);
    renderSteps(); renderText(); play();
  }
  $('learnSteps').addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (b) select(+b.getAttribute('data-i')); });
  $('learnReplay').addEventListener('click', play);
  $('learnReset').addEventListener('click', function () { store.done = {}; save(); renderSteps(); renderText(); AE.toast('Fortschritt zurückgesetzt'); });

  /* ---------- Hand-Trick ---------- */
  var HANDS = [
    { id: 'finger', n: 'Kleiner Finger', deg: 1, a: 'Mizar', b: 'Mizar', txt: 'Ein kleiner Finger deckt etwa <b>1°</b> ab. Der Vollmond ist nur <b>0,5°</b> groß – er passt locker dahinter! Mizar und sein Begleiter Alkor (0,2°) verschwinden ebenfalls dahinter.' },
    { id: 'drei', n: 'Drei Finger', deg: 5, a: 'Merak', b: 'Dubhe', txt: 'Zeige-, Mittel- und Ringfinger nebeneinander ergeben rund <b>5°</b> – das ist genau der Abstand der beiden „Zeigersterne“ <b>Merak und Dubhe</b>.' },
    { id: 'faust', n: 'Faust', deg: 10, a: 'Dubhe', b: 'Megrez', txt: 'Eine Faust am ausgestreckten Arm misst etwa <b>10°</b> – so breit ist der Kasten des Großen Wagens von <b>Dubhe bis Megrez</b>. Vom Horizont bis zum Zenit sind es 9 Fäuste.' },
    { id: 'hand', n: 'Gespreizte Hand', deg: 22, a: 'Dubhe', b: 'Alkaid', txt: 'Von der Daumen- bis zur kleinen Fingerspitze sind es rund <b>20–25°</b> – fast der ganze Große Wagen von <b>Dubhe bis Alkaid</b> (26°).' }
  ];
  var hp = new Patch($('handCanvas')), hcur = 2, hanim = null;
  function drawHand(f) {
    var H = HANDS[hcur]; hp.setView(184, 57, 46);
    hp.background({ lim: 4.8 });
    hp.polylines(figVecs(WAGEN), 1, { color: 'rgba(140,220,255,.6)', width: 1.4, blur: 4 });
    hp.dots(figVecs(WAGEN), 1);
    var A = hp.p(vecOf(H.a)), B = hp.p(vecOf(H.b)), ctx = hp.ctx, u = hp.ppd;
    var ang = H.a === H.b ? 0 : Math.atan2(B[1] - A[1], B[0] - A[0]);
    var mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, L = H.deg * u;
    if (Math.cos(ang) < 0) ang += Math.PI; // Hand möglichst aufrecht
    ctx.save(); ctx.translate(mx, my); ctx.rotate(ang);
    var s = 0.6 + 0.4 * f; ctx.scale(s, s); ctx.globalAlpha = f;
    var skin = ctx.createLinearGradient(0, -8 * u, 0, 10 * u);
    skin.addColorStop(0, 'rgba(255,224,200,.55)'); skin.addColorStop(1, 'rgba(230,170,140,.35)');
    ctx.fillStyle = skin; ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.5;
    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    if (H.id === 'finger') { rr(-L / 2, -3.5 * u, L, 7.5 * u, L / 2); rr(-L / 2, 4 * u, 8 * u, 7 * u, 1.5 * u); }
    else if (H.id === 'drei') { var w = L / 3; [[-1, -3.6], [0, -4.4], [1, -3.9]].forEach(function (q) { rr(q[0] * w - w / 2, q[1] * u, w, (q[1] * -1 + 3) * u, w / 2); }); rr(-L / 2 - 0.3 * u, 3 * u, L + 2.2 * u, 7 * u, 1.5 * u); }
    else if (H.id === 'faust') { rr(-L / 2, -4 * u, L, 8.5 * u, 2.2 * u); for (var k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(-L / 2 + L / 8 + k * L / 4, -3.6 * u, L / 8.5, Math.PI, 0); ctx.stroke(); } rr(-L / 2 - 0.5 * u, 0.8 * u, L * 0.62, 2.6 * u, 1.2 * u); }
    else {
      ctx.beginPath(); ctx.ellipse(0, 7 * u, 5.5 * u, 6 * u, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      var tips = [[-L / 2, 0], [-L / 4.4, -5.5 * u], [0, -6.8 * u], [L / 4.4, -5.8 * u], [L / 2, -1 * u]];
      ctx.lineCap = 'round';
      tips.forEach(function (p, i) { var bx = (i - 2) * 2.2 * u, by = 4.5 * u; ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2.4 * u + 3; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(p[0], p[1]); ctx.stroke(); ctx.strokeStyle = 'rgba(250,205,180,.85)'; ctx.lineWidth = 2.4 * u; ctx.stroke(); });
    }
    // Messklammer
    ctx.globalAlpha = 1; ctx.strokeStyle = '#ffd76a'; ctx.fillStyle = '#ffd76a'; ctx.lineWidth = 2; ctx.shadowColor = '#ffb547'; ctx.shadowBlur = 8;
    var yb = H.id === 'hand' ? -9 * u : -6.5 * u - 6, half = Math.max(L / 2, 4);
    ctx.beginPath(); ctx.moveTo(-half, yb + 6); ctx.lineTo(-half, yb); ctx.lineTo(half, yb); ctx.lineTo(half, yb + 6); ctx.stroke();
    ctx.font = '800 15px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('≈ ' + H.deg + '°', 0, yb - 8);
    ctx.restore();
    hp.dots(figVecs(WAGEN), 1);
    [H.a, H.b].forEach(function (n) { hp.label(n, vecOf(n)); });
  }
  function playHand() {
    if (hanim) cancelAnimationFrame(hanim);
    var start = performance.now();
    (function fr(now) { var f = AE.reduceMotion ? 1 : Math.min(1, (now - start) / 600); f = 1 - Math.pow(1 - f, 3); drawHand(f); if (f < 1) hanim = requestAnimationFrame(fr); })(start);
    $('handInfo').innerHTML = '<h4>' + HANDS[hcur].n + ' ≈ ' + HANDS[hcur].deg + '°</h4><p>' + HANDS[hcur].txt + '</p>';
    $('handTabs').querySelectorAll('button').forEach(function (b, i) { b.classList.toggle('active', i === hcur); b.setAttribute('aria-selected', i === hcur); });
  }
  $('handTabs').innerHTML = HANDS.map(function (h, i) { return '<button class="chip" role="tab" data-h="' + i + '">' + ['☝️', '🤟', '✊', '🖐️'][i] + ' ' + h.n + '</button>'; }).join('');
  $('handTabs').addEventListener('click', function (e) { var b = e.target.closest('[data-h]'); if (b) { hcur = +b.getAttribute('data-h'); playHand(); } });

  /* ---------- Mini-Spiel: Finde das Sternbild ---------- */
  var POOL = ['UMa', 'Cas', 'Ori', 'Cyg', 'Leo', 'Lyr', 'Gem', 'Tau', 'Peg', 'Sco', 'Boo', 'Aur', 'Per', 'CMa', 'Her', 'Aql', 'Vir', 'Sgr', 'Cep', 'And', 'UMi', 'CrB', 'Del'];
  var fp = new Patch($('findCanvas')), game = { id: null, answered: false, score: 0, streak: 0 }, fanim = null;
  function conView(c) {
    var maxd = 0;
    c.lines.forEach(function (pl) { pl.forEach(function (v) { var d = Math.acos(Math.max(-1, Math.min(1, v[0] * c.v[0] + v[1] * c.v[1] + v[2] * c.v[2]))) / D2R; if (d > maxd) maxd = d; }); });
    // Zentrum = Mittel der Linienpunkte
    var sx = 0, sy = 0, sz = 0, n = 0; c.lines.forEach(function (pl) { pl.forEach(function (v) { sx += v[0]; sy += v[1]; sz += v[2]; n++; }); });
    var l = Math.hypot(sx, sy, sz), ra = Math.atan2(sy, sx) / D2R, dec = Math.asin(sz / l) / D2R;
    return [(ra + 360) % 360, dec, Math.max(26, Math.min(95, maxd * 2.6))];
  }
  function drawFind(f) {
    var c = AE.cons[game.id], v = conView(c);
    fp.setView(v[0], v[1], v[2]);
    fp.background({ lim: 5.3 });
    if (game.answered) {
      fp.polylines(c.lines, f, { color: 'rgba(140,220,255,.95)', width: 2 });
      fp.dots(c.lines, 1);
      if (f >= 1) { var ctx = fp.ctx; ctx.font = '800 18px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#8affd6'; ctx.shadowColor = '#000'; ctx.shadowBlur = 6; ctx.fillText(c.de.toUpperCase(), fp.W / 2, fp.H - 16); ctx.shadowBlur = 0; ctx.textAlign = 'left'; }
    }
  }
  function updateScore() { $('findScore').textContent = 'Punkte: ' + game.score + ' · Serie: ' + game.streak + ' · Rekord: ' + store.best; }
  function newRound() {
    var prev = game.id;
    do { game.id = POOL[(Math.random() * POOL.length) | 0]; } while (game.id === prev);
    game.answered = false;
    var opts = [game.id];
    while (opts.length < 4) { var o = POOL[(Math.random() * POOL.length) | 0]; if (opts.indexOf(o) < 0) opts.push(o); }
    opts.sort(function () { return Math.random() - 0.5; });
    $('findOpts').innerHTML = opts.map(function (id) { return '<button class="quiz-opt" data-c="' + id + '">' + ((window.AE_CONINFO[id] || {}).e || '✨') + ' ' + AE.cons[id].de + '</button>'; }).join('');
    $('findMsg').textContent = '';
    drawFind(0); updateScore();
  }
  $('findOpts').addEventListener('click', function (e) {
    var b = e.target.closest('[data-c]'); if (!b || game.answered) return;
    game.answered = true;
    var ok = b.getAttribute('data-c') === game.id;
    $('findOpts').querySelectorAll('.quiz-opt').forEach(function (o) { o.disabled = true; if (o.getAttribute('data-c') === game.id) o.classList.add('right'); });
    if (ok) { game.score++; game.streak++; if (game.streak > store.best) { store.best = game.streak; save(); } $('findMsg').innerHTML = '✅ Richtig! ' + (game.streak >= 3 ? '🔥 ' + game.streak + 'er-Serie!' : ''); if (game.streak % 5 === 0) AE.confetti($('findGame')); }
    else { game.streak = 0; b.classList.add('wrong'); $('findMsg').innerHTML = '❌ Das war <b>' + AE.cons[game.id].de + '</b>. Schau dir die Linien an!'; }
    updateScore();
    var start = performance.now();
    if (fanim) cancelAnimationFrame(fanim);
    (function fr(now) { var f = AE.reduceMotion ? 1 : Math.min(1, (now - start) / 1300); drawFind(f); if (f < 1) fanim = requestAnimationFrame(fr); })(start);
  });
  $('findNext').addEventListener('click', newRound);

  /* ---------- Rotlicht-Modus ---------- */
  function setRed(on) {
    document.body.classList.toggle('redlight', on); $('redExit').hidden = !on;
    $('redBtn').textContent = on ? '⚪ Rotlicht-Modus beenden' : '🔴 Rotlicht-Modus testen';
    if (on) AE.toast('🔴 Rotlicht-Modus aktiv – so schonst du nachts deine Augen.');
  }
  $('redBtn').addEventListener('click', function () { setRed(!document.body.classList.contains('redlight')); });
  $('redExit').addEventListener('click', function () { setRed(false); });

  /* ---------- Start & Größenänderung ---------- */
  function resizeAll() { lp.resize(); hp.resize(); fp.resize(); drawStep(anim ? performance.now() - t0 : 99999); drawHand(1); drawFind(game.answered ? 1 : 0); }
  var started = false;
  function start() {
    if (started) return; started = true;
    lp.resize(); hp.resize(); fp.resize();
    select(0); playHand(); newRound();
  }
  /* v10: Lernpfad, Hand-Trick und Mini-Spiel liegen in verschiedenen Kurs-Lektionen – starten, sobald eines sichtbar wird */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en, obs) { if (en.some(function (x) { return x.isIntersecting; })) { start(); obs.disconnect(); } }, { rootMargin: '200px' });
    ['learnCanvas', 'handCanvas', 'findCanvas'].forEach(function (id) { if ($(id)) io.observe($(id)); });
  } else start();
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (started) resizeAll(); }, 150); });
  AE.on('location', function () { if (started) renderText(); });
  AE._learn = { select: select, steps: STEPS, store: store };
})();
