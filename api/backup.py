#!/usr/bin/env python3
"""
Daily database backup — runs via cron or manually.
Saves compressed SQL dumps to ./backups/ folder.
"""
import os, subprocess, datetime, pathlib

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://agentpay:localdev@localhost:5432/agentpay")
BACKUP_DIR = pathlib.Path(__file__).parent / "backups"
BACKUP_DIR.mkdir(exist_ok=True)

def run_backup():
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = BACKUP_DIR / f"agentpay_{timestamp}.sql.gz"
    
    cmd = f'pg_dump "{DATABASE_URL}" | gzip > {filename}'
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    
    if result.returncode == 0:
        size = filename.stat().st_size
        print(f"✅ Backup saved: {filename.name} ({size:,} bytes)")
    else:
        print(f"❌ Backup failed: {result.stderr}")
        raise SystemExit(1)
    
    # Keep only last 7 backups
    backups = sorted(BACKUP_DIR.glob("*.sql.gz"))
    for old in backups[:-7]:
        old.unlink()
        print(f"🗑️  Removed old backup: {old.name}")

if __name__ == "__main__":
    run_backup()
