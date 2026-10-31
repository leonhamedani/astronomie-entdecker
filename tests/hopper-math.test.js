/* Unit-Tests für js/hopper-math.js – ausführen mit: node tests/hopper-math.test.js */
'use strict';
const assert = require('assert');
const H = require('../js/hopper-math.js');
let n = 0, fail = 0;
function t(name, fn) { n++; try { fn(); console.log('✓ ' + name); } catch (e) { fail++; console.log('✗ ' + name + '\n   ' + e.message); } }
const near = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= (eps || 1e-6), (msg || '') + ' erwartet ' + b + ', erhalten ' + a);
const nearAz = (a, b, eps, msg) => assert.ok(Math.abs(H.wrap180(a - b)) <= (eps || 1e-6), (msg || '') + ' Az erwartet ' + b + ', erhalten ' + a);
const D = Math.PI / 180;

// --- Orientierung → Höhe/Azimut ---
t('flach, Oberkante nach Norden → alt 0, az 0', () => { const r = H.orientationToAltAz(0, 0, 0); near(r.alt, 0); nearAz(r.az, 0); });
t('Tubus senkrecht nach oben (beta 90) → alt 90', () => { near(H.orientationToAltAz(0, 90, 0).alt, 90); near(H.orientationToAltAz(123, 90, 37).alt, 90); });
t('45° nach Osten geneigt (alpha 270, beta 45) → alt 45, az 90', () => { const r = H.orientationToAltAz(270, 45, 0); near(r.alt, 45); nearAz(r.az, 90); });
t('flach nach Osten (alpha 270) → az 90; nach Westen (alpha 90) → az 270; Süden (alpha 180) → az 180', () => {
  nearAz(H.orientationToAltAz(270, 0, 0).az, 90); nearAz(H.orientationToAltAz(90, 0, 0).az, 270); nearAz(H.orientationToAltAz(180, 0, 0).az, 180); });
t('Rollen um den Tubus (gamma) ändert die Blickrichtung nicht', () => {
  for (const g of [-89, -60, -30, 0, 30, 60, 89]) { const r = H.orientationToAltAz(300, 30, g); near(r.alt, 30, 1e-9); nearAz(r.az, 60, 1e-9); } });
t('Handy auf der Seite am Tubus (gamma 90) und 20° hoch nach Süden', () => { const r = H.orientationToAltAz(180, 20, 90); near(r.alt, 20); nearAz(r.az, 180); });
t('über den Zenit hinaus (beta 120, alpha 0) → alt 60, az 180', () => { const r = H.orientationToAltAz(0, 120, 0); near(r.alt, 60); nearAz(r.az, 180); });
t('nach unten (beta −30) → alt −30', () => near(H.orientationToAltAz(0, -30, 0).alt, -30));
t('Spiegelung: Oberkante nach hinten → entgegengesetzte Richtung', () => {
  const r = H.orientationToAltAz(0, -40, 0, true); near(r.alt, 40); nearAz(r.az, 180);
  const f = H.orientationToAltAz(77, 12, 5), b = H.orientationToAltAz(77, 12, 5, true); near(b.alt, -f.alt); nearAz(b.az, f.az + 180); });
t('Rotationsmatrix ist orthonormal und hat det 1', () => {
  const R = H.rotationMatrix(33, -71, 48);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { let s = 0; for (let k = 0; k < 3; k++) s += R[k][i] * R[k][j]; near(s, i === j ? 1 : 0, 1e-12); }
  const det = R[0][0] * (R[1][1] * R[2][2] - R[1][2] * R[2][1]) - R[0][1] * (R[1][0] * R[2][2] - R[1][2] * R[2][0]) + R[0][2] * (R[1][0] * R[2][1] - R[1][1] * R[2][0]);
  near(det, 1, 1e-12); });
t('Matrix = Rz·Rx·Ry explizit nachgerechnet', () => {
  const a = 40 * D, b = 25 * D, g = -15 * D;
  const Rz = [[Math.cos(a), -Math.sin(a), 0], [Math.sin(a), Math.cos(a), 0], [0, 0, 1]], Rx = [[1, 0, 0], [0, Math.cos(b), -Math.sin(b)], [0, Math.sin(b), Math.cos(b)]], Ry = [[Math.cos(g), 0, Math.sin(g)], [0, 1, 0], [-Math.sin(g), 0, Math.cos(g)]];
  const mm = (A, B) => A.map((r, i) => B[0].map((_, j) => r.reduce((s, _, k) => s + A[i][k] * B[k][j], 0)));
  const E = mm(mm(Rz, Rx), Ry), R = H.rotationMatrix(40, 25, -15);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) near(R[i][j], E[i][j], 1e-12); });
t('Quaternion und Matrix liefern dieselbe Blickrichtung (500 Zufallslagen)', () => {
  let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 500; i++) { const a = r() * 360, b = r() * 360 - 180, g = r() * 180 - 90; const v = H.qRotate(H.quaternion(a, b, g), [0, 1, 0]), w = H.pointingVector(a, b, g); for (let k = 0; k < 3; k++) near(v[k], w[k], 1e-9); } });
