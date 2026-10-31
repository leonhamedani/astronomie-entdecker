/* Star-Hopper – reine Mathematik (ohne DOM), auch unter Node testbar (tests/hopper-math.test.js).
   Eigene Umsetzung; Idee „Handy aufs Teleskop legen“ nach AstroHopper (A. Beilis).

   Gerätekoordinaten (W3C DeviceOrientation): x = rechts, y = obere Handykante, z = aus dem Bildschirm.
   Erdkoordinaten: X = Ost, Y = Nord, Z = Zenit.
   Drehung Gerät → Erde: R = Rz(alpha) · Rx(beta) · Ry(gamma)  (intrinsisch Z-X'-Y'').
   Das Handy liegt auf dem Tubus, die obere Kante zeigt in Blickrichtung → Blickrichtung = R · (0, 1, 0). */
(function (root, factory) {
  var M = factory();
  if (typeof module === 'object' && module.exports) module.exports = M;
  else { root.AE = root.AE || {}; root.AE.HM = M; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var D2R = Math.PI / 180, R2D = 180 / Math.PI;

  function norm360(a) { a = a % 360; return a < 0 ? a + 360 : a; }
  function wrap180(a) { a = norm360(a); return a >= 180 ? a - 360 : a; }

  // Vollständige Rotationsmatrix (Zeilen) aus alpha, beta, gamma in Grad
  function rotationMatrix(alpha, beta, gamma) {
    var a = (alpha || 0) * D2R, b = (beta || 0) * D2R, g = (gamma || 0) * D2R;
    var ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cg = Math.cos(g), sg = Math.sin(g);
    return [
      [ca * cg - sa * sb * sg, -sa * cb, ca * sg + sa * sb * cg],
      [sa * cg + ca * sb * sg, ca * cb, sa * sg - ca * sb * cg],
      [-cb * sg, sb, cb * cg]
    ];
  }
  // Quaternion (w, x, y, z) derselben Drehung – z. B. für spätere AbsoluteOrientationSensor-Nutzung
  function quaternion(alpha, beta, gamma) {
    var a = (alpha || 0) * D2R / 2, b = (beta || 0) * D2R / 2, g = (gamma || 0) * D2R / 2;
    var qz = [Math.cos(a), 0, 0, Math.sin(a)], qx = [Math.cos(b), Math.sin(b), 0, 0], qy = [Math.cos(g), 0, Math.sin(g), 0];
    return qmul(qmul(qz, qx), qy);
  }
  function qmul(p, q) {
    return [p[0] * q[0] - p[1] * q[1] - p[2] * q[2] - p[3] * q[3],
      p[0] * q[1] + p[1] * q[0] + p[2] * q[3] - p[3] * q[2],
      p[0] * q[2] - p[1] * q[3] + p[2] * q[0] + p[3] * q[1],
      p[0] * q[3] + p[1] * q[2] - p[2] * q[1] + p[3] * q[0]];
  }
  function qRotate(q, v) {
    var w = q[0], x = q[1], y = q[2], z = q[3];
    var ix = w * v[0] + y * v[2] - z * v[1], iy = w * v[1] + z * v[0] - x * v[2], iz = w * v[2] + x * v[1] - y * v[0], iw = -x * v[0] - y * v[1] - z * v[2];
    return [ix * w + iw * -x + iy * -z - iz * -y, iy * w + iw * -y + iz * -x - ix * -z, iz * w + iw * -z + ix * -y - iy * -x];
  }

  /* Blickrichtung des Tubus als Einheitsvektor [Ost, Nord, Oben].
     reversed = true: obere Handykante zeigt nach hinten (zum Okular). */
  function pointingVector(alpha, beta, gamma, reversed) {
    var R = rotationMatrix(alpha, beta, gamma), s = reversed ? -1 : 1;
    return [s * R[0][1], s * R[1][1], s * R[2][1]];
  }
  function vecToAltAz(v) {
    var n = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
    var alt = Math.asin(Math.max(-1, Math.min(1, v[2] / n))) * R2D;
    var az = norm360(Math.atan2(v[0], v[1]) * R2D);
    return { alt: alt, az: az };
  }
  function altAzToVec(alt, az) {
    var a = alt * D2R, z = az * D2R;
    return [Math.cos(a) * Math.sin(z), Math.cos(a) * Math.cos(z), Math.sin(a)];
  }
  function orientationToAltAz(alpha, beta, gamma, reversed) { return vecToAltAz(pointingVector(alpha, beta, gamma, reversed)); }
  // Umkehrung für die Simulation: Lage eines Handys (gamma = 0), dessen Oberkante nach alt/az zeigt
  function altAzToOrientation(alt, az, reversed) {
    if (reversed) { alt = -alt; az = az + 180; }
    return { alpha: norm360(-az), beta: alt, gamma: 0 };
  }

  // Winkelabstand zweier Richtungen (Grad), numerisch stabil (Haversine)
  function separation(alt1, az1, alt2, az2) {
    var p1 = alt1 * D2R, p2 = alt2 * D2R, dl = (az2 - az1) * D2R;
    var h = Math.pow(Math.sin((p2 - p1) / 2), 2) + Math.cos(p1) * Math.cos(p2) * Math.pow(Math.sin(dl / 2), 2);
    return 2 * Math.asin(Math.min(1, Math.sqrt(h))) * R2D;
  }

  /* Ausrichtung an einem bekannten Objekt: Versatz zwischen Sensor und Wahrheit.
     Höhe: konstanter Versatz (Handy liegt nicht exakt parallel zum Tubus).
     Azimut: Versatz des (relativen oder magnetischen) Nordens, Ergebnis in −180…+180. */
  function computeOffset(sensor, truth) { return { dAlt: truth.alt - sensor.alt, dAz: wrap180(truth.az - sensor.az) }; }
  function applyOffset(sensor, off) {
    if (!off) return { alt: sensor.alt, az: norm360(sensor.az) };
    var alt = sensor.alt + off.dAlt, az = sensor.az + off.dAz;
    // über den Zenit hinaus → auf die andere Seite spiegeln
    if (alt > 90) { alt = 180 - alt; az += 180; } else if (alt < -90) { alt = -180 - alt; az += 180; }
    return { alt: alt, az: norm360(az) };
  }
  // Wie weit muss der Tubus noch bewegt werden? up > 0 = nach oben, right > 0 = nach rechts (im Uhrzeigersinn von oben)
  function delta(cur, target) {
    return { up: target.alt - cur.alt, right: wrap180(target.az - cur.az), dist: separation(cur.alt, cur.az, target.alt, target.az) };
  }

  // Glättung auf dem Einheitsvektor – kein Sprung bei 0°/360°
  function Smoother(k) { this.k = k == null ? 0.25 : k; this.v = null; }
  Smoother.prototype.push = function (v) {
    if (!this.v) this.v = v.slice();
    else { var k = this.k; for (var i = 0; i < 3; i++) this.v[i] += k * (v[i] - this.v[i]); }
    var n = Math.sqrt(this.v[0] * this.v[0] + this.v[1] * this.v[1] + this.v[2] * this.v[2]) || 1;
    return [this.v[0] / n, this.v[1] / n, this.v[2] / n];
  };
  Smoother.prototype.reset = function () { this.v = null; };
  // Mittelwert mehrerer Richtungen (für die 3-Sekunden-Messung)
  function meanAltAz(list) {
    var s = [0, 0, 0];
    list.forEach(function (p) { var v = altAzToVec(p.alt, p.az); s[0] += v[0]; s[1] += v[1]; s[2] += v[2]; });
    return vecToAltAz(s);
  }
  // Streuung (max. Abstand zum Mittel) – zeigt Wackeln an
  function spread(list) {
    var m = meanAltAz(list), mx = 0;
    list.forEach(function (p) { mx = Math.max(mx, separation(m.alt, m.az, p.alt, p.az)); });
    return mx;
  }
  // Astronomische Refraktion (Bennett), Grad – Sterne erscheinen am Horizont etwas höher
  function refraction(alt) {
    if (alt < -1) return 0;
    var r = 1.02 / Math.tan((alt + 10.3 / (alt + 5.11)) * D2R) / 60;
    return r > 0 ? r : 0;
  }

  return { norm360: norm360, wrap180: wrap180, rotationMatrix: rotationMatrix, quaternion: quaternion, qRotate: qRotate,
    pointingVector: pointingVector, vecToAltAz: vecToAltAz, altAzToVec: altAzToVec, orientationToAltAz: orientationToAltAz,
    altAzToOrientation: altAzToOrientation, separation: separation, computeOffset: computeOffset, applyOffset: applyOffset,
    delta: delta, Smoother: Smoother, meanAltAz: meanAltAz, spread: spread, refraction: refraction };
});
