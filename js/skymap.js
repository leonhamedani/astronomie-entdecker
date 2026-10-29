/* Interaktive Live-Sternkarte (stereografische Projektion, Horizontsystem) */
(function () {
  'use strict';
  var A = window.Astronomy, D2R = AE.D2R, R2D = AE.R2D;
  var stage = document.getElementById('skyStage');
  var cv = document.getElementById('skyCanvas');
  var ctx = cv.getContext('2d');
  var tip = document.getElementById('skyTip');
  var infoEl = document.getElementById('skyInfo');
  var slider = document.getElementById('timeSlider');
  var timeLabel = document.getElementById('timeLabel');
  var dateLabel = document.getElementById('dateLabel');
  var liveBtn = document.getElementById('liveBtn');
  var playBtn = document.getElementById('playBtn');

  var W = 0, H = 0, dpr = 1;
  var view = { az: 180, alt: 90, zoom: 1 };
  var opts = { lines: true, conNames: true, starNames: true, planets: true, grid: false };
  var state = { time: new Date(), live: true, playing: false, hoverCon: null, pinned: null };
  var projStars = [], projBodies = [], projCons = [], projSegs = [];
  var dirty = false;

  var PLANETS = [
    { id: 'Mercury', de: 'Merkur', col: '#c9b9a6', e: '☿' }, { id: 'Venus', de: 'Venus', col: '#fff3c4', e: '♀' },
    { id: 'Mars', de: 'Mars', col: '#ff8a5c', e: '♂' }, { id: 'Jupiter', de: 'Jupiter', col: '#ffe0b0', e: '♃' },
    { id: 'Saturn', de: 'Saturn', col: '#f3d58b', e: '♄' }, { id: 'Uranus', de: 'Uranus', col: '#a8f0ff', e: '⛢' },
    { id: 'Neptune', de: 'Neptun', col: '#7fa6ff', e: '♆' }];
  AE.PLANETS = PLANETS;

  function resize() {
    var r = stage.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(200, r.width); H = Math.max(200, r.height);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    request();
  }
  function request() { if (!dirty) { dirty = true; requestAnimationFrame(render); } }

  /* ---------- Projektion ---------- */
  var V = {};
  function setupView() {
    var z0 = view.az * D2R, a0 = view.alt * D2R;
    V.r = [Math.cos(z0), -Math.sin(z0), 0];
    V.d = [Math.cos(a0) * Math.sin(z0), Math.cos(a0) * Math.cos(z0), Math.sin(a0)];
    V.u = [-Math.sin(a0) * Math.sin(z0), -Math.sin(a0) * Math.cos(z0), Math.cos(a0)];
    V.S = Math.min(W, H) / 4.15 * view.zoom;
    V.cx = W / 2; V.cy = H / 2;
  }
  // Eingabe: Horizontvektor E,N,U
  function proj(E, N, U, out) {
    var X = E * V.r[0] + N * V.r[1] + U * V.r[2];
    var Y = E * V.u[0] + N * V.u[1] + U * V.u[2];
    var Z = E * V.d[0] + N * V.d[1] + U * V.d[2];
    out = out || {};
    out.z = Z;
    if (Z < -0.92) { out.ok = false; return out; }
    var k = 2 / (1 + Z) * V.S;
    out.x = V.cx + X * k; out.y = V.cy - Y * k; out.ok = true;
    return out;
  }
  function projAltAz(alt, az, out) {
    var a = alt * D2R, z = az * D2R, c = Math.cos(a);
    return proj(c * Math.sin(z), c * Math.cos(z), Math.sin(a), out);
  }
  var M; // Rotationsmatrix
  function hv(v, out) { // J2000-Vektor -> E,N,U
    var x = M[0][0] * v[0] + M[1][0] * v[1] + M[2][0] * v[2];
    var y = M[0][1] * v[0] + M[1][1] * v[1] + M[2][1] * v[2];
    var z = M[0][2] * v[0] + M[1][2] * v[1] + M[2][2] * v[2];
    out[0] = -y; out[1] = x; out[2] = z; return out;
  }
  function onScreen(p, m) { m = m || 0; return p.ok && p.x > -m && p.x < W + m && p.y > -m && p.y < H + m; }

  /* ---------- Zeichnen ---------- */
  function render() {
    dirty = false;
    if (!W) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    setupView();
    var t = state.time;
    M = AE.horMatrix(t);
    var sun = AE.bodyHor('Sun', t);
    var sAlt = sun.alt;

    // Himmelshintergrund nach Sonnenstand
    var top, bot;
    if (sAlt > 0) { top = '#1b4c8f'; bot = '#5b8fd1'; }
    else if (sAlt > -6) { top = '#14244f'; bot = '#3e4f86'; }
    else if (sAlt > -12) { top = '#0a1233'; bot = '#1c2552'; }
    else if (sAlt > -18) { top = '#060a22'; bot = '#0f1638'; }
    else { top = '#03050f'; bot = '#0a0f2a'; }
    var g = ctx.createRadialGradient(V.cx, V.cy, 0, V.cx, V.cy, Math.max(W, H) * 0.75);
    g.addColorStop(0, top); g.addColorStop(1, bot);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    var lim = sAlt > 0 ? 1.0 : sAlt > -6 ? 1 + (-sAlt / 6) * 2 : sAlt > -12 ? 3 + (-sAlt - 6) / 6 * 1.5 : sAlt > -18 ? 4.5 + (-sAlt - 12) / 6 * 1.3 : 5.8;
    var dayDim = sAlt > 0 ? 0.35 : 1;

    var tmp = [0, 0, 0], p = {};
    if (opts.grid) drawGrid();

    // Sternbildlinien
    projSegs = [];
    if (opts.lines) {
      ctx.lineWidth = 1.1;
      for (var id in AE.cons) {
        var c = AE.cons[id];
        var hl = state.hoverCon === id;
        ctx.strokeStyle = hl ? 'rgba(140,220,255,0.95)' : 'rgba(120,160,255,' + (0.38 * dayDim) + ')';
        ctx.lineWidth = hl ? 2 : 1.1;
        if (hl) { ctx.shadowColor = 'rgba(120,200,255,0.9)'; ctx.shadowBlur = 8; }
        ctx.beginPath();
        for (var s = 0; s < c.lines.length; s++) {
          var seg = c.lines[s], prev = null;
          for (var k = 0; k < seg.length; k++) {
            hv(seg[k], tmp);
            var q = proj(tmp[0], tmp[1], tmp[2], {});
            q.alt = tmp[2];
            if (prev && prev.ok && q.ok && prev.z > -0.6 && q.z > -0.6) {
              var dx = q.x - prev.x, dy = q.y - prev.y;
              if (dx * dx + dy * dy < W * W) {
                ctx.moveTo(prev.x, prev.y); ctx.lineTo(q.x, q.y);
                if (prev.alt > -0.02 || q.alt > -0.02) projSegs.push([prev.x, prev.y, q.x, q.y, id]);
              }
            }
            prev = q;
          }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    // Sterne
    projStars = [];
    var magScale = Math.min(1.8, 0.85 + Math.log(view.zoom) * 0.35 + 0.15);
    var labelLim = 1.7 + Math.log2(view.zoom) * 1.1;
    var labels = [];
    for (var i = 0; i < AE.stars.length; i++) {
      var st = AE.stars[i];
      if (st.mag > lim + Math.log2(view.zoom) * 0.6) continue;
      hv(st.v, tmp);
      proj(tmp[0], tmp[1], tmp[2], p);
      if (!onScreen(p, 10)) continue;
      var rad = Math.max(0.45, (6.3 - st.mag) * 0.5 * magScale);
      var alpha = Math.min(1, 0.35 + (lim - st.mag) * 0.35) * dayDim;
      if (st.mag < 2.2) {
        var gg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad * 4);
        gg.addColorStop(0, st.col.replace('rgb', 'rgba').replace(')', ',' + 0.45 * alpha + ')'));
        gg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(p.x, p.y, rad * 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = alpha;
      ctx.fillStyle = st.col;
      ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      if (tmp[2] > -0.02) projStars.push({ x: p.x, y: p.y, s: st, alt: Math.asin(tmp[2]) * R2D, az: (Math.atan2(tmp[0], tmp[1]) * R2D + 360) % 360, r: rad });
      if (opts.starNames && st.name && st.mag < labelLim && tmp[2] > -0.05) labels.push([st.name, p.x + rad + 4, p.y + 4]);
    }

    // Sternbildnamen
    projCons = [];
    if (opts.conNames) {
      ctx.font = '600 ' + (11 + Math.min(4, view.zoom)) + 'px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      for (var cid in AE.cons) {
        var cc = AE.cons[cid];
        if (cc.rank > 2 && view.zoom < 1.6) continue;
        hv(cc.v, tmp);
        if (tmp[2] < -0.05) continue;
        proj(tmp[0], tmp[1], tmp[2], p);
        if (!onScreen(p, -10)) continue;
        ctx.fillStyle = state.hoverCon === cid ? 'rgba(170,230,255,1)' : 'rgba(150,180,255,' + 0.6 * dayDim + ')';
        var label = cc.de.toUpperCase();
        ctx.fillText(label, p.x, p.y);
        projCons.push({ x: p.x, y: p.y, id: cid, w: ctx.measureText(label).width });
      }
      ctx.textAlign = 'left';
    }

    // Sternnamen
    ctx.font = '12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,236,190,' + 0.85 * dayDim + ')';
    labels.forEach(function (l) { ctx.fillText(l[0], l[1], l[2]); });

    // Sonne, Mond, Planeten
    projBodies = [];
    var bodies = [{ id: 'Sun', de: 'Sonne', col: '#ffd36a', r: 11 }, { id: 'Moon', de: 'Mond', col: '#f1f1ff', r: 9 }];
    if (opts.planets) bodies = bodies.concat(PLANETS);
    bodies.forEach(function (b) {
      var h = AE.bodyHor(b.id, t);
      var q = projAltAz(h.alt, h.az, {});
      if (!onScreen(q, 20)) return;
      var mag = b.id === 'Sun' ? -26.7 : A.Illumination(b.id, t).mag;
      var r = b.r || Math.max(2.5, Math.min(7, (6 - mag) * 0.9));
      var gl = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r * 3.5);
      gl.addColorStop(0, b.col); gl.addColorStop(0.35, b.col + '66'); gl.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(q.x, q.y, r * 3.5, 0, Math.PI * 2); ctx.fill();
      if (b.id === 'Moon') drawMoon(q.x, q.y, r, t);
      else { ctx.fillStyle = b.col; ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, Math.PI * 2); ctx.fill(); }
      ctx.font = '600 12px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = b.col; ctx.fillText(b.de, q.x + r + 5, q.y - r);
      if (h.alt > -1) projBodies.push({ x: q.x, y: q.y, b: b, alt: h.alt, az: h.az, mag: mag, r: r });
    });

    drawGround();
    drawCompass();
    updateInfo(sAlt);
  }

  function drawMoon(x, y, r, t) {
    var ph = AE.moonPhase(t);
    ctx.save();
    ctx.fillStyle = '#2a2d3f'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f4f2e6';
    var k = Math.cos(ph.angle * D2R); // 1 Neumond, -1 Vollmond
    ctx.beginPath();
    // beleuchtete Seite: zunehmend rechts, abnehmend links (Sicht von der Nordhalbkugel)
    ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2, !ph.waxing);
    ctx.ellipse(x, y, Math.max(0.01, Math.abs(k) * r), r, 0, Math.PI / 2, -Math.PI / 2, ph.waxing ? k > 0 : k <= 0);
    ctx.fill();
    ctx.restore();
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(120,140,200,0.18)'; ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    var p = {};
    [15, 30, 45, 60, 75].forEach(function (alt) {
      ctx.beginPath(); var first = true;
      for (var az = 0; az <= 360; az += 3) {
        projAltAz(alt, az, p);
        if (!p.ok) { first = true; continue; }
        if (first) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        first = false;
      }
      ctx.stroke();
    });
    for (var az2 = 0; az2 < 360; az2 += 30) {
      ctx.beginPath(); var f = true;
      for (var al = 0; al <= 88; al += 4) {
        projAltAz(al, az2, p);
        if (!p.ok) { f = true; continue; }
        if (f) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        f = false;
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  function circle3(a, b, c) {
    var d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
    if (Math.abs(d) < 1e-9) return null;
    var a2 = a.x * a.x + a.y * a.y, b2 = b.x * b.x + b.y * b.y, c2 = c.x * c.x + c.y * c.y;
    var ux = (a2 * (b.y - c.y) + b2 * (c.y - a.y) + c2 * (a.y - b.y)) / d;
    var uy = (a2 * (c.x - b.x) + b2 * (a.x - c.x) + c2 * (b.x - a.x)) / d;
    return { x: ux, y: uy, r: Math.hypot(a.x - ux, a.y - uy) };
  }
  function drawGround() {
    var a = projAltAz(0, view.az, {}), b = projAltAz(0, view.az + 90, {}), c = projAltAz(0, view.az - 90, {});
    var circ = circle3(a, b, c);
    if (!circ) return;
    var nad = projAltAz(-90, 0, {});
    var inside = nad.ok && Math.hypot(nad.x - circ.x, nad.y - circ.y) < circ.r;
    ctx.save();
    ctx.beginPath();
    if (inside) ctx.arc(circ.x, circ.y, circ.r, 0, Math.PI * 2);
    else { ctx.rect(-10, -10, W + 20, H + 20); ctx.moveTo(circ.x + circ.r, circ.y); ctx.arc(circ.x, circ.y, circ.r, 0, Math.PI * 2); }
    var gg = ctx.createLinearGradient(0, a.y - 10, 0, H);
    gg.addColorStop(0, 'rgba(14,26,24,0.93)'); gg.addColorStop(1, 'rgba(4,8,8,0.97)');
    ctx.fillStyle = inside ? gg : 'rgba(8,16,16,0.94)';
    ctx.fill('evenodd');
    ctx.restore();
    // Horizontlinie mit Glühen
    ctx.save();
    ctx.strokeStyle = 'rgba(120,255,210,0.55)'; ctx.lineWidth = 1.5; ctx.shadowColor = 'rgba(90,255,200,0.8)'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(circ.x, circ.y, circ.r, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  function drawCompass() {
    var names = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];
    var p = {};
    ctx.textAlign = 'center';
    for (var i = 0; i < 8; i++) {
      projAltAz(-2.5, i * 45, p);
      if (!onScreen(p, -12)) {
        projAltAz(-0.5, i * 45, p);
        if (!onScreen(p, -12)) continue;
      }
      var main = i % 2 === 0;
      ctx.font = (main ? '700 17px' : '600 12px') + ' "Segoe UI", system-ui, sans-serif';
      if (main) {
        ctx.fillStyle = 'rgba(10,20,30,0.7)';
        ctx.beginPath(); ctx.arc(p.x, p.y + 1, 14, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = i === 0 ? '#ff7a7a' : main ? '#8affd6' : 'rgba(140,255,214,0.7)';
      ctx.fillText(names[i], p.x, p.y + (main ? 7 : 4));
    }
    ctx.textAlign = 'left';
  }

  function updateInfo(sAlt) {
    var phase = sAlt > 0 ? '☀️ Tag – Sterne sind nicht sichtbar' : sAlt > -6 ? '🌇 Bürgerliche Dämmerung' : sAlt > -12 ? '🌆 Nautische Dämmerung' : sAlt > -18 ? '🌌 Astronomische Dämmerung' : '🌑 Astronomische Nacht';
    infoEl.innerHTML = '<span>' + AE.esc(AE.loc.name || 'Eigener Standort') + ' · ' + AE.fmtNum(AE.loc.lat, 2) + '°, ' + AE.fmtNum(AE.loc.lon, 2) + '°</span><span>' + phase + ' (Sonne ' + AE.fmtNum(sAlt, 0) + '°)</span>';
    timeLabel.textContent = AE.fmtTime(state.time) + ' Uhr';
    dateLabel.textContent = AE.fmtDate(state.time);
  }

  /* ---------- Interaktion ---------- */
  var pointers = {}, dragStart = null, pinchStart = null, moved = false;
  cv.addEventListener('pointerdown', function (e) {
    cv.setPointerCapture(e.pointerId);
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    var ids = Object.keys(pointers);
    if (ids.length === 1) { dragStart = { x: e.clientX, y: e.clientY, az: view.az, alt: view.alt }; moved = false; }
    if (ids.length === 2) {
      var p1 = pointers[ids[0]], p2 = pointers[ids[1]];
      pinchStart = { d: Math.hypot(p1.x - p2.x, p1.y - p2.y), zoom: view.zoom };
    }
  });
  cv.addEventListener('pointermove', function (e) {
    var r = cv.getBoundingClientRect();
    if (pointers[e.pointerId]) {
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pointers);
      if (ids.length === 2 && pinchStart) {
        var p1 = pointers[ids[0]], p2 = pointers[ids[1]];
        setZoom(pinchStart.zoom * Math.hypot(p1.x - p2.x, p1.y - p2.y) / pinchStart.d);
        moved = true; return;
      }
      if (dragStart) {
        var dx = e.clientX - dragStart.x, dy = e.clientY - dragStart.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
        if (moved) {
          var S = Math.min(W, H) / 4.15 * view.zoom;
          view.az = ((dragStart.az - dx / S * R2D) % 360 + 360) % 360;
          view.alt = Math.max(2, Math.min(90, dragStart.alt + dy / S * R2D));
          hideTip(); request();
          return;
        }
      }
    }
    if (e.pointerType === 'mouse') hover(e.clientX - r.left, e.clientY - r.top, false);
  });
  function endPointer(e) {
    var wasDrag = moved;
    delete pointers[e.pointerId];
    if (Object.keys(pointers).length < 2) pinchStart = null;
    if (Object.keys(pointers).length === 0) {
      dragStart = null;
      if (!wasDrag && e.type === 'pointerup') {
        var r = cv.getBoundingClientRect();
        click(e.clientX - r.left, e.clientY - r.top);
      }
    }
  }
  cv.addEventListener('pointerup', endPointer);
  cv.addEventListener('pointercancel', endPointer);
  cv.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && !state.pinned) { hideTip(); setHoverCon(null); } });
  cv.addEventListener('wheel', function (e) { e.preventDefault(); setZoom(view.zoom * Math.exp(-e.deltaY * 0.0015)); }, { passive: false });

  function setZoom(z) { view.zoom = Math.max(0.7, Math.min(14, z)); request(); }
  function setHoverCon(id) { if (state.hoverCon !== id) { state.hoverCon = id; request(); } }

  function findStar(x, y, maxD) {
    var best = null, bd = maxD * maxD;
    projBodies.forEach(function (o) { var d = (o.x - x) * (o.x - x) + (o.y - y) * (o.y - y); if (d < bd + o.r * o.r) { bd = d; best = { body: o }; } });
    if (best) return best;
    for (var i = 0; i < projStars.length; i++) {
      var o = projStars[i], d2 = (o.x - x) * (o.x - x) + (o.y - y) * (o.y - y) - o.r * o.r * 0.5 - (3 - o.s.mag) * 4;
      if (d2 < bd) { bd = d2; best = { star: o }; }
    }
    return best;
  }
  function segDist(px, py, s) {
    var vx = s[2] - s[0], vy = s[3] - s[1], wx = px - s[0], wy = py - s[1];
    var l2 = vx * vx + vy * vy, t = l2 ? Math.max(0, Math.min(1, (wx * vx + wy * vy) / l2)) : 0;
    return Math.hypot(px - (s[0] + t * vx), py - (s[1] + t * vy));
  }
  function findCon(x, y) {
    var best = null, bd = 9;
    projSegs.forEach(function (s) { var d = segDist(x, y, s); if (d < bd) { bd = d; best = s[4]; } });
    if (best) return best;
    projCons.forEach(function (c) { if (Math.abs(c.x - x) < c.w / 2 + 6 && Math.abs(c.y - 4 - y) < 12) best = c.id; });
    return best;
  }
  function tipHtml(hit) {
    if (hit.body) {
      var o = hit.body;
      return '<b>' + o.b.de + '</b><small>' + (o.b.id === 'Sun' ? 'Unser Stern' : o.b.id === 'Moon' ? 'Erdtrabant · ' + AE.moonPhase(state.time).name : 'Planet') + '</small>' +
        '<div class="kv"><span>Helligkeit</span><span>' + AE.fmtNum(o.mag, 1) + ' mag</span><span>Höhe</span><span>' + AE.fmtNum(o.alt, 1) + '°</span><span>Azimut</span><span>' + AE.fmtNum(o.az, 1) + '° (' + AE.dirName(o.az) + ')</span></div>';
    }
    var s = hit.star.s, con = AE.cons[s.con];
    var title = s.name || s.desig || 'Stern';
    var sub = [s.name && s.desig ? s.desig : '', con ? 'im Sternbild ' + con.de : ''].filter(Boolean).join(' · ');
    return '<b>' + AE.esc(title) + '</b>' + (sub ? '<small>' + AE.esc(sub) + '</small>' : '') +
      '<div class="kv"><span>Helligkeit</span><span>' + AE.fmtNum(s.mag, 2) + ' mag</span><span>Höhe</span><span>' + AE.fmtNum(hit.star.alt, 1) + '°</span><span>Azimut</span><span>' + AE.fmtNum(hit.star.az, 1) + '° (' + AE.dirName(hit.star.az) + ')</span></div>' +
      (con ? '<button class="tip-btn" data-con="' + s.con + '">Sternbild ' + AE.esc(con.de) + ' entdecken →</button>' : '');
  }
  function showTip(x, y, html, pinned) {
    tip.innerHTML = html; tip.hidden = false;
    tip.classList.toggle('pinned', !!pinned);
    var tw = tip.offsetWidth, th = tip.offsetHeight;
    var lx = x + 16, ly = y + 16;
    if (lx + tw > W - 8) lx = x - tw - 16;
    if (ly + th > H - 8) ly = y - th - 16;
    tip.style.transform = 'translate(' + Math.max(6, lx) + 'px,' + Math.max(6, ly) + 'px)';
  }
  function hideTip() { tip.hidden = true; state.pinned = null; }
  function hover(x, y) {
    if (state.pinned) return;
    var hit = findStar(x, y, 10);
    if (hit) { showTip(x, y, tipHtml(hit), false); cv.style.cursor = 'pointer'; setHoverCon(hit.star ? hit.star.s.con || null : null); return; }
    hideTip();
    var c = findCon(x, y);
    setHoverCon(c);
    cv.style.cursor = c ? 'pointer' : 'grab';
    if (c) showTip(x, y, '<b>' + AE.esc(AE.cons[c].de) + '</b><small>' + AE.esc(AE.cons[c].la) + ' · Klicken für Infokarte</small>', false);
  }
  function click(x, y) {
    var hit = findStar(x, y, 14);
    if (hit) { showTip(x, y, tipHtml(hit), true); state.pinned = hit; return; }
    var c = findCon(x, y);
    hideTip();
    if (c) AE.openConstellation(c);
  }
  tip.addEventListener('click', function (e) {
    var b = e.target.closest('[data-con]');
    if (b) { AE.openConstellation(b.getAttribute('data-con')); hideTip(); }
  });

  /* ---------- Werkzeugleiste ---------- */
  document.querySelectorAll('[data-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-toggle'); opts[k] = !opts[k];
      b.classList.toggle('active', opts[k]); b.setAttribute('aria-pressed', opts[k]);
      request();
    });
  });
  document.querySelectorAll('[data-view]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-view');
      if (v === 'zenith') animateView(180, 90, 1); else animateView(+v, 28, 1.6);
    });
  });
  function animateView(az, alt, zoom) {
    var s = { az: view.az, alt: view.alt, zoom: view.zoom }, t0 = performance.now(), dur = AE.reduceMotion ? 1 : 700;
    var daz = ((az - s.az + 540) % 360) - 180;
    (function step(t) {
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      view.az = (s.az + daz * e + 360) % 360; view.alt = s.alt + (alt - s.alt) * e; view.zoom = s.zoom + (zoom - s.zoom) * e;
      request();
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  AE.skyLookAt = function (alt, az) { animateView(az, Math.max(8, Math.min(80, alt)), 1.8); document.getElementById('himmelskarte').scrollIntoView({ behavior: 'smooth' }); };
  document.getElementById('zoomIn').addEventListener('click', function () { setZoom(view.zoom * 1.35); });
  document.getElementById('zoomOut').addEventListener('click', function () { setZoom(view.zoom / 1.35); });
  document.getElementById('fullscreenBtn').addEventListener('click', function () {
    var wrap = stage.closest('.sky-wrap');
    if (document.fullscreenElement) document.exitFullscreen();
    else if (wrap.requestFullscreen) wrap.requestFullscreen().catch(function () {});
  });
  document.addEventListener('fullscreenchange', function () { setTimeout(resize, 50); });

  /* ---------- Zeitsteuerung ---------- */
  var night;
  function setupSlider() {
    night = AE.nightInfo(new Date());
    var mins = Math.round((night.winEnd - night.winStart) / 60000);
    slider.max = mins;
    var ticks = document.getElementById('timeTicks');
    ticks.innerHTML = '';
    var firstHour = new Date(Math.ceil(night.winStart.getTime() / 3600e3) * 3600e3);
    for (var t = firstHour.getTime(); t <= night.winEnd.getTime(); t += 3600e3) {
      var pos = (t - night.winStart.getTime()) / (night.winEnd - night.winStart) * 100;
      var hr = AE.fmtTime(new Date(t)).slice(0, 2);
      var el = document.createElement('span'); el.style.left = pos + '%'; el.textContent = (+hr % 2 === 0) ? hr : '';
      ticks.appendChild(el);
    }
    syncSlider();
  }
  function syncSlider() {
    var m = (state.time - night.winStart) / 60000;
    slider.value = Math.max(0, Math.min(+slider.max, m));
    var pct = slider.value / slider.max * 100;
    slider.style.setProperty('--p', pct + '%');
  }
  function setTime(d, live) {
    state.time = d; state.live = !!live;
    liveBtn.classList.toggle('active', state.live);
    syncSlider(); request();
    AE.emit('skytime', d);
  }
  slider.addEventListener('input', function () {
    stopPlay();
    setTime(new Date(night.winStart.getTime() + slider.value * 60000), false);
  });
  liveBtn.addEventListener('click', function () { stopPlay(); setTime(new Date(), true); });
  var playTimer = null;
  function stopPlay() { if (playTimer) { clearInterval(playTimer); playTimer = null; } playBtn.textContent = '▶'; playBtn.setAttribute('aria-label', 'Zeitraffer abspielen'); }
  playBtn.addEventListener('click', function () {
    if (playTimer) { stopPlay(); return; }
    if (+slider.value >= +slider.max) slider.value = 0;
    playBtn.textContent = '⏸'; playBtn.setAttribute('aria-label', 'Zeitraffer anhalten');
    playTimer = setInterval(function () {
      var v = +slider.value + 4;
      if (v > +slider.max) { stopPlay(); return; }
      setTime(new Date(night.winStart.getTime() + v * 60000), false);
    }, 60);
  });
  setInterval(function () { if (state.live) setTime(new Date(), true); }, 30000);

  AE.on('location', function () {
    document.getElementById('skyPlace').textContent = AE.loc.name || 'dir';
    setupSlider(); request();
  });

  AE.initSky = function () {
    document.getElementById('skyPlace').textContent = AE.loc.name || 'dir';
    setupSlider();
    setTime(new Date(), true);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);
    resize();
  };
  // Für Tests
  AE._sky = { view: view, state: state, opts: opts, projStars: function () { return projStars; }, setTime: setTime, request: request };
})();
