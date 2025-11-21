@echo off
echo Running database migration...
echo Adding realized_pnl column and updating trigger function...
psql -h localhost -U ssa_admin -d stable_spy_users -f src\db\migration_add_realized_pnl.sql
echo.
echo Migration complete!
pause
