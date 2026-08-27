// Adds full per-game GAME_LOG to all 20 Lebanon players who have appeared in
// this qualifying campaign (Marc Khoueiry has 0 GP, skipped). Same shape as
// Korea's (see scripts/patchKoreaGameLogs.js): opp/date/rd/MIN/PTS/FGM/FGA/FGP/
// P2M/P2A/P2P/P3M/P3A/P3P/FTM/FTA/FTP/OREB/DREB/REB/AST/PF/TO/STL/BLK/PM/EFF.
// Merges into existing `stats` (fetch-then-PATCH).
//
// Usage:  node scripts/patchLebanonGameLogs.js [player name to test one]
const https = require('https');

const SUPA_URL = process.env.SUPABASE_URL || 'https://fywefclozclsaeccufyb.supabase.co';
const KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_UpUSQ5ZM3CNZDzrykUvSmw_RKVFxmfd';

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body !== undefined ? JSON.stringify(body) : null;
    const url = new URL(SUPA_URL + path);
    const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);
    const r = https.request(url, { method, headers }, (res) => {
      let d = ''; res.on('data', (c) => (d += c));
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error(`${method} ${path} -> ${res.statusCode}: ${d}`));
        try { resolve(d ? JSON.parse(d) : null); } catch { resolve(d); }
      });
    });
    r.on('error', reject); if (payload) r.write(payload); r.end();
  });
}
const get = (path) => req('GET', path);
const patch = (path, body) => req('PATCH', path, body);

