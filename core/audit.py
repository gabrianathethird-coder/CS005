import sqlite3
import os
from datetime import datetime

# Path to the local audit log SQLite database.
DB_PATH = 'keynest.db'


def init_db():
    """Initialize the audit database and create the logs table if needed."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME,
            action_type TEXT,
            filename TEXT,
            status TEXT,
            details TEXT
        )
    ''')
    conn.commit()
    conn.close()


def log_action(action_type: str, filename: str, status: str, details: str = ""):
    """Record a new audit event with a timestamp and optional details."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO logs (timestamp, action_type, filename, status, details)
        VALUES (?, ?, ?, ?, ?)
    ''', (datetime.now().isoformat(), action_type, filename, status, details))
    conn.commit()
    conn.close()


def get_logs():
    """Return the most recent audit records as a list of dictionaries."""
    if not os.path.exists(DB_PATH):
        return []
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
