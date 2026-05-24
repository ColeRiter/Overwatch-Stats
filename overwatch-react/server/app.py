from __future__ import annotations

import os
import secrets
import sqlite3
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

from flask import Flask, Response, jsonify, request, send_from_directory
from werkzeug.security import check_password_hash, generate_password_hash


OVERFAST_BASE_URL = os.getenv("OVERFAST_BASE_URL", "https://overfast-api.tekrop.fr/")
REQUEST_TIMEOUT_SECONDS = float(os.getenv("UPSTREAM_TIMEOUT_SECONDS", "12"))
DATABASE_PATH = os.getenv(
    "DATABASE_PATH",
    os.path.join(os.path.dirname(__file__), "overwatch.db"),
)

app = Flask(
    __name__,
    static_folder="../dist",
    static_url_path="",
)


def get_db_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    with get_db_connection() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                battlenet_tag TEXT,
                battlenet_player_id TEXT,
                battlenet_username TEXT,
                battlenet_avatar TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS search_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                player_id TEXT NOT NULL,
                query TEXT NOT NULL,
                username TEXT,
                avatar TEXT,
                searched_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            );
            """
        )
        existing_columns = {
            row["name"]
            for row in connection.execute("PRAGMA table_info(users)").fetchall()
        }
        migrations = {
            "battlenet_tag": "ALTER TABLE users ADD COLUMN battlenet_tag TEXT",
            "battlenet_player_id": "ALTER TABLE users ADD COLUMN battlenet_player_id TEXT",
            "battlenet_username": "ALTER TABLE users ADD COLUMN battlenet_username TEXT",
            "battlenet_avatar": "ALTER TABLE users ADD COLUMN battlenet_avatar TEXT",
        }
        for column_name, statement in migrations.items():
            if column_name not in existing_columns:
                connection.execute(statement)


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def public_user(row):
    return {
        "id": row["id"],
        "username": row["username"],
        "battlenet_tag": row["battlenet_tag"],
        "battlenet_player_id": row["battlenet_player_id"],
        "battlenet_username": row["battlenet_username"],
        "battlenet_avatar": row["battlenet_avatar"],
        "created_at": row["created_at"],
    }


def get_auth_user():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.removeprefix("Bearer ").strip()
    if not token:
        return None

    with get_db_connection() as connection:
        user = connection.execute(
            """
            SELECT
                users.id,
                users.username,
                users.battlenet_tag,
                users.battlenet_player_id,
                users.battlenet_username,
                users.battlenet_avatar,
                users.created_at
            FROM sessions
            JOIN users ON users.id = sessions.user_id
            WHERE sessions.token = ?
            """,
            (token,),
        ).fetchone()

    return user


def require_auth():
    user = get_auth_user()
    if not user:
        return None, (jsonify({"error": "Authentication required"}), 401)

    return user, None


@app.after_request
def add_cors_headers(response: Response) -> Response:
    response.headers["Access-Control-Allow-Origin"] = os.getenv("CORS_ORIGIN", "*")
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
    return response


@app.get("/api/health")
def health_check():
    return jsonify({"status": "ok"})


@app.post("/api/auth/register")
def register():
    payload = request.get_json(silent=True) or {}
    username = str(payload.get("username", "")).strip()
    password = str(payload.get("password", ""))

    if len(username) < 3:
        return jsonify({"error": "Username must be at least 3 characters."}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400

    token = secrets.token_urlsafe(32)

    try:
        with get_db_connection() as connection:
            cursor = connection.execute(
                """
                INSERT INTO users (username, password_hash, created_at)
                VALUES (?, ?, ?)
                """,
                (username, generate_password_hash(password), now_iso()),
            )
            user_id = cursor.lastrowid
            connection.execute(
                """
                INSERT INTO sessions (token, user_id, created_at)
                VALUES (?, ?, ?)
                """,
                (token, user_id, now_iso()),
            )
            user = connection.execute(
                """
                SELECT id, username, battlenet_tag, battlenet_player_id,
                    battlenet_username, battlenet_avatar, created_at
                FROM users
                WHERE id = ?
                """,
                (user_id,),
            ).fetchone()
    except sqlite3.IntegrityError:
        return jsonify({"error": "That username is already taken."}), 409

    return jsonify({"token": token, "user": public_user(user)}), 201


@app.post("/api/auth/login")
def login():
    payload = request.get_json(silent=True) or {}
    username = str(payload.get("username", "")).strip()
    password = str(payload.get("password", ""))

    with get_db_connection() as connection:
        user = connection.execute(
            """
            SELECT id, username, password_hash, battlenet_tag, battlenet_player_id,
                battlenet_username, battlenet_avatar, created_at
            FROM users
            WHERE username = ?
            """,
            (username,),
        ).fetchone()

        if not user or not check_password_hash(user["password_hash"], password):
            return jsonify({"error": "Invalid username or password."}), 401

        token = secrets.token_urlsafe(32)
        connection.execute(
            """
            INSERT INTO sessions (token, user_id, created_at)
            VALUES (?, ?, ?)
            """,
            (token, user["id"], now_iso()),
        )

    return jsonify({"token": token, "user": public_user(user)})


@app.post("/api/auth/logout")
def logout():
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.removeprefix("Bearer ").strip() if auth_header.startswith("Bearer ") else ""

    if token:
        with get_db_connection() as connection:
            connection.execute("DELETE FROM sessions WHERE token = ?", (token,))

    return jsonify({"status": "ok"})


@app.get("/api/auth/me")
def me():
    user, error = require_auth()
    if error:
        return error

    return jsonify({"user": public_user(user)})


@app.post("/api/profile/battlenet")
def link_battlenet():
    user, error = require_auth()
    if error:
        return error

    payload = request.get_json(silent=True) or {}
    battlenet_tag = str(payload.get("battlenet_tag", "")).strip()
    player_id = str(payload.get("player_id", "")).strip()
    battlenet_username = str(payload.get("username", "")).strip() or None
    battlenet_avatar = str(payload.get("avatar", "")).strip() or None

    if not battlenet_tag or not player_id:
        return jsonify({"error": "BattleTag and player_id are required."}), 400

    with get_db_connection() as connection:
        connection.execute(
            """
            UPDATE users
            SET battlenet_tag = ?,
                battlenet_player_id = ?,
                battlenet_username = ?,
                battlenet_avatar = ?
            WHERE id = ?
            """,
            (
                battlenet_tag,
                player_id,
                battlenet_username,
                battlenet_avatar,
                user["id"],
            ),
        )
        updated_user = connection.execute(
            """
            SELECT id, username, battlenet_tag, battlenet_player_id,
                battlenet_username, battlenet_avatar, created_at
            FROM users
            WHERE id = ?
            """,
            (user["id"],),
        ).fetchone()

    return jsonify({"user": public_user(updated_user)})


@app.get("/api/search-history")
def get_search_history():
    user, error = require_auth()
    if error:
        return error

    with get_db_connection() as connection:
        rows = connection.execute(
            """
            SELECT player_id, query, username, avatar, searched_at
            FROM search_history
            WHERE user_id = ?
            ORDER BY searched_at DESC
            LIMIT 10
            """,
            (user["id"],),
        ).fetchall()

    return jsonify({"history": [dict(row) for row in rows]})


@app.post("/api/search-history")
def save_search_history():
    user, error = require_auth()
    if error:
        return error

    payload = request.get_json(silent=True) or {}
    player_id = str(payload.get("player_id", "")).strip()
    query = str(payload.get("query", "")).strip()
    username = str(payload.get("username", "")).strip() or None
    avatar = str(payload.get("avatar", "")).strip() or None

    if not player_id or not query:
        return jsonify({"error": "player_id and query are required."}), 400

    with get_db_connection() as connection:
        connection.execute(
            """
            INSERT INTO search_history (user_id, player_id, query, username, avatar, searched_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (user["id"], player_id, query, username, avatar, now_iso()),
        )

    return jsonify({"status": "ok"}), 201


