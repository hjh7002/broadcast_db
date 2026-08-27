@echo off
chcp 65001 >nul
cd /d "C:\Users\jangh\projects\broadcast-db"
"C:\Program Files\nodejs\node.exe" scripts\dailyStatsRefresh.js >> "C:\Users\jangh\projects\broadcast-db\scripts\daily-refresh.log" 2>&1