t('Simulation: altAzToOrientation ist die Umkehrung (auch gespiegelt)', () => {
  for (const [alt, az] of [[0, 0], [45, 90], [12.5, 359.9], [-5, 181], [89, 270], [60, 0.1]]) for (const rev of [false, true]) {
    const o = H.altAzToOrientation(alt, az, rev), r = H.orientationToAltAz(o.alpha, o.beta, o.gamma, rev); near(r.alt, alt, 1e-9); if (alt < 89.9) nearAz(r.az, az, 1e-9); } });

// --- Hilfsfunktionen ---
t('wrap180 / norm360', () => { near(H.wrap180(350), -10); near(H.wrap180(-190), 170); near(H.wrap180(180), -180); near(H.norm360(-10), 350); near(H.norm360(725), 5); });
t('Winkelabstand: Pol, Horizont, über 0°/360°', () => { near(H.separation(0, 0, 90, 123), 90); near(H.separation(0, 359, 0, 1), 2, 1e-9); near(H.separation(10, 0, 10, 180), 160, 1e-9); near(H.separation(30, 10, 30, 10), 0); });

// --- Ausrichtung & Delta ---
t('Ausrichtung: Versatz über 0°/360° hinweg (Sensor 355°, Wahrheit 5°) → dAz +10', () => {
  const off = H.computeOffset({ alt: 30, az: 355 }, { alt: 31.5, az: 5 }); near(off.dAz, 10); near(off.dAlt, 1.5);
  const c = H.applyOffset({ alt: 30, az: 355 }, off); near(c.alt, 31.5); nearAz(c.az, 5);
  const c2 = H.applyOffset({ alt: 10, az: 352 }, off); nearAz(c2.az, 2); near(c2.alt, 11.5); });
t('Ausrichtung: umgekehrt (Sensor 3°, Wahrheit 350°) → dAz −13', () => { const off = H.computeOffset({ alt: 20, az: 3 }, { alt: 20, az: 350 }); near(off.dAz, -13); nearAz(H.applyOffset({ alt: 0, az: 1 }, off).az, 348); });
t('Ausrichtung: relativer Modus mit beliebigem Startwinkel', () => {
  // wahre Richtung az 200, Sensor (Gyro-Bezug zufällig) meldet 47 → danach Drehung um +30° am Sensor = +30° am Himmel
  const off = H.computeOffset({ alt: 25, az: 47 }, { alt: 25, az: 200 }); nearAz(H.applyOffset({ alt: 25, az: 77 }, off).az, 230); });
t('Versatz über den Zenit wird gespiegelt', () => { const c = H.applyOffset({ alt: 88, az: 10 }, { dAlt: 4, dAz: 0 }); near(c.alt, 88); nearAz(c.az, 190); });
t('Delta: hoch/rechts mit Wrap (aktuell 350°, Ziel 10°) → rechts +20', () => { const d = H.delta({ alt: 20, az: 350 }, { alt: 32.4, az: 10 }); near(d.up, 12.4); near(d.right, 20); });
t('Delta: links (aktuell 10°, Ziel 350°) → rechts −20', () => { const d = H.delta({ alt: 40, az: 10 }, { alt: 30, az: 350 }); near(d.up, -10); near(d.right, -20); });
t('Delta: genau gegenüber → |rechts| = 180, Abstand korrekt', () => { const d = H.delta({ alt: 0, az: 0 }, { alt: 0, az: 180 }); near(Math.abs(d.right), 180); near(d.dist, 180); });
t('Delta-Abstand berücksichtigt cos(Höhe): 10° Azimut auf 60° Höhe ≈ 5°', () => near(H.delta({ alt: 60, az: 100 }, { alt: 60, az: 110 }).dist, 4.98, 0.02));

// --- Glättung ---
t('Glättung springt nicht bei 359°→1°', () => {
  const sm = new H.Smoother(0.3); let last;
  for (const az of [358, 359, 359.5, 0.2, 0.8, 1.5, 2]) { last = H.vecToAltAz(sm.push(H.altAzToVec(30, az))); assert.ok(H.wrap180(last.az - 0) > -3 && H.wrap180(last.az) < 3, 'az ' + last.az); } });
t('Mittelwert über 0°/360° und Streuung', () => {
  const m = H.meanAltAz([{ alt: 10, az: 359 }, { alt: 10, az: 1 }]); nearAz(m.az, 0, 1e-9); near(m.alt, 10, 2e-3);
  near(H.spread([{ alt: 10, az: 359 }, { alt: 10, az: 1 }]), 0.985, 0.01); });
t('Refraktion: ~0,5° am Horizont, ~0 im Zenit', () => { near(H.refraction(0), 0.48, 0.03); near(H.refraction(90), 0, 0.001); near(H.refraction(45), 0.0165, 0.002); });

console.log('\n' + (n - fail) + ' von ' + n + ' Tests bestanden');
process.exit(fail ? 1 : 0);
