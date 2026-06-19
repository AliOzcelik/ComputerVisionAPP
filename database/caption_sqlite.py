import sqlite3, contextlib, os

DB_PATH = "./data/captions.db"

def get_conn():
    return sqlite3.connect(DB_PATH)

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with contextlib.closing(get_conn()) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS caption_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_type TEXT NOT NULL,
                model_name TEXT NOT NULL,
                prompt TEXT,
                result_text TEXT NOT NULL,
                latency_ms INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        
def post_caption_logs(source_type: str, model_name: str, prompt: str, result_text: str, latency_ms: int):
    with contextlib.closing(get_conn()) as conn:
        conn.execute("""
            INSERT INTO caption_logs (source_type, model_name, prompt, result_text, latency_ms) 
            VALUES (?, ?, ?, ?, ?)
        """, (source_type, model_name, prompt, result_text, latency_ms))
        conn.commit()

def get_caption_logs(limit: int = 50) -> list[dict]:
      with contextlib.closing(get_conn()) as conn:
          rows = conn.execute(
              "SELECT id, model_name, prompt, result_text, latency_ms, source_type, created_at FROM caption_logs ORDER BY created_at DESC LIMIT ?",
              (limit,)
          ).fetchall()
          return [{"id": r[0], "model": r[1], "prompt": r[2], "result": r[3], "latency_ms": r[4], "source": r[5], "created_at": r[6]} for r in rows]