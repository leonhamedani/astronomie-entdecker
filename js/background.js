/* Animiertes Parallax-Sternenfeld mit Sternschnuppen */
(function () {
  'use strict';
  var cv = document.getElementById('bg-stars');
  var ctx = cv.getContext('2d');
  var W, H, dpr, layers = [], shooters = [], mx = 0, my = 0, tmx = 0, tmy = 0, scrollY = 0;
  var reduce = window.AE && AE.reduceMotion;
  // Handy/Tablet: weniger Sterne, 30 fps, seltener Sternschnuppen (schont Akku)
  var lite = window.innerWidth <= 760 || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  var lastW = 0, lastH = 0;

  function resize() {
    // Mobile Browser feuern beim Ein-/Ausblenden der Adressleiste „resize“ – dann nicht neu würfeln
    if (lastW && window.innerWidth === lastW && Math.abs(window.innerHeight - lastH) < 160) return;
    lastW = window.innerWidth; lastH = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var area = W * H / (lite ? 1.8 : 1);
    layers = [
      { depth: 0.15, stars: make(Math.round(area / 3500), 0.3, 0.9) },
      { depth: 0.35, stars: make(Math.round(area / 9000), 0.6, 1.4) },
      { depth: 0.7, stars: make(Math.round(area / 26000), 1.0, 2.1) }
    ];
  }
  function make(n, rmin, rmax) {
    var arr = [];
    var tints = ['255,255,255', '200,215,255', '255,236,210', '180,200,255', '255,220,190'];
    for (var i = 0; i < n; i++) {
      arr.push({ x: Math.random() * W, y: Math.random() * H * 1.6, r: rmin + Math.random() * (rmax - rmin),
        a: 0.35 + Math.random() * 0.65, tw: Math.random() * Math.PI * 2, sp: 0.5 + Math.random() * 2, c: tints[(Math.random() * tints.length) | 0] });
    }
    return arr;
  }
  function spawnShooter() {
    var fromLeft = Math.random() < 0.5;
    var ang = (fromLeft ? 25 : 155) + (Math.random() * 20 - 10);
    shooters.push({ x: fromLeft ? Math.random() * W * 0.6 : W * 0.4 + Math.random() * W * 0.6, y: Math.random() * H * 0.45,
      vx: Math.cos(ang * Math.PI / 180) * (9 + Math.random() * 6), vy: Math.sin(ang * Math.PI / 180) * (9 + Math.random() * 6), life: 0, max: 50 + Math.random() * 40 });
  }
  var last = 0, nextShoot = 1500;
  function frame(t) {
    if (lite && t - last < 30) { if (!document.hidden) requestAnimationFrame(frame); return; }
    var dt = Math.min(50, t - last); last = t;
    mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
    ctx.clearRect(0, 0, W, H);
    for (var l = 0; l < layers.length; l++) {
      var L = layers[l], ox = mx * L.depth * 30, oy = -scrollY * L.depth * 0.35 + my * L.depth * 20;
      var st = L.stars;
      for (var i = 0; i < st.length; i++) {
        var s = st[i];
        var y = ((s.y + oy) % (H * 1.6) + H * 1.6) % (H * 1.6) - H * 0.3;
        if (y < -5 || y > H + 5) continue;
        var x = ((s.x + ox) % W + W) % W;
        var a = reduce ? s.a : s.a * (0.65 + 0.35 * Math.sin(s.tw + t * 0.001 * s.sp));
        ctx.fillStyle = 'rgba(' + s.c + ',' + a.toFixed(3) + ')';
        if (s.r > 1.5) {
          ctx.beginPath(); ctx.arc(x, y, s.r, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(' + s.c + ',' + (a * 0.15).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(x, y, s.r * 3, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillRect(x - s.r / 2, y - s.r / 2, s.r, s.r);
        }
      }
    }
    if (!reduce) {
      nextShoot -= dt;
      if (nextShoot <= 0) { spawnShooter(); nextShoot = (lite ? 6000 : 2500) + Math.random() * 5000; }
      for (var k = shooters.length - 1; k >= 0; k--) {
        var sh = shooters[k]; sh.life++; sh.x += sh.vx; sh.y += sh.vy;
        var p = sh.life / sh.max, alpha = p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.8;
        var g = ctx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx * 12, sh.y - sh.vy * 12);
        g.addColorStop(0, 'rgba(255,255,255,' + alpha + ')'); g.addColorStop(0.3, 'rgba(160,200,255,' + alpha * 0.5 + ')'); g.addColorStop(1, 'rgba(160,200,255,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(sh.x, sh.y); ctx.lineTo(sh.x - sh.vx * 12, sh.y - sh.vy * 12); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')'; ctx.beginPath(); ctx.arc(sh.x, sh.y, 1.6, 0, Math.PI * 2); ctx.fill();
        if (sh.life >= sh.max) shooters.splice(k, 1);
      }
    }
    if (!document.hidden) requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { last = performance.now(); requestAnimationFrame(frame); } });
  window.addEventListener('resize', resize);
  window.addEventListener('scroll', function () { scrollY = window.scrollY; }, { passive: true });
  window.addEventListener('pointermove', function (e) { tmx = (e.clientX / W - 0.5) * 2; tmy = (e.clientY / H - 0.5) * 2; }, { passive: true });
  resize();
  requestAnimationFrame(frame);
})();
