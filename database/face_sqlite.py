import sqlite3, contextlib, os
from datetime import datetime

DB_PATH = "./data/faces.db"

def get_conn():
    return sqlite3.connect(DB_PATH)

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with contextlib.closing(get_conn()) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS persons (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                registered_at TEXT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS recognition_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                person_id TEXT,
                confidence REAL,
                timestamp TEXT
            )
        """)
        conn.commit()

def register_person(person_id: str, name: str):
    with contextlib.closing(get_conn()) as conn:
        conn.execute("INSERT OR REPLACE INTO persons VALUES (?,?,?)",
                     (person_id, name, datetime.utcnow().isoformat()))
        conn.commit()

def log_recognition(person_id: str, confidence: float):
    with contextlib.closing(get_conn()) as conn:
        conn.execute("INSERT INTO recognition_logs (person_id, confidence, timestamp) VALUES (?,?,?)",
                     (person_id, confidence, datetime.utcnow().isoformat()))
        conn.commit()

def get_person(person_id: str) -> dict | None:
    with contextlib.closing(get_conn()) as conn:
        row = conn.execute("SELECT id, name FROM persons WHERE id=?", (person_id,)).fetchone()
        return {"id": row[0], "name": row[1]} if row else None

def get_all_persons() -> list[dict]:
    with contextlib.closing(get_conn()) as conn:
        rows = conn.execute("SELECT id, name, registered_at FROM persons ORDER BY registered_at DESC").fetchall()
        return [{"id": r[0], "name": r[1], "registered_at": r[2]} for r in rows]

def delete_person(person_id: str):
    with contextlib.closing(get_conn()) as conn:
        conn.execute("DELETE FROM recognition_logs WHERE person_id=?", (person_id,))
        conn.execute("DELETE FROM persons WHERE id=?", (person_id,))
        conn.commit()