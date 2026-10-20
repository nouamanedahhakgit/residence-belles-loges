@echo off
echo ===================================================
echo Synchronisation Supabase -> Excel (Residence Belles Loges)
echo ===================================================
cd /d "%~dp0"
python scripts/sync_excel.py
echo ===================================================
echo Termine ! Votre fichier Excel est a jour.
echo ===================================================
pause
