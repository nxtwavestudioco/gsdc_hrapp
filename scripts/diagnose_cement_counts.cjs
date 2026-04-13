#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function loadEnv(file) {
  try {
    const txt = fs.readFileSync(file, 'utf8');
    const lines = txt.split(/\r?\n/);
    const out = {};
    for (const l of lines) {
      const m = l.match(/^\s*([^=\s]+)=(.*)$/);
      if (m) out[m[1]] = m[2];
    }
    return out;
  } catch (e) { return {}; }
}

const repoRoot = path.resolve(__dirname, '..');
const env = loadEnv(path.join(repoRoot, '.env'));
const API_BASE = env.VITE_API_BASE_URL || process.env.VITE_API_BASE_URL;
const API_KEY = env.VITE_API_KEY || process.env.VITE_API_KEY;

if (!API_BASE) {
  console.error('Missing VITE_API_BASE_URL in .env or environment.');
  process.exit(2);
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'x-api-key': API_KEY } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

function containsCement(str) {
  if (!str) return false;
  return /cement/i.test(String(str));
}

(async function main(){
  try {
    console.log('Using API base:', API_BASE);
    const dash = await fetchJson(`${API_BASE.replace(/\/+$/,'')}/dashboard/summary`);
    console.log('\nDashboard summary rows matching BU ~ CEMENT:');
    let dashSum = 0;
    for (const r of dash) {
      if (containsCement(r.BU)) {
        const pg = String(r.PositionGroup || '');
        if (/DRIVER|HELPER/i.test(pg)) {
          console.log('  ', r.BU, '|', pg, '|', r.TotalCount);
          dashSum += Number(r.TotalCount || 0);
        } else {
          console.log('  (other) ', r.BU, '|', pg, '|', r.TotalCount);
        }
      }
    }
    console.log('\nDashboard aggregated drivers+helpers for CEMENT:', dashSum);

    // fetch employees and compute a comparable count
    const employees = await fetchJson(`${API_BASE.replace(/\/+$/,'')}/employees`);
    let empCount = 0;
    for (const e of employees) {
      const bu = e.BU || e.bu || '';
      const pos = e.Position || e.position || '';
      if (containsCement(bu) && /driver|helper/i.test(String(pos))) empCount += 1;
    }
    console.log('Employees endpoint drivers+helpers for CEMENT:', empCount);

    // Also print raw employees that have cement but not matched position
    const missing = employees.filter(e => containsCement(e.BU || e.bu || '') && !/driver|helper/i.test(String(e.Position || e.position || '')));
    console.log('\nEmployees with BU ~ CEMENT but position NOT driver/helper: count=', missing.length);
    if (missing.length > 0) console.log('Sample:', missing.slice(0,10).map(m => ({ id: m.id || m.KAMIId || m.KamiId, BU: m.BU||m.bu, Position: m.Position||m.position }))); 

  } catch (err) {
    console.error('Error during diagnostic:', err && err.stack ? err.stack : String(err));
    process.exit(3);
  }
})();