const rd = 'First Round';
const GAME_LOGS = {
  'Dedric Lawson': [
    { opp: 'QAT', date: '2025-11-27', rd, MIN: 36, PTS: 9, FGM: 3, FGA: 8, FGP: 37.5, P2M: 2, P2A: 3, P2P: 66.7, P3M: 1, P3A: 5, P3P: 20.0, FTM: 2, FTA: 4, FTP: 50.0, OREB: 0, DREB: 12, REB: 12, AST: 2, PF: 3, TO: 1, STL: 1, BLK: 1, PM: 7, EFF: 17 },
    { opp: 'QAT', date: '2025-11-30', rd, MIN: 35, PTS: 17, FGM: 5, FGA: 14, FGP: 35.7, P2M: 5, P2A: 8, P2P: 62.5, P3M: 0, P3A: 6, P3P: 0, FTM: 7, FTA: 7, FTP: 100.0, OREB: 2, DREB: 9, REB: 11, AST: 2, PF: 3, TO: 1, STL: 0, BLK: 0, PM: -1, EFF: 20 },
    { opp: 'KSA', date: '2026-02-27', rd, MIN: 25, PTS: 17, FGM: 8, FGA: 12, FGP: 66.7, P2M: 8, P2A: 12, P2P: 66.7, P3M: 0, P3A: 0, P3P: null, FTM: 1, FTA: 3, FTP: 33.3, OREB: 4, DREB: 9, REB: 13, AST: 6, PF: 2, TO: 2, STL: 1, BLK: 2, PM: 32, EFF: 31 },
  ],
  'Wael Arakji': [
    { opp: 'QAT', date: '2025-11-27', rd, MIN: 32, PTS: 19, FGM: 7, FGA: 17, FGP: 41.2, P2M: 6, P2A: 14, P2P: 42.9, P3M: 1, P3A: 3, P3P: 33.3, FTM: 4, FTA: 7, FTP: 57.1, OREB: 1, DREB: 6, REB: 7, AST: 2, PF: 2, TO: 4, STL: 1, BLK: 0, PM: 9, EFF: 12 },
    { opp: 'QAT', date: '2025-11-30', rd, MIN: 34, PTS: 21, FGM: 7, FGA: 13, FGP: 53.8, P2M: 6, P2A: 8, P2P: 75.0, P3M: 1, P3A: 5, P3P: 20.0, FTM: 6, FTA: 6, FTP: 100.0, OREB: 0, DREB: 3, REB: 3, AST: 8, PF: 4, TO: 3, STL: 1, BLK: 0, PM: 4, EFF: 24 },
    { opp: 'KSA', date: '2026-02-27', rd, MIN: 26, PTS: 18, FGM: 6, FGA: 9, FGP: 66.7, P2M: 5, P2A: 6, P2P: 83.3, P3M: 1, P3A: 3, P3P: 33.3, FTM: 5, FTA: 5, FTP: 100.0, OREB: 0, DREB: 3, REB: 3, AST: 5, PF: 1, TO: 1, STL: 0, BLK: 0, PM: 39, EFF: 22 },
  ],
  'Sergio El Darwich': [
    { opp: 'QAT', date: '2025-11-27', rd, MIN: 31, PTS: 7, FGM: 2, FGA: 6, FGP: 33.3, P2M: 2, P2A: 5, P2P: 40.0, P3M: 0, P3A: 1, P3P: 0, FTM: 3, FTA: 4, FTP: 75.0, OREB: 1, DREB: 4, REB: 5, AST: 7, PF: 2, TO: 4, STL: 2, BLK: 2, PM: 2, EFF: 14 },
    { opp: 'QAT', date: '2025-11-30', rd, MIN: 30, PTS: 14, FGM: 6, FGA: 11, FGP: 54.5, P2M: 6, P2A: 10, P2P: 60.0, P3M: 0, P3A: 1, P3P: 0, FTM: 2, FTA: 6, FTP: 33.3, OREB: 3, DREB: 3, REB: 6, AST: 5, PF: 2, TO: 2, STL: 1, BLK: 0, PM: 4, EFF: 15 },
    { opp: 'KSA', date: '2026-02-27', rd, MIN: null, PTS: 0, FGM: 0, FGA: 0, FGP: null, P2M: 0, P2A: 0, P2P: null, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 0, REB: 0, AST: 0, PF: 0, TO: 0, STL: 0, BLK: 0, PM: 0, EFF: 0 },
    { opp: 'IND', date: '2026-06-29', rd, MIN: 25, PTS: 9, FGM: 2, FGA: 8, FGP: 25.0, P2M: 1, P2A: 5, P2P: 20.0, P3M: 1, P3A: 3, P3P: 33.3, FTM: 4, FTA: 6, FTP: 66.7, OREB: 1, DREB: 6, REB: 7, AST: 6, PF: 1, TO: 1, STL: 0, BLK: 0, PM: 30, EFF: 13 },
    { opp: 'KSA', date: '2026-07-02', rd, MIN: 23, PTS: 19, FGM: 5, FGA: 9, FGP: 55.6, P2M: 3, P2A: 6, P2P: 50.0, P3M: 2, P3A: 3, P3P: 66.7, FTM: 7, FTA: 7, FTP: 100.0, OREB: 1, DREB: 2, REB: 3, AST: 1, PF: 3, TO: 0, STL: 2, BLK: 0, PM: 2, EFF: 21 },
    { opp: 'IND', date: '2026-07-05', rd, MIN: 30, PTS: 19, FGM: 8, FGA: 12, FGP: 66.7, P2M: 6, P2A: 7, P2P: 85.7, P3M: 2, P3A: 5, P3P: 40.0, FTM: 1, FTA: 1, FTP: 100.0, OREB: 0, DREB: 4, REB: 4, AST: 4, PF: 2, TO: 2, STL: 2, BLK: 0, PM: 26, EFF: 23 },
  ],
  'Ater Majok': [
    { opp: 'IND', date: '2026-06-29', rd, MIN: 25, PTS: 8, FGM: 3, FGA: 4, FGP: 75.0, P2M: 3, P2A: 4, P2P: 75.0, P3M: 0, P3A: 0, P3P: null, FTM: 2, FTA: 2, FTP: 100.0, OREB: 1, DREB: 7, REB: 8, AST: 0, PF: 2, TO: 1, STL: 0, BLK: 2, PM: 35, EFF: 16 },
    { opp: 'KSA', date: '2026-07-02', rd, MIN: 23, PTS: 4, FGM: 2, FGA: 3, FGP: 66.7, P2M: 2, P2A: 3, P2P: 66.7, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 0, FTP: null, OREB: 2, DREB: 3, REB: 5, AST: 1, PF: 4, TO: 4, STL: 1, BLK: 0, PM: 13, EFF: 6 },
    { opp: 'IND', date: '2026-07-05', rd, MIN: 20, PTS: 7, FGM: 3, FGA: 4, FGP: 75.0, P2M: 3, P2A: 4, P2P: 75.0, P3M: 0, P3A: 0, P3P: null, FTM: 1, FTA: 2, FTP: 50.0, OREB: 0, DREB: 5, REB: 5, AST: 1, PF: 1, TO: 1, STL: 0, BLK: 3, PM: 18, EFF: 13 },
  ],
  'Hayk Gyokchyan': [
    { opp: 'KSA', date: '2026-02-27', rd, MIN: 21, PTS: 4, FGM: 2, FGA: 4, FGP: 50.0, P2M: 2, P2A: 3, P2P: 66.7, P3M: 0, P3A: 1, P3P: 0, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 6, REB: 6, AST: 3, PF: 1, TO: 0, STL: 1, BLK: 4, PM: 10, EFF: 16 },
    { opp: 'IND', date: '2026-06-29', rd, MIN: 17, PTS: 16, FGM: 6, FGA: 8, FGP: 75.0, P2M: 2, P2A: 3, P2P: 66.7, P3M: 4, P3A: 5, P3P: 80.0, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 2, REB: 2, AST: 2, PF: 1, TO: 2, STL: 1, BLK: 0, PM: 20, EFF: 17 },
    { opp: 'KSA', date: '2026-07-02', rd, MIN: 28, PTS: 6, FGM: 2, FGA: 7, FGP: 28.6, P2M: 0, P2A: 2, P2P: 0, P3M: 2, P3A: 5, P3P: 40.0, FTM: 0, FTA: 0, FTP: null, OREB: 1, DREB: 3, REB: 4, AST: 1, PF: 4, TO: 3, STL: 0, BLK: 0, PM: 0, EFF: 3 },
  ],
  'Omar Jamaleddine': [
    { opp: 'KSA', date: '2026-02-27', rd, MIN: 19, PTS: 8, FGM: 3, FGA: 8, FGP: 37.5, P2M: 1, P2A: 2, P2P: 50.0, P3M: 2, P3A: 6, P3P: 33.3, FTM: 0, FTA: 0, FTP: null, OREB: 1, DREB: 3, REB: 4, AST: 3, PF: 3, TO: 1, STL: 0, BLK: 0, PM: 30, EFF: 9 },
    { opp: 'IND', date: '2026-06-29', rd, MIN: 18, PTS: 6, FGM: 2, FGA: 7, FGP: 28.6, P2M: 2, P2A: 5, P2P: 40.0, P3M: 0, P3A: 2, P3P: 0, FTM: 2, FTA: 4, FTP: 50.0, OREB: 1, DREB: 1, REB: 2, AST: 2, PF: 1, TO: 0, STL: 4, BLK: 0, PM: 24, EFF: 7 },
    { opp: 'KSA', date: '2026-07-02', rd, MIN: 27, PTS: 4, FGM: 2, FGA: 9, FGP: 22.2, P2M: 2, P2A: 6, P2P: 33.3, P3M: 0, P3A: 3, P3P: 0, FTM: 0, FTA: 0, FTP: null, OREB: 2, DREB: 5, REB: 7, AST: 3, PF: 3, TO: 1, STL: 1, BLK: 0, PM: 4, EFF: 7 },
  ],
  'Youssef Khayat': [
    { opp: 'QAT', date: '2025-11-27', rd, MIN: 23, PTS: 9, FGM: 4, FGA: 9, FGP: 44.4, P2M: 3, P2A: 5, P2P: 60.0, P3M: 1, P3A: 4, P3P: 25.0, FTM: 0, FTA: 0, FTP: null, OREB: 2, DREB: 4, REB: 6, AST: 0, PF: 4, TO: 2, STL: 1, BLK: 0, PM: 8, EFF: 9 },
    { opp: 'QAT', date: '2025-11-30', rd, MIN: 17, PTS: 5, FGM: 2, FGA: 6, FGP: 33.3, P2M: 1, P2A: 2, P2P: 50.0, P3M: 1, P3A: 4, P3P: 25.0, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 6, REB: 6, AST: 1, PF: 1, TO: 1, STL: 0, BLK: 1, PM: 5, EFF: 8 },
    { opp: 'KSA', date: '2026-02-27', rd, MIN: 23, PTS: 12, FGM: 4, FGA: 8, FGP: 50.0, P2M: 4, P2A: 7, P2P: 57.1, P3M: 0, P3A: 1, P3P: 0, FTM: 4, FTA: 8, FTP: 50.0, OREB: 4, DREB: 6, REB: 10, AST: 2, PF: 0, TO: 2, STL: 0, BLK: 0, PM: 33, EFF: 14 },
  ],
  'Karim Zeinoun': [
    { opp: 'QAT', date: '2025-11-27', rd, MIN: 17, PTS: 9, FGM: 4, FGA: 7, FGP: 57.1, P2M: 4, P2A: 6, P2P: 66.7, P3M: 0, P3A: 1, P3P: 0, FTM: 1, FTA: 2, FTP: 50.0, OREB: 2, DREB: 2, REB: 4, AST: 2, PF: 2, TO: 2, STL: 2, BLK: 0, PM: -10, EFF: 11 },
    { opp: 'QAT', date: '2025-11-30', rd, MIN: 23, PTS: 10, FGM: 3, FGA: 5, FGP: 60.0, P2M: 1, P2A: 3, P2P: 33.3, P3M: 2, P3A: 2, P3P: 100.0, FTM: 2, FTA: 2, FTP: 100.0, OREB: 0, DREB: 0, REB: 0, AST: 1, PF: 2, TO: 2, STL: 0, BLK: 0, PM: -10, EFF: 7 },
    { opp: 'IND', date: '2026-06-29', rd, MIN: 19, PTS: 10, FGM: 4, FGA: 5, FGP: 80.0, P2M: 2, P2A: 2, P2P: 100.0, P3M: 2, P3A: 3, P3P: 66.7, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 0, REB: 0, AST: 2, PF: 1, TO: 0, STL: 0, BLK: 0, PM: 15, EFF: 11 },
    { opp: 'KSA', date: '2026-07-02', rd, MIN: 11, PTS: 3, FGM: 1, FGA: 3, FGP: 33.3, P2M: 0, P2A: 1, P2P: 0, P3M: 1, P3A: 2, P3P: 50.0, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 0, REB: 0, AST: 1, PF: 1, TO: 0, STL: 0, BLK: 0, PM: -9, EFF: 2 },
    { opp: 'IND', date: '2026-07-05', rd, MIN: 25, PTS: 14, FGM: 5, FGA: 9, FGP: 55.6, P2M: 1, P2A: 2, P2P: 50.0, P3M: 4, P3A: 7, P3P: 57.1, FTM: 0, FTA: 0, FTP: null, OREB: 1, DREB: 3, REB: 4, AST: 2, PF: 5, TO: 2, STL: 0, BLK: 0, PM: 19, EFF: 14 },
  ],
  'Gerard Hadidian': [
    { opp: 'QAT', date: '2025-11-27', rd, MIN: 22, PTS: 8, FGM: 1, FGA: 3, FGP: 33.3, P2M: 1, P2A: 3, P2P: 33.3, P3M: 0, P3A: 0, P3P: null, FTM: 6, FTA: 6, FTP: 100.0, OREB: 0, DREB: 2, REB: 2, AST: 1, PF: 4, TO: 1, STL: 1, BLK: 0, PM: 11, EFF: 9 },
    { opp: 'QAT', date: '2025-11-30', rd, MIN: 30, PTS: 9, FGM: 4, FGA: 5, FGP: 80.0, P2M: 4, P2A: 5, P2P: 80.0, P3M: 0, P3A: 0, P3P: null, FTM: 1, FTA: 2, FTP: 50.0, OREB: 0, DREB: 4, REB: 4, AST: 0, PF: 3, TO: 0, STL: 0, BLK: 1, PM: 8, EFF: 12 },
    { opp: 'KSA', date: '2026-02-27', rd, MIN: 15, PTS: 7, FGM: 3, FGA: 6, FGP: 50.0, P2M: 3, P2A: 6, P2P: 50.0, P3M: 0, P3A: 0, P3P: null, FTM: 1, FTA: 1, FTP: 100.0, OREB: 1, DREB: 1, REB: 2, AST: 2, PF: 3, TO: 2, STL: 0, BLK: 1, PM: -2, EFF: 7 },
    { opp: 'IND', date: '2026-06-29', rd, MIN: 12, PTS: 5, FGM: 2, FGA: 3, FGP: 66.7, P2M: 2, P2A: 3, P2P: 66.7, P3M: 0, P3A: 0, P3P: null, FTM: 1, FTA: 2, FTP: 50.0, OREB: 3, DREB: 2, REB: 5, AST: 1, PF: 0, TO: 0, STL: 1, BLK: 0, PM: 7, EFF: 10 },
    { opp: 'KSA', date: '2026-07-02', rd, MIN: 12, PTS: 9, FGM: 3, FGA: 6, FGP: 50.0, P2M: 2, P2A: 5, P2P: 40.0, P3M: 1, P3A: 1, P3P: 100.0, FTM: 2, FTA: 2, FTP: 100.0, OREB: 1, DREB: 1, REB: 2, AST: 0, PF: 3, TO: 0, STL: 0, BLK: 0, PM: -12, EFF: 8 },
    { opp: 'IND', date: '2026-07-05', rd, MIN: 20, PTS: 14, FGM: 6, FGA: 10, FGP: 60.0, P2M: 6, P2A: 10, P2P: 60.0, P3M: 0, P3A: 0, P3P: null, FTM: 2, FTA: 2, FTP: 100.0, OREB: 3, DREB: 3, REB: 6, AST: 0, PF: 1, TO: 1, STL: 1, BLK: 2, PM: 8, EFF: 18 },
  ],
  'Amir Saoud': [
    { opp: 'QAT', date: '2025-11-27', rd, MIN: 13, PTS: 4, FGM: 1, FGA: 3, FGP: 33.3, P2M: 0, P2A: 1, P2P: 0, P3M: 1, P3A: 2, P3P: 50.0, FTM: 1, FTA: 2, FTP: 50.0, OREB: 0, DREB: 0, REB: 0, AST: 2, PF: 0, TO: 2, STL: 1, BLK: 0, PM: -4, EFF: 2 },
    { opp: 'QAT', date: '2025-11-30', rd, MIN: 16, PTS: 7, FGM: 3, FGA: 6, FGP: 50.0, P2M: 2, P2A: 2, P2P: 100.0, P3M: 1, P3A: 4, P3P: 25.0, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 4, REB: 4, AST: 3, PF: 2, TO: 3, STL: 0, BLK: 0, PM: -5, EFF: 8 },
    { opp: 'KSA', date: '2026-02-27', rd, MIN: 16, PTS: 9, FGM: 4, FGA: 7, FGP: 57.1, P2M: 3, P2A: 5, P2P: 60.0, P3M: 1, P3A: 2, P3P: 50.0, FTM: 0, FTA: 0, FTP: null, OREB: 1, DREB: 2, REB: 3, AST: 4, PF: 1, TO: 3, STL: 0, BLK: 0, PM: 0, EFF: 10 },
    { opp: 'IND', date: '2026-06-29', rd, MIN: 15, PTS: 11, FGM: 4, FGA: 8, FGP: 50.0, P2M: 3, P2A: 5, P2P: 60.0, P3M: 1, P3A: 3, P3P: 33.3, FTM: 2, FTA: 2, FTP: 100.0, OREB: 0, DREB: 0, REB: 0, AST: 2, PF: 0, TO: 1, STL: 1, BLK: 0, PM: 13, EFF: 9 },
    { opp: 'KSA', date: '2026-07-02', rd, MIN: 25, PTS: 25, FGM: 8, FGA: 11, FGP: 72.7, P2M: 6, P2A: 8, P2P: 75.0, P3M: 2, P3A: 3, P3P: 66.7, FTM: 7, FTA: 7, FTP: 100.0, OREB: 0, DREB: 2, REB: 2, AST: 3, PF: 1, TO: 2, STL: 1, BLK: 0, PM: 18, EFF: 26 },
    { opp: 'IND', date: '2026-07-05', rd, MIN: 18, PTS: 2, FGM: 0, FGA: 3, FGP: 0, P2M: 0, P2A: 1, P2P: 0, P3M: 0, P3A: 2, P3P: 0, FTM: 2, FTA: 2, FTP: 100.0, OREB: 0, DREB: 3, REB: 3, AST: 7, PF: 0, TO: 3, STL: 0, BLK: 0, PM: 13, EFF: 6 },
  ],
  'Ali Mansour': [
    { opp: 'IND', date: '2026-06-29', rd, MIN: 18, PTS: 7, FGM: 3, FGA: 4, FGP: 75.0, P2M: 2, P2A: 3, P2P: 66.7, P3M: 1, P3A: 1, P3P: 100.0, FTM: 0, FTA: 0, FTP: null, OREB: 1, DREB: 4, REB: 5, AST: 4, PF: 1, TO: 2, STL: 4, BLK: 0, PM: 24, EFF: 17 },
    { opp: 'KSA', date: '2026-07-02', rd, MIN: 16, PTS: 5, FGM: 2, FGA: 6, FGP: 33.3, P2M: 1, P2A: 5, P2P: 20.0, P3M: 1, P3A: 1, P3P: 100.0, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 2, REB: 2, AST: 5, PF: 1, TO: 1, STL: 1, BLK: 0, PM: 9, EFF: 8 },
    { opp: 'IND', date: '2026-07-05', rd, MIN: null, PTS: 0, FGM: 0, FGA: 0, FGP: null, P2M: 0, P2A: 0, P2P: null, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 0, REB: 0, AST: 0, PF: 0, TO: 0, STL: 0, BLK: 0, PM: 0, EFF: 0 },
  ],
  'Ali Mezher': [
    { opp: 'QAT', date: '2025-11-27', rd, MIN: 8, PTS: 0, FGM: 0, FGA: 0, FGP: null, P2M: 0, P2A: 0, P2P: null, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 1, REB: 1, AST: 0, PF: 0, TO: 0, STL: 0, BLK: 0, PM: -8, EFF: 1 },
    { opp: 'QAT', date: '2025-11-30', rd, MIN: 6, PTS: 0, FGM: 0, FGA: 0, FGP: null, P2M: 0, P2A: 0, P2P: null, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 0, FTP: null, OREB: 1, DREB: 0, REB: 1, AST: 2, PF: 1, TO: 0, STL: 0, BLK: 0, PM: -7, EFF: 3 },
    { opp: 'KSA', date: '2026-02-27', rd, MIN: 18, PTS: 7, FGM: 3, FGA: 5, FGP: 60.0, P2M: 2, P2A: 3, P2P: 66.7, P3M: 1, P3A: 2, P3P: 50.0, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 3, REB: 3, AST: 1, PF: 3, TO: 1, STL: 1, BLK: 0, PM: -1, EFF: 9 },
    { opp: 'IND', date: '2026-06-29', rd, MIN: 13, PTS: 2, FGM: 1, FGA: 4, FGP: 25.0, P2M: 1, P2A: 3, P2P: 33.3, P3M: 0, P3A: 1, P3P: 0, FTM: 0, FTA: 0, FTP: null, OREB: 1, DREB: 1, REB: 2, AST: 3, PF: 0, TO: 0, STL: 1, BLK: 0, PM: 12, EFF: 5 },
    { opp: 'KSA', date: '2026-07-02', rd, MIN: 18, PTS: 0, FGM: 0, FGA: 5, FGP: 0, P2M: 0, P2A: 3, P2P: 0, P3M: 0, P3A: 2, P3P: 0, FTM: 0, FTA: 0, FTP: null, OREB: 2, DREB: 0, REB: 2, AST: 1, PF: 2, TO: 0, STL: 1, BLK: 0, PM: -6, EFF: -1 },
    { opp: 'IND', date: '2026-07-05', rd, MIN: 33, PTS: 8, FGM: 3, FGA: 5, FGP: 60.0, P2M: 2, P2A: 3, P2P: 66.7, P3M: 1, P3A: 2, P3P: 50.0, FTM: 1, FTA: 2, FTP: 50.0, OREB: 0, DREB: 6, REB: 6, AST: 15, PF: 1, TO: 1, STL: 4, BLK: 0, PM: 28, EFF: 29 },
  ],
  'Jihad Elkhatib': [
    { opp: 'QAT', date: '2025-11-27', rd, MIN: 0, PTS: 0, FGM: 0, FGA: 0, FGP: null, P2M: 0, P2A: 0, P2P: null, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 0, REB: 0, AST: 0, PF: 0, TO: 0, STL: 0, BLK: 0, PM: 0, EFF: 0 },
    { opp: 'QAT', date: '2025-11-30', rd, MIN: null, PTS: 0, FGM: 0, FGA: 0, FGP: null, P2M: 0, P2A: 0, P2P: null, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 0, REB: 0, AST: 0, PF: 0, TO: 0, STL: 0, BLK: 0, PM: 0, EFF: 0 },
    { opp: 'KSA', date: '2026-02-27', rd, MIN: 19, PTS: 12, FGM: 4, FGA: 8, FGP: 50.0, P2M: 2, P2A: 4, P2P: 50.0, P3M: 2, P3A: 4, P3P: 50.0, FTM: 2, FTA: 2, FTP: 100.0, OREB: 2, DREB: 3, REB: 5, AST: 1, PF: 3, TO: 1, STL: 2, BLK: 0, PM: 20, EFF: 15 },
    { opp: 'IND', date: '2026-06-29', rd, MIN: 17, PTS: 16, FGM: 7, FGA: 9, FGP: 77.8, P2M: 6, P2A: 6, P2P: 100.0, P3M: 1, P3A: 3, P3P: 33.3, FTM: 1, FTA: 2, FTP: 50.0, OREB: 3, DREB: 2, REB: 5, AST: 1, PF: 2, TO: 0, STL: 1, BLK: 0, PM: 18, EFF: 20 },
    { opp: 'KSA', date: '2026-07-02', rd, MIN: 17, PTS: 13, FGM: 4, FGA: 8, FGP: 50.0, P2M: 1, P2A: 3, P2P: 33.3, P3M: 3, P3A: 5, P3P: 60.0, FTM: 2, FTA: 2, FTP: 100.0, OREB: 0, DREB: 1, REB: 1, AST: 0, PF: 2, TO: 0, STL: 0, BLK: 1, PM: 11, EFF: 11 },
    { opp: 'IND', date: '2026-07-05', rd, MIN: 20, PTS: 17, FGM: 7, FGA: 15, FGP: 46.7, P2M: 6, P2A: 12, P2P: 50.0, P3M: 1, P3A: 3, P3P: 33.3, FTM: 2, FTA: 3, FTP: 66.7, OREB: 3, DREB: 0, REB: 3, AST: 1, PF: 3, TO: 0, STL: 1, BLK: 0, PM: 20, EFF: 13 },
  ],
  'Mark Alkhoury': [
    { opp: 'KSA', date: '2026-02-27', rd, MIN: 12, PTS: 0, FGM: 0, FGA: 4, FGP: 0, P2M: 0, P2A: 4, P2P: 0, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 0, FTP: null, OREB: 1, DREB: 5, REB: 6, AST: 2, PF: 1, TO: 1, STL: 0, BLK: 0, PM: -5, EFF: 3 },
    { opp: 'IND', date: '2026-06-29', rd, MIN: 9, PTS: 6, FGM: 3, FGA: 3, FGP: 100.0, P2M: 3, P2A: 3, P2P: 100.0, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 0, FTP: null, OREB: 1, DREB: 0, REB: 1, AST: 1, PF: 1, TO: 0, STL: 1, BLK: 0, PM: 6, EFF: 9 },
    { opp: 'KSA', date: '2026-07-02', rd, MIN: null, PTS: 0, FGM: 0, FGA: 0, FGP: null, P2M: 0, P2A: 0, P2P: null, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 0, REB: 0, AST: 0, PF: 0, TO: 0, STL: 0, BLK: 0, PM: 0, EFF: 0 },
    { opp: 'IND', date: '2026-07-05', rd, MIN: 21, PTS: 13, FGM: 6, FGA: 8, FGP: 75.0, P2M: 6, P2A: 8, P2P: 75.0, P3M: 0, P3A: 0, P3P: null, FTM: 1, FTA: 2, FTP: 50.0, OREB: 4, DREB: 1, REB: 5, AST: 0, PF: 3, TO: 0, STL: 1, BLK: 0, PM: 13, EFF: 16 },
  ],
  'Ali Haidar': [
    { opp: 'QAT', date: '2025-11-27', rd, MIN: 18, PTS: 10, FGM: 3, FGA: 6, FGP: 50.0, P2M: 3, P2A: 6, P2P: 50.0, P3M: 0, P3A: 0, P3P: null, FTM: 4, FTA: 6, FTP: 66.7, OREB: 3, DREB: 1, REB: 4, AST: 0, PF: 2, TO: 3, STL: 0, BLK: 0, PM: -10, EFF: 6 },
    { opp: 'QAT', date: '2025-11-30', rd, MIN: 9, PTS: 0, FGM: 0, FGA: 5, FGP: 0, P2M: 0, P2A: 5, P2P: 0, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 2, REB: 2, AST: 0, PF: 2, TO: 0, STL: 0, BLK: 0, PM: -13, EFF: -3 },
  ],
  'Jad Khalil': [
    { opp: 'QAT', date: '2025-11-27', rd, MIN: null, PTS: 0, FGM: 0, FGA: 0, FGP: null, P2M: 0, P2A: 0, P2P: null, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 0, REB: 0, AST: 0, PF: 0, TO: 0, STL: 0, BLK: 0, PM: 0, EFF: 0 },
    { opp: 'QAT', date: '2025-11-30', rd, MIN: null, PTS: 0, FGM: 0, FGA: 0, FGP: null, P2M: 0, P2A: 0, P2P: null, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 0, REB: 0, AST: 0, PF: 0, TO: 0, STL: 0, BLK: 0, PM: 0, EFF: 0 },
    { opp: 'IND', date: '2026-06-29', rd, MIN: 13, PTS: 3, FGM: 1, FGA: 3, FGP: 33.3, P2M: 1, P2A: 2, P2P: 50.0, P3M: 0, P3A: 1, P3P: 0, FTM: 1, FTA: 3, FTP: 33.3, OREB: 0, DREB: 4, REB: 4, AST: 1, PF: 1, TO: 1, STL: 1, BLK: 0, PM: 11, EFF: 4 },
    { opp: 'KSA', date: '2026-07-02', rd, MIN: null, PTS: 0, FGM: 0, FGA: 0, FGP: null, P2M: 0, P2A: 0, P2P: null, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 0, REB: 0, AST: 0, PF: 0, TO: 0, STL: 0, BLK: 0, PM: 0, EFF: 0 },
  ],
  'Joseph Abou Samra': [
    { opp: 'IND', date: '2026-07-05', rd, MIN: 9, PTS: 2, FGM: 1, FGA: 3, FGP: 33.3, P2M: 1, P2A: 3, P2P: 33.3, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 0, REB: 0, AST: 1, PF: 1, TO: 0, STL: 0, BLK: 0, PM: -9, EFF: 1 },
  ],
  'Lucas Saleh': [
    { opp: 'KSA', date: '2026-02-27', rd, MIN: 6, PTS: 0, FGM: 0, FGA: 2, FGP: 0, P2M: 0, P2A: 0, P2P: null, P3M: 0, P3A: 2, P3P: 0, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 0, REB: 0, AST: 0, PF: 2, TO: 1, STL: 0, BLK: 0, PM: -6, EFF: -3 },
  ],
  'Karl Zamatta': [
    { opp: 'IND', date: '2026-07-05', rd, MIN: 3, PTS: 2, FGM: 1, FGA: 2, FGP: 50.0, P2M: 1, P2A: 2, P2P: 50.0, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 0, REB: 0, AST: 0, PF: 0, TO: 0, STL: 0, BLK: 0, PM: -6, EFF: 1 },
  ],
};

const onlyName = process.argv[2] || null;

async function main() {
  const [team] = await get('/rest/v1/teams?select=id&name=eq.' + encodeURIComponent('레바논 남자농구 국가대표팀'));
  const players = (await get(`/rest/v1/players?team_id=eq.${team.id}&select=id,name,stats`))
    .filter((p) => !onlyName || p.name === onlyName);
  for (const p of players) {
    const gameLog = GAME_LOGS[p.name];
    if (!gameLog) { console.log('SKIP (no game log)', p.name); continue; }
    const merged = { ...p.stats, GAME_LOG: gameLog };
    await patch(`/rest/v1/players?id=eq.${p.id}`, { stats: merged });
    console.log('patched', p.name, 'games', gameLog.length);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
