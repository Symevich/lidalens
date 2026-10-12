@echo off
chcp 65001 >nul
rem ============================================================
rem  LidaLens + фіча «Ліда ў аб'ектыве» (распазнаванне па камеры)
rem  Запускае лакальны сервер і адкрывае браузер.
rem ============================================================
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo [!] Няма віртуальнага асяроддзя .venv
  echo     Стварыце:  python -m venv .venv
  echo     Усталюйце: .venv\Scripts\pip install -r requirements.txt
  pause
  exit /b 1
)
start "" http://127.0.0.1:8000/
".venv\Scripts\python.exe" -m uvicorn server.app:app --host 127.0.0.1 --port 8000
pause
