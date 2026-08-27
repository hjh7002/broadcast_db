// Adds per-game GAME_LOG to the 11 Saudi Arabia players who have appeared in
// Round 1 of this qualifying campaign (the 5 new call-ups with no stats yet
// are skipped — see scripts/seedSaudiArabia.js comments). Box scores scraped
// directly from each FIBA game page's embedded RSC payload (fiba.basketball
// game ids 126948, 126951, 126954/126956, 126949/126955) for the 6 finished
// Round-1 games: KSA-IND (11/27), IND-KSA (11/30), LBN-KSA (2/28), KSA-QAT
// (6/29, Doha), KSA-LBN (7/3, Jeddah), KSA-QAT (7/6, Jeddah). Same shape as
// Korea/Lebanon (see scripts/patchLebanonGameLogs.js): opp/date/rd/MIN/PTS/
// FGM/FGA/FGP/P2M/P2A/P2P/P3M/P3A/P3P/FTM/FTA/FTP/OREB/DREB/REB/AST/PF/TO/
// STL/BLK/PM/EFF. Merges into existing `stats` (fetch-then-PATCH).
//
// Usage:  node scripts/patchSaudiGameLogs.js [player name to test one]
const https = require('https');

const SUPA_URL = process.env.SUPABASE_URL || 'https://fywefclozclsaeccufyb.supabase.co';
const KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_UpUSQ5ZM3CNZDzrykUvSmw_RKVFxmfd';
const TEAM_ID = 'ad84ff6f-4ff6-45c8-a7cf-ea717e7bd86a';

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

