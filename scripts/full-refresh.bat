@echo off
cd /d "C:\Users\jangh\projects\broadcast-db"
"C:\Program Files\nodejs\node.exe" scripts\fullProfileRefresh.js >> "C:\Users\jangh\projects\broadcast-db\scripts\full-refresh.log" 2>&1