@app.route("/api/<path:upstream_path>", methods=["GET", "OPTIONS"])
def proxy_overfast(upstream_path: str):
    if request.method == "OPTIONS":
        return Response(status=204)

    upstream_url = urljoin(OVERFAST_BASE_URL, upstream_path)

    if request.query_string:
        upstream_url = f"{upstream_url}?{request.query_string.decode('utf-8')}"

    upstream_request = Request(
        upstream_url,
        headers={"Accept": request.headers.get("Accept", "application/json")},
        method="GET",
    )

    try:
        upstream_response = urlopen(
            upstream_request,
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        response_body = upstream_response.read()
        status_code = upstream_response.status
        upstream_headers = upstream_response.headers.items()
        content_type = upstream_response.headers.get("content-type")
    except HTTPError as exc:
        response_body = exc.read()
        status_code = exc.code
        upstream_headers = exc.headers.items()
        content_type = exc.headers.get("content-type")
    except URLError as exc:
        return (
            jsonify(
                {
                    "error": "Unable to reach Overfast API",
                    "details": str(exc.reason),
                }
            ),
            502,
        )

    excluded_headers = {
        "content-encoding",
        "content-length",
        "connection",
        "transfer-encoding",
    }
    headers = [
        (name, value)
        for name, value in upstream_headers
        if name.lower() not in excluded_headers
    ]

    return Response(
        response_body,
        status=status_code,
        headers=headers,
        content_type=content_type,
    )


@app.get("/")
def serve_index():
    dist_dir = app.static_folder
    if dist_dir and os.path.exists(os.path.join(dist_dir, "index.html")):
        return send_from_directory(dist_dir, "index.html")

    return jsonify(
        {
            "message": "Flask backend is running.",
            "frontend": "Run npm run dev for the React app, or npm run build to serve dist here.",
        }
    )


@app.get("/<path:path>")
def serve_react_app(path: str):
    dist_dir = app.static_folder
    if dist_dir and os.path.exists(os.path.join(dist_dir, path)):
        return send_from_directory(dist_dir, path)

    if dist_dir and os.path.exists(os.path.join(dist_dir, "index.html")):
        return send_from_directory(dist_dir, "index.html")

    return jsonify({"error": "Not found"}), 404

init_db()


if __name__ == "__main__":
    app.run(
        host=os.getenv("FLASK_HOST", "127.0.0.1"),
        port=int(os.getenv("FLASK_PORT", "5000")),
        debug=os.getenv("FLASK_DEBUG", "0") == "1",
    )