const rd = '1라운드';
const GAME_LOGS = {
  'Marzouq Almuwallad': [
    { opp: 'IND', date: '2025-11-27', rd, MIN: 24, PTS: 12, FGM: 5, FGA: 8, FGP: 62.5, P2M: 5, P2A: 8, P2P: 62.5, P3M: 0, P3A: 0, P3P: null, FTM: 2, FTA: 2, FTP: 100.0, OREB: 0, DREB: 2, REB: 2, AST: 2, PF: 4, TO: 4, STL: 0, BLK: 0, PM: 9, EFF: 9 },
    { opp: 'IND', date: '2025-11-30', rd, MIN: 31, PTS: 13, FGM: 6, FGA: 13, FGP: 46.2, P2M: 6, P2A: 12, P2P: 50.0, P3M: 0, P3A: 1, P3P: 0, FTM: 1, FTA: 1, FTP: 100.0, OREB: 2, DREB: 3, REB: 5, AST: 5, PF: 2, TO: 1, STL: 3, BLK: 1, PM: 28, EFF: 19 },
    { opp: 'LBN', date: '2026-02-28', rd, MIN: 26, PTS: 13, FGM: 6, FGA: 16, FGP: 37.5, P2M: 6, P2A: 11, P2P: 54.5, P3M: 0, P3A: 5, P3P: 0, FTM: 1, FTA: 1, FTP: 100.0, OREB: 2, DREB: 0, REB: 2, AST: 0, PF: 1, TO: 2, STL: 2, BLK: 0, PM: -36, EFF: 5 },
  ],
  'Osama Albargawi': [
    { opp: 'IND', date: '2025-11-27', rd, MIN: 10, PTS: 0, FGM: 0, FGA: 2, FGP: 0, P2M: 0, P2A: 0, P2P: null, P3M: 0, P3A: 2, P3P: 0, FTM: 0, FTA: 0, FTP: null, OREB: 1, DREB: 1, REB: 2, AST: 0, PF: 1, TO: 1, STL: 1, BLK: 0, PM: -6, EFF: 0 },
    { opp: 'IND', date: '2025-11-30', rd, MIN: 8, PTS: 2, FGM: 1, FGA: 3, FGP: 33.3, P2M: 1, P2A: 3, P2P: 33.3, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 2, REB: 2, AST: 0, PF: 0, TO: 0, STL: 1, BLK: 0, PM: -4, EFF: 3 },
    { opp: 'QAT', date: '2026-06-29', rd, MIN: 8, PTS: 0, FGM: 0, FGA: 0, FGP: null, P2M: 0, P2A: 0, P2P: null, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 0, REB: 0, AST: 1, PF: 1, TO: 0, STL: 0, BLK: 0, PM: 4, EFF: 1 },
    { opp: 'LBN', date: '2026-07-03', rd, MIN: 11, PTS: 2, FGM: 1, FGA: 4, FGP: 25.0, P2M: 1, P2A: 2, P2P: 50.0, P3M: 0, P3A: 2, P3P: 0, FTM: 0, FTA: 0, FTP: null, OREB: 1, DREB: 1, REB: 2, AST: 1, PF: 2, TO: 0, STL: 0, BLK: 0, PM: 0, EFF: 2 },
    { opp: 'QAT', date: '2026-07-06', rd, MIN: 8, PTS: 2, FGM: 1, FGA: 2, FGP: 50.0, P2M: 1, P2A: 2, P2P: 50.0, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 0, REB: 0, AST: 0, PF: 1, TO: 1, STL: 0, BLK: 0, PM: -1, EFF: 0 },
  ],
  'Muhammad-Ali Abdur-Rahkman': [
    { opp: 'IND', date: '2025-11-27', rd, MIN: 33, PTS: 23, FGM: 7, FGA: 12, FGP: 58.3, P2M: 5, P2A: 8, P2P: 62.5, P3M: 2, P3A: 4, P3P: 50.0, FTM: 7, FTA: 7, FTP: 100.0, OREB: 1, DREB: 4, REB: 5, AST: 6, PF: 0, TO: 4, STL: 0, BLK: 0, PM: 30, EFF: 25 },
    { opp: 'IND', date: '2025-11-30', rd, MIN: 28, PTS: 24, FGM: 7, FGA: 16, FGP: 43.8, P2M: 4, P2A: 8, P2P: 50.0, P3M: 3, P3A: 8, P3P: 37.5, FTM: 7, FTA: 8, FTP: 87.5, OREB: 1, DREB: 6, REB: 7, AST: 3, PF: 1, TO: 3, STL: 0, BLK: 0, PM: 26, EFF: 21 },
    { opp: 'LBN', date: '2026-02-28', rd, MIN: 31, PTS: 20, FGM: 5, FGA: 16, FGP: 31.3, P2M: 1, P2A: 6, P2P: 16.7, P3M: 4, P3A: 10, P3P: 40.0, FTM: 6, FTA: 6, FTP: 100.0, OREB: 0, DREB: 4, REB: 4, AST: 2, PF: 2, TO: 1, STL: 2, BLK: 0, PM: -25, EFF: 16 },
    { opp: 'QAT', date: '2026-06-29', rd, MIN: 38, PTS: 28, FGM: 10, FGA: 15, FGP: 66.7, P2M: 4, P2A: 7, P2P: 57.1, P3M: 6, P3A: 8, P3P: 75.0, FTM: 2, FTA: 3, FTP: 66.7, OREB: 0, DREB: 4, REB: 4, AST: 3, PF: 1, TO: 1, STL: 0, BLK: 1, PM: 0, EFF: 29 },
    { opp: 'LBN', date: '2026-07-03', rd, MIN: 38, PTS: 17, FGM: 5, FGA: 14, FGP: 35.7, P2M: 3, P2A: 5, P2P: 60.0, P3M: 2, P3A: 9, P3P: 22.2, FTM: 5, FTA: 6, FTP: 83.3, OREB: 1, DREB: 5, REB: 6, AST: 4, PF: 4, TO: 1, STL: 1, BLK: 0, PM: -9, EFF: 17 },
    { opp: 'QAT', date: '2026-07-06', rd, MIN: 37, PTS: 19, FGM: 6, FGA: 18, FGP: 33.3, P2M: 4, P2A: 10, P2P: 40.0, P3M: 2, P3A: 8, P3P: 25.0, FTM: 5, FTA: 5, FTP: 100.0, OREB: 3, DREB: 4, REB: 7, AST: 7, PF: 4, TO: 4, STL: 0, BLK: 0, PM: 0, EFF: 17 },
  ],
  'Mathna Almarwani': [
    { opp: 'IND', date: '2025-11-27', rd, MIN: 4, PTS: 0, FGM: 0, FGA: 1, FGP: 0, P2M: 0, P2A: 1, P2P: 0, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 0, REB: 0, AST: 1, PF: 0, TO: 2, STL: 0, BLK: 0, PM: -2, EFF: -2 },
    { opp: 'LBN', date: '2026-02-28', rd, MIN: 30, PTS: 14, FGM: 6, FGA: 15, FGP: 40.0, P2M: 6, P2A: 13, P2P: 46.2, P3M: 0, P3A: 2, P3P: 0, FTM: 2, FTA: 5, FTP: 40.0, OREB: 2, DREB: 6, REB: 8, AST: 2, PF: 4, TO: 1, STL: 1, BLK: 0, PM: -21, EFF: 12 },
    { opp: 'QAT', date: '2026-06-29', rd, MIN: 30, PTS: 19, FGM: 5, FGA: 10, FGP: 50.0, P2M: 2, P2A: 5, P2P: 40.0, P3M: 3, P3A: 5, P3P: 60.0, FTM: 6, FTA: 7, FTP: 85.7, OREB: 2, DREB: 2, REB: 4, AST: 2, PF: 1, TO: 5, STL: 0, BLK: 0, PM: 13, EFF: 14 },
    { opp: 'LBN', date: '2026-07-03', rd, MIN: 30, PTS: 9, FGM: 3, FGA: 9, FGP: 33.3, P2M: 3, P2A: 4, P2P: 75.0, P3M: 0, P3A: 5, P3P: 0, FTM: 3, FTA: 4, FTP: 75.0, OREB: 1, DREB: 5, REB: 6, AST: 3, PF: 2, TO: 1, STL: 1, BLK: 0, PM: -8, EFF: 11 },
    { opp: 'QAT', date: '2026-07-06', rd, MIN: 22, PTS: 10, FGM: 4, FGA: 12, FGP: 33.3, P2M: 2, P2A: 5, P2P: 40.0, P3M: 2, P3A: 7, P3P: 28.6, FTM: 0, FTA: 0, FTP: null, OREB: 1, DREB: 4, REB: 5, AST: 0, PF: 3, TO: 2, STL: 1, BLK: 0, PM: -2, EFF: 6 },
  ],
  'Fahad Belal': [
    { opp: 'IND', date: '2025-11-27', rd, MIN: 15, PTS: 0, FGM: 0, FGA: 3, FGP: 0, P2M: 0, P2A: 0, P2P: null, P3M: 0, P3A: 3, P3P: 0, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 1, REB: 1, AST: 1, PF: 1, TO: 1, STL: 2, BLK: 0, PM: 13, EFF: 0 },
    { opp: 'IND', date: '2025-11-30', rd, MIN: 23, PTS: 6, FGM: 2, FGA: 5, FGP: 40.0, P2M: 0, P2A: 0, P2P: null, P3M: 2, P3A: 5, P3P: 40.0, FTM: 0, FTA: 0, FTP: null, OREB: 1, DREB: 2, REB: 3, AST: 4, PF: 0, TO: 2, STL: 0, BLK: 0, PM: 13, EFF: 8 },
    { opp: 'LBN', date: '2026-02-28', rd, MIN: 12, PTS: 0, FGM: 0, FGA: 2, FGP: 0, P2M: 0, P2A: 0, P2P: null, P3M: 0, P3A: 2, P3P: 0, FTM: 0, FTA: 0, FTP: null, OREB: 1, DREB: 1, REB: 2, AST: 4, PF: 1, TO: 1, STL: 1, BLK: 0, PM: -5, EFF: 4 },
  ],
  'Khalid Abdel Gabar': [
    { opp: 'IND', date: '2025-11-27', rd, MIN: 27, PTS: 8, FGM: 3, FGA: 7, FGP: 42.9, P2M: 2, P2A: 2, P2P: 100.0, P3M: 1, P3A: 5, P3P: 20.0, FTM: 1, FTA: 2, FTP: 50.0, OREB: 0, DREB: 2, REB: 2, AST: 5, PF: 1, TO: 1, STL: 1, BLK: 0, PM: 28, EFF: 10 },
    { opp: 'IND', date: '2025-11-30', rd, MIN: null, PTS: 0, FGM: 0, FGA: 0, FGP: null, P2M: 0, P2A: 0, P2P: null, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 0, REB: 0, AST: 0, PF: 0, TO: 0, STL: 0, BLK: 0, PM: 0, EFF: 0 },
    { opp: 'LBN', date: '2026-02-28', rd, MIN: 32, PTS: 10, FGM: 4, FGA: 12, FGP: 33.3, P2M: 3, P2A: 7, P2P: 42.9, P3M: 1, P3A: 5, P3P: 20.0, FTM: 1, FTA: 2, FTP: 50.0, OREB: 2, DREB: 5, REB: 7, AST: 4, PF: 0, TO: 1, STL: 3, BLK: 0, PM: -10, EFF: 14 },
    { opp: 'QAT', date: '2026-06-29', rd, MIN: 37, PTS: 8, FGM: 2, FGA: 11, FGP: 18.2, P2M: 0, P2A: 6, P2P: 0, P3M: 2, P3A: 5, P3P: 40.0, FTM: 2, FTA: 2, FTP: 100.0, OREB: 2, DREB: 3, REB: 5, AST: 8, PF: 1, TO: 2, STL: 0, BLK: 0, PM: -1, EFF: 10 },
    { opp: 'LBN', date: '2026-07-03', rd, MIN: 32, PTS: 15, FGM: 6, FGA: 12, FGP: 50.0, P2M: 4, P2A: 9, P2P: 44.4, P3M: 2, P3A: 3, P3P: 66.7, FTM: 1, FTA: 2, FTP: 50.0, OREB: 1, DREB: 2, REB: 3, AST: 2, PF: 2, TO: 2, STL: 1, BLK: 0, PM: 3, EFF: 12 },
    { opp: 'QAT', date: '2026-07-06', rd, MIN: 35, PTS: 11, FGM: 3, FGA: 7, FGP: 42.9, P2M: 1, P2A: 1, P2P: 100.0, P3M: 2, P3A: 6, P3P: 33.3, FTM: 3, FTA: 4, FTP: 75.0, OREB: 0, DREB: 6, REB: 6, AST: 6, PF: 3, TO: 3, STL: 3, BLK: 0, PM: -6, EFF: 18 },
  ],
  'Mohammed Alsuwailem': [
    { opp: 'IND', date: '2025-11-27', rd, MIN: 26, PTS: 16, FGM: 6, FGA: 7, FGP: 85.7, P2M: 6, P2A: 6, P2P: 100.0, P3M: 0, P3A: 1, P3P: 0, FTM: 4, FTA: 4, FTP: 100.0, OREB: 1, DREB: 8, REB: 9, AST: 2, PF: 2, TO: 0, STL: 2, BLK: 0, PM: 26, EFF: 28 },
    { opp: 'IND', date: '2025-11-30', rd, MIN: 27, PTS: 8, FGM: 3, FGA: 5, FGP: 60.0, P2M: 3, P2A: 4, P2P: 75.0, P3M: 0, P3A: 1, P3P: 0, FTM: 2, FTA: 2, FTP: 100.0, OREB: 2, DREB: 7, REB: 9, AST: 1, PF: 1, TO: 2, STL: 0, BLK: 4, PM: 28, EFF: 18 },
    { opp: 'QAT', date: '2026-06-29', rd, MIN: 38, PTS: 20, FGM: 7, FGA: 7, FGP: 100.0, P2M: 7, P2A: 7, P2P: 100.0, P3M: 0, P3A: 0, P3P: null, FTM: 6, FTA: 7, FTP: 85.7, OREB: 2, DREB: 11, REB: 13, AST: 4, PF: 4, TO: 3, STL: 0, BLK: 2, PM: 6, EFF: 35 },
    { opp: 'LBN', date: '2026-07-03', rd, MIN: 38, PTS: 20, FGM: 6, FGA: 8, FGP: 75.0, P2M: 5, P2A: 7, P2P: 71.4, P3M: 1, P3A: 1, P3P: 100.0, FTM: 7, FTA: 8, FTP: 87.5, OREB: 6, DREB: 10, REB: 16, AST: 2, PF: 4, TO: 3, STL: 0, BLK: 3, PM: -4, EFF: 35 },
    { opp: 'QAT', date: '2026-07-06', rd, MIN: 39, PTS: 15, FGM: 6, FGA: 9, FGP: 66.7, P2M: 6, P2A: 9, P2P: 66.7, P3M: 0, P3A: 0, P3P: null, FTM: 3, FTA: 4, FTP: 75.0, OREB: 3, DREB: 6, REB: 9, AST: 3, PF: 3, TO: 3, STL: 1, BLK: 2, PM: -4, EFF: 23 },
  ],
  'Hani Almohammed': [
    { opp: 'QAT', date: '2026-06-29', rd, MIN: 10, PTS: 2, FGM: 1, FGA: 2, FGP: 50.0, P2M: 1, P2A: 2, P2P: 50.0, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 0, REB: 0, AST: 2, PF: 2, TO: 0, STL: 0, BLK: 0, PM: 3, EFF: 3 },
    { opp: 'LBN', date: '2026-07-03', rd, MIN: 4, PTS: 0, FGM: 0, FGA: 0, FGP: null, P2M: 0, P2A: 0, P2P: null, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 1, REB: 1, AST: 0, PF: 2, TO: 0, STL: 0, BLK: 0, PM: -3, EFF: 1 },
    { opp: 'QAT', date: '2026-07-06', rd, MIN: 4, PTS: 0, FGM: 0, FGA: 1, FGP: 0, P2M: 0, P2A: 0, P2P: null, P3M: 0, P3A: 1, P3P: 0, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 0, REB: 0, AST: 0, PF: 1, TO: 0, STL: 0, BLK: 0, PM: -1, EFF: -1 },
  ],
  'Ali Shubayli': [
    { opp: 'IND', date: '2025-11-27', rd, MIN: 24, PTS: 3, FGM: 1, FGA: 6, FGP: 16.7, P2M: 0, P2A: 3, P2P: 0, P3M: 1, P3A: 3, P3P: 33.3, FTM: 0, FTA: 0, FTP: null, OREB: 1, DREB: 4, REB: 5, AST: 2, PF: 1, TO: 0, STL: 1, BLK: 0, PM: 13, EFF: 6 },
    { opp: 'IND', date: '2025-11-30', rd, MIN: 24, PTS: 10, FGM: 4, FGA: 4, FGP: 100.0, P2M: 2, P2A: 2, P2P: 100.0, P3M: 2, P3A: 2, P3P: 100.0, FTM: 0, FTA: 0, FTP: null, OREB: 1, DREB: 4, REB: 5, AST: 0, PF: 0, TO: 2, STL: 0, BLK: 0, PM: 24, EFF: 13 },
    { opp: 'LBN', date: '2026-02-28', rd, MIN: 21, PTS: 0, FGM: 0, FGA: 1, FGP: 0, P2M: 0, P2A: 0, P2P: null, P3M: 0, P3A: 1, P3P: 0, FTM: 0, FTA: 0, FTP: null, OREB: 2, DREB: 2, REB: 4, AST: 1, PF: 2, TO: 0, STL: 0, BLK: 0, PM: -15, EFF: 4 },
    { opp: 'QAT', date: '2026-06-29', rd, MIN: 21, PTS: 7, FGM: 3, FGA: 6, FGP: 50.0, P2M: 2, P2A: 4, P2P: 50.0, P3M: 1, P3A: 2, P3P: 50.0, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 2, REB: 2, AST: 0, PF: 4, TO: 2, STL: 0, BLK: 0, PM: 6, EFF: 4 },
    { opp: 'LBN', date: '2026-07-03', rd, MIN: 19, PTS: 0, FGM: 0, FGA: 2, FGP: 0, P2M: 0, P2A: 1, P2P: 0, P3M: 0, P3A: 1, P3P: 0, FTM: 0, FTA: 0, FTP: null, OREB: 1, DREB: 0, REB: 1, AST: 0, PF: 3, TO: 1, STL: 1, BLK: 0, PM: -2, EFF: -1 },
    { opp: 'QAT', date: '2026-07-06', rd, MIN: 19, PTS: 5, FGM: 2, FGA: 6, FGP: 33.3, P2M: 1, P2A: 3, P2P: 33.3, P3M: 1, P3A: 3, P3P: 33.3, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 1, REB: 1, AST: 0, PF: 3, TO: 2, STL: 2, BLK: 0, PM: 0, EFF: 2 },
  ],
  'Thamer Mohammed': [
    { opp: 'IND', date: '2025-11-27', rd, MIN: 5, PTS: 0, FGM: 0, FGA: 0, FGP: null, P2M: 0, P2A: 0, P2P: null, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 0, REB: 0, AST: 0, PF: 1, TO: 0, STL: 0, BLK: 1, PM: -2, EFF: 1 },
    { opp: 'IND', date: '2025-11-30', rd, MIN: 12, PTS: 4, FGM: 2, FGA: 4, FGP: 50.0, P2M: 2, P2A: 4, P2P: 50.0, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 0, FTP: null, OREB: 3, DREB: 1, REB: 4, AST: 0, PF: 3, TO: 3, STL: 1, BLK: 0, PM: 1, EFF: 4 },
    { opp: 'LBN', date: '2026-02-28', rd, MIN: 10, PTS: 0, FGM: 0, FGA: 1, FGP: 0, P2M: 0, P2A: 1, P2P: 0, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 1, REB: 1, AST: 1, PF: 0, TO: 1, STL: 0, BLK: 1, PM: -7, EFF: 1 },
  ],
  'Musab Tariq M Kadi': [
    { opp: 'IND', date: '2025-11-27', rd, MIN: 26, PTS: 13, FGM: 6, FGA: 9, FGP: 66.7, P2M: 5, P2A: 6, P2P: 83.3, P3M: 1, P3A: 3, P3P: 33.3, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 3, REB: 3, AST: 2, PF: 1, TO: 3, STL: 4, BLK: 1, PM: 15, EFF: 17 },
    { opp: 'IND', date: '2025-11-30', rd, MIN: 23, PTS: 6, FGM: 3, FGA: 7, FGP: 42.9, P2M: 3, P2A: 5, P2P: 60.0, P3M: 0, P3A: 2, P3P: 0, FTM: 0, FTA: 0, FTP: null, OREB: 2, DREB: 3, REB: 5, AST: 2, PF: 1, TO: 0, STL: 3, BLK: 1, PM: 20, EFF: 13 },
    { opp: 'LBN', date: '2026-02-28', rd, MIN: 22, PTS: 7, FGM: 2, FGA: 7, FGP: 28.6, P2M: 1, P2A: 3, P2P: 33.3, P3M: 1, P3A: 4, P3P: 25.0, FTM: 2, FTA: 6, FTP: 33.3, OREB: 0, DREB: 3, REB: 3, AST: 1, PF: 3, TO: 2, STL: 1, BLK: 1, PM: -18, EFF: 2 },
    { opp: 'QAT', date: '2026-06-29', rd, MIN: 19, PTS: 1, FGM: 0, FGA: 2, FGP: 0, P2M: 0, P2A: 0, P2P: null, P3M: 0, P3A: 2, P3P: 0, FTM: 1, FTA: 2, FTP: 50.0, OREB: 0, DREB: 1, REB: 1, AST: 1, PF: 4, TO: 2, STL: 2, BLK: 1, PM: 0, EFF: 1 },
    { opp: 'LBN', date: '2026-07-03', rd, MIN: 28, PTS: 19, FGM: 8, FGA: 12, FGP: 66.7, P2M: 6, P2A: 7, P2P: 85.7, P3M: 2, P3A: 5, P3P: 40.0, FTM: 1, FTA: 4, FTP: 25.0, OREB: 0, DREB: 0, REB: 0, AST: 1, PF: 1, TO: 2, STL: 2, BLK: 0, PM: -7, EFF: 13 },
    { opp: 'QAT', date: '2026-07-06', rd, MIN: 28, PTS: 8, FGM: 3, FGA: 9, FGP: 33.3, P2M: 1, P2A: 4, P2P: 25.0, P3M: 2, P3A: 5, P3P: 40.0, FTM: 0, FTA: 0, FTP: null, OREB: 1, DREB: 1, REB: 2, AST: 0, PF: 3, TO: 1, STL: 3, BLK: 0, PM: -5, EFF: 6 },
  ],
};

const onlyName = process.argv[2] || null;

async function main() {
  const players = (await get(`/rest/v1/players?team_id=eq.${TEAM_ID}&select=id,name,stats`))
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
