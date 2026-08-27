// Adds GP/MIN (front of Summary) + full per-game GAME_LOG to the 대한민국 12-man
// basketball roster, and GP/MIN only to the 레바논 roster (no individual game-log
// pages were scraped for Lebanon yet). Merges into existing `stats` jsonb rather
// than overwriting it. Run after seedBasketballNationalTeams.js.
//
// Usage:  node scripts/patchKoreaGameLogs.js
const https = require('https');

const SUPA_URL = process.env.SUPABASE_URL || 'https://fywefclozclsaeccufyb.supabase.co';
const KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_UpUSQ5ZM3CNZDzrykUvSmw_RKVFxmfd';

function req(method, path, body, extraHeaders) {
  return new Promise((resolve, reject) => {
    const payload = body !== undefined ? JSON.stringify(body) : null;
    const url = new URL(SUPA_URL + path);
    const headers = {
      apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json',
      Prefer: 'return=representation', ...(extraHeaders || {}),
    };
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
const post = (path, body, extraHeaders) => req('POST', path, body, extraHeaders);

const STAT_FIELDS = [
  ['GP', '경기수', 1], ['MIN', '출전시간', 2], ['PTS', '득점', 3], ['REB', '리바운드', 4],
  ['AST', '어시스트', 5], ['STL', '스틸', 6], ['BLK', '블록', 7], ['FG_PCT', '야투%', 8],
  ['FG3M', '3점성공', 9], ['FG3_PCT', '3점%', 10], ['FT_PCT', '자유투%', 11],
];

// name -> { GP, MIN }
const KOREA_GP_MIN = {
  '이현중': [4, 34], '여준석': [2, 32.6], '이승현': [6, 28.5], '이정현': [5, 27.9],
  '안영준': [4, 26.4], '이우석': [4, 23.1], '장재석': [2, 20.7], '유기상': [4, 17],
  '변준형': [4, 15.4], '에디 다니엘': [4, 13.2], '문유현': [3, 10.5], '이원석': [3, 8.2],
};
const LEBANON_GP_MIN = {
  'Dedric Lawson': [3, 31.9], 'Wael Arakji': [3, 30.6], 'Sergio El Darwich': [5, 27.7],
  'Ater Majok': [3, 22.8], 'Hayk Gyokchyan': [3, 21.9], 'Omar Jamaleddine': [3, 21.3],
  'Youssef Khayat': [3, 20.8], 'Karim Zeinoun': [5, 18.7], 'Gerard Hadidian': [6, 18.6],
  'Amir Saoud': [6, 17.4], 'Ali Mansour': [2, 16.9], 'Ali Mezher': [6, 16.2],
  'Jihad Elkhatib': [5, 14.6], 'Mark Alkhoury': [3, 13.9], 'Ali Haidar': [2, 13.6],
  'Jad Khalil': [1, 13], 'Joseph Abou Samra': [1, 9.4], 'Lucas Saleh': [1, 5.5],
  'Karl Zamatta': [1, 3.1], 'Marc Khoueiry': [0, 0],
  'Omar El Jamal': [0, null], 'Karim Ezzedine': [0, null], 'DJ Funderburk': [0, null], 'Anthony Naba': [0, null],
};

// name -> array of game rows, columns matching the FIBA player-profile "Detailed
// statistics" table exactly: Game(s)/Min/Pts/FG/2PT FG/3PT FG/FT/OREB/DREB/REB/AST/PF/TO/STL/BLK/+-/EFF
const KOREA_GAME_LOGS = {
  '이현중': [
    { opp: 'CHN', date: '2025-11-28', rd: 'First Round', MIN: 38, PTS: 33, FGM: 12, FGA: 20, FGP: 60.0, P2M: 3, P2A: 6, P2P: 50.0, P3M: 9, P3A: 14, P3P: 64.3, FTM: 0, FTA: 0, FTP: null, OREB: 1, DREB: 13, REB: 14, AST: 0, PF: 1, TO: 4, STL: 2, BLK: 0, PM: 3, EFF: 37 },
    { opp: 'CHN', date: '2025-12-01', rd: 'First Round', MIN: 33, PTS: 20, FGM: 7, FGA: 15, FGP: 46.7, P2M: 5, P2A: 9, P2P: 55.6, P3M: 2, P3A: 6, P3P: 33.3, FTM: 4, FTA: 5, FTP: 80.0, OREB: 0, DREB: 6, REB: 6, AST: 4, PF: 2, TO: 1, STL: 3, BLK: 0, PM: 3, EFF: 23 },
    { opp: 'TPE', date: '2026-02-26', rd: 'First Round', MIN: 28, PTS: 18, FGM: 6, FGA: 14, FGP: 42.9, P2M: 3, P2A: 4, P2P: 75.0, P3M: 3, P3A: 10, P3P: 30.0, FTM: 3, FTA: 3, FTP: 100.0, OREB: 4, DREB: 4, REB: 8, AST: 1, PF: 5, TO: 5, STL: 1, BLK: 0, PM: -1, EFF: 15 },
    { opp: 'JPN', date: '2026-03-01', rd: 'First Round', MIN: 37, PTS: 28, FGM: 7, FGA: 15, FGP: 46.7, P2M: 2, P2A: 2, P2P: 100.0, P3M: 5, P3A: 13, P3P: 38.5, FTM: 9, FTA: 10, FTP: 90.0, OREB: 1, DREB: 10, REB: 11, AST: 1, PF: 2, TO: 1, STL: 1, BLK: 0, PM: -3, EFF: 31 },
  ],
  '여준석': [
    { opp: 'TPE', date: '2026-07-03', rd: 'First Round', MIN: 39, PTS: 15, FGM: 7, FGA: 14, FGP: 50.0, P2M: 7, P2A: 11, P2P: 63.6, P3M: 0, P3A: 3, P3P: 0, FTM: 1, FTA: 2, FTP: 50.0, OREB: 0, DREB: 8, REB: 8, AST: 1, PF: 0, TO: 2, STL: 0, BLK: 0, PM: -8, EFF: 14 },
    { opp: 'JPN', date: '2026-07-06', rd: 'First Round', MIN: 26, PTS: 8, FGM: 4, FGA: 9, FGP: 44.4, P2M: 4, P2A: 5, P2P: 80.0, P3M: 0, P3A: 4, P3P: 0, FTM: 0, FTA: 0, FTP: null, OREB: 1, DREB: 7, REB: 8, AST: 0, PF: 1, TO: 3, STL: 0, BLK: 1, PM: -13, EFF: 9 },
  ],
  '이승현': [
    { opp: 'CHN', date: '2025-11-28', rd: 'First Round', MIN: 38, PTS: 8, FGM: 4, FGA: 11, FGP: 36.4, P2M: 4, P2A: 9, P2P: 44.4, P3M: 0, P3A: 2, P3P: 0, FTM: 0, FTA: 0, FTP: null, OREB: 3, DREB: 2, REB: 5, AST: 5, PF: 3, TO: 0, STL: 0, BLK: 0, PM: 3, EFF: 11 },
    { opp: 'CHN', date: '2025-12-01', rd: 'First Round', MIN: 33, PTS: 4, FGM: 2, FGA: 6, FGP: 33.3, P2M: 2, P2A: 4, P2P: 50.0, P3M: 0, P3A: 2, P3P: 0, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 0, REB: 0, AST: 7, PF: 4, TO: 0, STL: 0, BLK: 1, PM: 21, EFF: 8 },
    { opp: 'TPE', date: '2026-02-26', rd: 'First Round', MIN: 29, PTS: 4, FGM: 2, FGA: 8, FGP: 25.0, P2M: 2, P2A: 7, P2P: 28.6, P3M: 0, P3A: 1, P3P: 0, FTM: 0, FTA: 0, FTP: null, OREB: 3, DREB: 7, REB: 10, AST: 2, PF: 2, TO: 1, STL: 0, BLK: 0, PM: -10, EFF: 9 },
    { opp: 'JPN', date: '2026-03-01', rd: 'First Round', MIN: 31, PTS: 6, FGM: 2, FGA: 5, FGP: 40.0, P2M: 2, P2A: 5, P2P: 40.0, P3M: 0, P3A: 0, P3P: null, FTM: 2, FTA: 2, FTP: 100.0, OREB: 1, DREB: 3, REB: 4, AST: 2, PF: 2, TO: 4, STL: 1, BLK: 0, PM: -8, EFF: 6 },
    { opp: 'TPE', date: '2026-07-03', rd: 'First Round', MIN: 20, PTS: 4, FGM: 2, FGA: 4, FGP: 50.0, P2M: 2, P2A: 3, P2P: 66.7, P3M: 0, P3A: 1, P3P: 0, FTM: 0, FTA: 2, FTP: 0, OREB: 5, DREB: 3, REB: 8, AST: 1, PF: 3, TO: 0, STL: 2, BLK: 1, PM: 3, EFF: 12 },
    { opp: 'JPN', date: '2026-07-06', rd: 'First Round', MIN: 21, PTS: 2, FGM: 1, FGA: 3, FGP: 33.3, P2M: 1, P2A: 2, P2P: 50.0, P3M: 0, P3A: 1, P3P: 0, FTM: 0, FTA: 0, FTP: null, OREB: 1, DREB: 0, REB: 1, AST: 0, PF: 2, TO: 0, STL: 1, BLK: 0, PM: 0, EFF: 2 },
  ],
  '이정현': [
    { opp: 'CHN', date: '2025-11-28', rd: 'First Round', MIN: 28, PTS: 13, FGM: 4, FGA: 11, FGP: 36.4, P2M: 1, P2A: 2, P2P: 50.0, P3M: 3, P3A: 9, P3P: 33.3, FTM: 2, FTA: 2, FTP: 100.0, OREB: 0, DREB: 2, REB: 2, AST: 7, PF: 3, TO: 3, STL: 0, BLK: 0, PM: 6, EFF: 12 },
    { opp: 'CHN', date: '2025-12-01', rd: 'First Round', MIN: 23, PTS: 24, FGM: 9, FGA: 11, FGP: 81.8, P2M: 3, P2A: 4, P2P: 75.0, P3M: 6, P3A: 7, P3P: 85.7, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 2, REB: 2, AST: 4, PF: 2, TO: 2, STL: 0, BLK: 0, PM: 10, EFF: 26 },
    { opp: 'TPE', date: '2026-02-26', rd: 'First Round', MIN: 31, PTS: 7, FGM: 3, FGA: 11, FGP: 27.3, P2M: 2, P2A: 7, P2P: 28.6, P3M: 1, P3A: 4, P3P: 25.0, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 1, REB: 1, AST: 6, PF: 1, TO: 4, STL: 1, BLK: 0, PM: -18, EFF: 3 },
    { opp: 'JPN', date: '2026-03-01', rd: 'First Round', MIN: 35, PTS: 8, FGM: 3, FGA: 8, FGP: 37.5, P2M: 1, P2A: 1, P2P: 100.0, P3M: 2, P3A: 7, P3P: 28.6, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 0, REB: 0, AST: 5, PF: 3, TO: 1, STL: 1, BLK: 0, PM: 1, EFF: 8 },
    { opp: 'TPE', date: '2026-07-03', rd: 'First Round', MIN: 23, PTS: 13, FGM: 4, FGA: 11, FGP: 36.4, P2M: 2, P2A: 5, P2P: 40.0, P3M: 2, P3A: 6, P3P: 33.3, FTM: 3, FTA: 4, FTP: 75.0, OREB: 1, DREB: 0, REB: 1, AST: 4, PF: 1, TO: 1, STL: 0, BLK: 0, PM: 2, EFF: 9 },
  ],
  '안영준': [
    { opp: 'CHN', date: '2025-11-28', rd: 'First Round', MIN: 29, PTS: 13, FGM: 3, FGA: 6, FGP: 50.0, P2M: 1, P2A: 3, P2P: 33.3, P3M: 2, P3A: 3, P3P: 66.7, FTM: 5, FTA: 8, FTP: 62.5, OREB: 1, DREB: 5, REB: 6, AST: 1, PF: 4, TO: 1, STL: 2, BLK: 3, PM: 5, EFF: 18 },
    { opp: 'CHN', date: '2025-12-01', rd: 'First Round', MIN: 26, PTS: 4, FGM: 2, FGA: 4, FGP: 50.0, P2M: 2, P2A: 3, P2P: 66.7, P3M: 0, P3A: 1, P3P: 0, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 4, REB: 4, AST: 1, PF: 3, TO: 0, STL: 1, BLK: 0, PM: 20, EFF: 8 },
    { opp: 'TPE', date: '2026-02-26', rd: 'First Round', MIN: 20, PTS: 7, FGM: 3, FGA: 6, FGP: 50.0, P2M: 2, P2A: 3, P2P: 66.7, P3M: 1, P3A: 3, P3P: 33.3, FTM: 0, FTA: 0, FTP: null, OREB: 3, DREB: 2, REB: 5, AST: 0, PF: 5, TO: 3, STL: 1, BLK: 0, PM: -11, EFF: 7 },
    { opp: 'JPN', date: '2026-03-01', rd: 'First Round', MIN: 30, PTS: 10, FGM: 3, FGA: 10, FGP: 30.0, P2M: 2, P2A: 6, P2P: 33.3, P3M: 1, P3A: 4, P3P: 25.0, FTM: 3, FTA: 5, FTP: 60.0, OREB: 2, DREB: 4, REB: 6, AST: 2, PF: 2, TO: 2, STL: 1, BLK: 0, PM: -9, EFF: 8 },
  ],
  '이우석': [
    { opp: 'CHN', date: '2025-11-28', rd: 'First Round', MIN: 13, PTS: 0, FGM: 0, FGA: 1, FGP: 0, P2M: 0, P2A: 0, P2P: null, P3M: 0, P3A: 1, P3P: 0, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 0, REB: 0, AST: 0, PF: 0, TO: 0, STL: 1, BLK: 0, PM: 0, EFF: 0 },
    { opp: 'CHN', date: '2025-12-01', rd: 'First Round', MIN: 17, PTS: 3, FGM: 1, FGA: 2, FGP: 50.0, P2M: 0, P2A: 0, P2P: null, P3M: 1, P3A: 2, P3P: 50.0, FTM: 0, FTA: 0, FTP: null, OREB: 1, DREB: 1, REB: 2, AST: 0, PF: 2, TO: 0, STL: 0, BLK: 0, PM: 13, EFF: 4 },
    { opp: 'TPE', date: '2026-07-03', rd: 'First Round', MIN: 33, PTS: 12, FGM: 4, FGA: 12, FGP: 33.3, P2M: 3, P2A: 7, P2P: 42.9, P3M: 1, P3A: 5, P3P: 20.0, FTM: 3, FTA: 3, FTP: 100.0, OREB: 2, DREB: 4, REB: 6, AST: 7, PF: 1, TO: 2, STL: 0, BLK: 0, PM: 2, EFF: 15 },
    { opp: 'JPN', date: '2026-07-06', rd: 'First Round', MIN: 29, PTS: 19, FGM: 8, FGA: 17, FGP: 47.1, P2M: 7, P2A: 10, P2P: 70.0, P3M: 1, P3A: 7, P3P: 14.3, FTM: 2, FTA: 6, FTP: 33.3, OREB: 2, DREB: 5, REB: 7, AST: 2, PF: 2, TO: 1, STL: 3, BLK: 0, PM: -1, EFF: 17 },
  ],
  '장재석': [
    { opp: 'TPE', date: '2026-07-03', rd: 'First Round', MIN: 25, PTS: 11, FGM: 5, FGA: 10, FGP: 50.0, P2M: 5, P2A: 9, P2P: 55.6, P3M: 0, P3A: 1, P3P: 0, FTM: 1, FTA: 2, FTP: 50.0, OREB: 5, DREB: 5, REB: 10, AST: 1, PF: 4, TO: 2, STL: 0, BLK: 0, PM: -5, EFF: 14 },
    { opp: 'JPN', date: '2026-07-06', rd: 'First Round', MIN: 17, PTS: 8, FGM: 3, FGA: 7, FGP: 42.9, P2M: 3, P2A: 7, P2P: 42.9, P3M: 0, P3A: 0, P3P: null, FTM: 2, FTA: 4, FTP: 50.0, OREB: 3, DREB: 0, REB: 3, AST: 1, PF: 5, TO: 1, STL: 0, BLK: 0, PM: 0, EFF: 5 },
  ],
  '유기상': [
    { opp: 'TPE', date: '2026-02-26', rd: 'First Round', MIN: 14, PTS: 13, FGM: 4, FGA: 9, FGP: 44.4, P2M: 1, P2A: 2, P2P: 50.0, P3M: 3, P3A: 7, P3P: 42.9, FTM: 2, FTA: 3, FTP: 66.7, OREB: 2, DREB: 0, REB: 2, AST: 0, PF: 0, TO: 0, STL: 1, BLK: 0, PM: -1, EFF: 10 },
    { opp: 'JPN', date: '2026-03-01', rd: 'First Round', MIN: 23, PTS: 11, FGM: 4, FGA: 11, FGP: 36.4, P2M: 3, P2A: 4, P2P: 75.0, P3M: 1, P3A: 7, P3P: 14.3, FTM: 2, FTA: 2, FTP: 100.0, OREB: 0, DREB: 0, REB: 0, AST: 0, PF: 1, TO: 2, STL: 0, BLK: 0, PM: -2, EFF: 2 },
    { opp: 'TPE', date: '2026-07-03', rd: 'First Round', MIN: 20, PTS: 10, FGM: 3, FGA: 10, FGP: 30.0, P2M: 1, P2A: 1, P2P: 100.0, P3M: 2, P3A: 9, P3P: 22.2, FTM: 2, FTA: 2, FTP: 100.0, OREB: 2, DREB: 1, REB: 3, AST: 1, PF: 2, TO: 0, STL: 0, BLK: 0, PM: -3, EFF: 7 },
    { opp: 'JPN', date: '2026-07-06', rd: 'First Round', MIN: 10, PTS: 5, FGM: 1, FGA: 4, FGP: 25.0, P2M: 0, P2A: 1, P2P: 0, P3M: 1, P3A: 3, P3P: 33.3, FTM: 2, FTA: 2, FTP: 100.0, OREB: 0, DREB: 0, REB: 0, AST: 1, PF: 0, TO: 1, STL: 1, BLK: 0, PM: 3, EFF: 3 },
  ],
  '변준형': [
    { opp: 'CHN', date: '2025-11-28', rd: 'First Round', MIN: 12, PTS: 2, FGM: 1, FGA: 3, FGP: 33.3, P2M: 1, P2A: 2, P2P: 50.0, P3M: 0, P3A: 1, P3P: 0, FTM: 0, FTA: 4, FTP: 0, OREB: 0, DREB: 1, REB: 1, AST: 2, PF: 1, TO: 1, STL: 1, BLK: 0, PM: -2, EFF: -1 },
    { opp: 'CHN', date: '2025-12-01', rd: 'First Round', MIN: 10, PTS: 8, FGM: 3, FGA: 5, FGP: 60.0, P2M: 1, P2A: 2, P2P: 50.0, P3M: 2, P3A: 3, P3P: 66.7, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 0, REB: 0, AST: 2, PF: 1, TO: 1, STL: 1, BLK: 0, PM: 7, EFF: 8 },
    { opp: 'TPE', date: '2026-07-03', rd: 'First Round', MIN: 19, PTS: 3, FGM: 1, FGA: 4, FGP: 25.0, P2M: 0, P2A: 1, P2P: 0, P3M: 1, P3A: 3, P3P: 33.3, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 2, REB: 2, AST: 8, PF: 2, TO: 3, STL: 1, BLK: 0, PM: 5, EFF: 8 },
    { opp: 'JPN', date: '2026-07-06', rd: 'First Round', MIN: 20, PTS: 4, FGM: 2, FGA: 5, FGP: 40.0, P2M: 2, P2A: 4, P2P: 50.0, P3M: 0, P3A: 1, P3P: 0, FTM: 0, FTA: 2, FTP: 0, OREB: 1, DREB: 4, REB: 5, AST: 5, PF: 1, TO: 2, STL: 0, BLK: 0, PM: 10, EFF: 7 },
  ],
  '에디 다니엘': [
    { opp: 'TPE', date: '2026-02-26', rd: 'First Round', MIN: 10, PTS: 2, FGM: 1, FGA: 1, FGP: 100.0, P2M: 1, P2A: 1, P2P: 100.0, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 0, FTP: null, OREB: 3, DREB: 3, REB: 6, AST: 0, PF: 1, TO: 0, STL: 0, BLK: 0, PM: -3, EFF: 8 },
    { opp: 'JPN', date: '2026-03-01', rd: 'First Round', MIN: 19, PTS: 4, FGM: 2, FGA: 5, FGP: 40.0, P2M: 2, P2A: 5, P2P: 40.0, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 1, FTP: 0, OREB: 2, DREB: 0, REB: 2, AST: 1, PF: 4, TO: 2, STL: 2, BLK: 1, PM: -7, EFF: 4 },
    { opp: 'TPE', date: '2026-07-03', rd: 'First Round', MIN: 7, PTS: 4, FGM: 2, FGA: 2, FGP: 100.0, P2M: 2, P2A: 2, P2P: 100.0, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 1, REB: 1, AST: 0, PF: 0, TO: 0, STL: 1, BLK: 0, PM: 3, EFF: 6 },
    { opp: 'JPN', date: '2026-07-06', rd: 'First Round', MIN: 17, PTS: 9, FGM: 2, FGA: 2, FGP: 100.0, P2M: 2, P2A: 2, P2P: 100.0, P3M: 0, P3A: 0, P3P: null, FTM: 5, FTA: 5, FTP: 100.0, OREB: 0, DREB: 1, REB: 1, AST: 0, PF: 3, TO: 1, STL: 5, BLK: 0, PM: 11, EFF: 14 },
  ],
  '문유현': [
    { opp: 'TPE', date: '2026-02-26', rd: 'First Round', MIN: 8, PTS: 4, FGM: 2, FGA: 7, FGP: 28.6, P2M: 2, P2A: 5, P2P: 40.0, P3M: 0, P3A: 2, P3P: 0, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 0, REB: 0, AST: 4, PF: 0, TO: 0, STL: 2, BLK: 0, PM: 3, EFF: 5 },
    { opp: 'JPN', date: '2026-03-01', rd: 'First Round', MIN: 14, PTS: 3, FGM: 1, FGA: 4, FGP: 25.0, P2M: 1, P2A: 4, P2P: 25.0, P3M: 0, P3A: 0, P3P: null, FTM: 1, FTA: 2, FTP: 50.0, OREB: 0, DREB: 0, REB: 0, AST: 2, PF: 5, TO: 0, STL: 3, BLK: 0, PM: -3, EFF: 4 },
    { opp: 'JPN', date: '2026-07-06', rd: 'First Round', MIN: 10, PTS: 5, FGM: 2, FGA: 3, FGP: 66.7, P2M: 1, P2A: 1, P2P: 100.0, P3M: 1, P3A: 2, P3P: 50.0, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 1, REB: 1, AST: 0, PF: 1, TO: 0, STL: 0, BLK: 0, PM: -9, EFF: 5 },
  ],
  '이원석': [
    { opp: 'CHN', date: '2025-11-28', rd: 'First Round', MIN: 10, PTS: 2, FGM: 1, FGA: 2, FGP: 50.0, P2M: 1, P2A: 2, P2P: 50.0, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 0, REB: 0, AST: 0, PF: 5, TO: 1, STL: 0, BLK: 1, PM: 12, EFF: 1 },
    { opp: 'CHN', date: '2025-12-01', rd: 'First Round', MIN: 12, PTS: 10, FGM: 2, FGA: 3, FGP: 66.7, P2M: 2, P2A: 2, P2P: 100.0, P3M: 0, P3A: 1, P3P: 0, FTM: 6, FTA: 6, FTP: 100.0, OREB: 0, DREB: 2, REB: 2, AST: 0, PF: 3, TO: 0, STL: 0, BLK: 3, PM: 7, EFF: 14 },
    { opp: 'JPN', date: '2026-07-06', rd: 'First Round', MIN: 2, PTS: 0, FGM: 0, FGA: 0, FGP: null, P2M: 0, P2A: 0, P2P: null, P3M: 0, P3A: 0, P3P: null, FTM: 0, FTA: 0, FTP: null, OREB: 0, DREB: 0, REB: 0, AST: 1, PF: 0, TO: 0, STL: 0, BLK: 0, PM: 2, EFF: 1 },
  ],
};

// Optional: `node scripts/patchKoreaGameLogs.js 이현중` patches only that one
// Korea player (and skips Lebanon entirely) — for testing before the full run.
const onlyName = process.argv[2] || null;

async function main() {
  const [sport] = await get('/rest/v1/sports?code=eq.bball_nt&select=id');
  const sportId = sport.id;

  for (const [key, label, order] of STAT_FIELDS) {
    await post('/rest/v1/sport_stat_fields?on_conflict=sport_id,stat_key',
      { sport_id: sportId, stat_key: key, label, data_type: 'number', sort_order: order },
      { Prefer: 'resolution=merge-duplicates' });
  }
  console.log('stat fields reordered (GP/MIN first)');

  const teams = await get(`/rest/v1/teams?sport_id=eq.${sportId}&select=id,name`);
  const koreaTeam = teams.find((t) => t.name === '대한민국 남자농구 국가대표팀');
  const lebanonTeam = teams.find((t) => t.name === '레바논 남자농구 국가대표팀');

  const koreaPlayers = (await get(`/rest/v1/players?team_id=eq.${koreaTeam.id}&select=id,name,stats`))
    .filter((p) => !onlyName || p.name === onlyName);
  for (const p of koreaPlayers) {
    const [GP, MIN] = KOREA_GP_MIN[p.name] || [null, null];
    const gameLog = KOREA_GAME_LOGS[p.name];
    const merged = { ...p.stats, GP, MIN, ...(gameLog ? { GAME_LOG: gameLog } : {}) };
    await patch(`/rest/v1/players?id=eq.${p.id}`, { stats: merged });
    console.log('korea patched', p.name, 'GP', GP, 'MIN', MIN, 'games', gameLog ? gameLog.length : 0);
  }

  if (onlyName) { console.log('onlyName set, skipping Lebanon'); return; }

  const lebanonPlayers = await get(`/rest/v1/players?team_id=eq.${lebanonTeam.id}&select=id,name,stats`);
  for (const p of lebanonPlayers) {
    const gm = LEBANON_GP_MIN[p.name];
    if (!gm) { console.log('SKIP (no GP/MIN mapping)', p.name); continue; }
    const [GP, MIN] = gm;
    const merged = { ...p.stats, GP, MIN };
    await patch(`/rest/v1/players?id=eq.${p.id}`, { stats: merged });
    console.log('lebanon patched', p.name, 'GP', GP, 'MIN', MIN);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
