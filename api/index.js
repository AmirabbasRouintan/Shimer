import express from "express";
import cors from "cors";
import { neon } from "@neondatabase/serverless";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET || "shimer-secret-change-in-production";
const DATABASE_URL = process.env.DATABASE_URL;

let googleClient;
try {
  if (GOOGLE_CLIENT_ID) {
    googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
  }
} catch (e) {
  console.error("Failed to create Google client:", e);
}

let dbInitialized = false;
let sql;

function getSql() {
  if (!sql && DATABASE_URL) {
    sql = neon(DATABASE_URL);
  }
  return sql;
}

async function ensureDB() {
  if (dbInitialized || !getSql()) return;
  try {
    const db = getSql();
    await db`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        google_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        picture TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP DEFAULT NOW()
      );
    `;
    await db`
      CREATE TABLE IF NOT EXISTS user_data (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        data JSONB NOT NULL DEFAULT '{}',
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    dbInitialized = true;
    console.log("Database initialized");
  } catch (e) {
    console.error("DB init error:", e);
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

app.post("/api/auth/google", async (req, res) => {
  try {
    await ensureDB();
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: "Missing idToken" });
    }
    if (!googleClient) {
      return res.status(500).json({ error: "Google auth not configured" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: google_id, email, name, picture } = payload;
    const db = getSql();

    const users = await db`
      INSERT INTO users (google_id, email, name, picture, last_login)
      VALUES (${google_id}, ${email}, ${name}, ${picture}, NOW())
      ON CONFLICT (google_id)
      DO UPDATE SET email = ${email}, name = ${name}, picture = ${picture}, last_login = NOW()
      RETURNING id, google_id, email, name, picture, created_at, last_login
    `;

    const user = users[0];

    await db`
      INSERT INTO user_data (user_id, data) VALUES (${user.id}, '{}')
      ON CONFLICT (user_id) DO NOTHING
    `;

    const token = jwt.sign(
      { userId: user.id, googleId: user.google_id, email: user.email },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    const dataRows = await db`
      SELECT data FROM user_data WHERE user_id = ${user.id}
    `;
    const hasData = dataRows[0]?.data && Object.keys(dataRows[0].data).length > 0;

    res.json({ token, user, hasData });
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
});

app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    await ensureDB();
    const db = getSql();
    const users = await db`
      SELECT id, google_id, email, name, picture, created_at, last_login
      FROM users WHERE id = ${req.user.userId}
    `;

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const dataRows = await db`
      SELECT data FROM user_data WHERE user_id = ${req.user.userId}
    `;
    const hasData = dataRows[0]?.data && Object.keys(dataRows[0].data).length > 0;

    res.json({ user: users[0], hasData });
  } catch (error) {
    console.error("Me error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
});

app.get("/api/data", authMiddleware, async (req, res) => {
  try {
    await ensureDB();
    const db = getSql();
    const rows = await db`
      SELECT data, updated_at FROM user_data WHERE user_id = ${req.user.userId}
    `;

    if (rows.length === 0) {
      return res.json({ data: {}, updatedAt: null });
    }

    res.json({ data: rows[0].data, updatedAt: rows[0].updated_at });
  } catch (error) {
    console.error("Get data error:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

app.put("/api/data", authMiddleware, async (req, res) => {
  try {
    await ensureDB();
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ error: "Missing data" });
    }

    const db = getSql();
    await db`
      INSERT INTO user_data (user_id, data, updated_at)
      VALUES (${req.user.userId}, ${JSON.stringify(data)}, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET data = ${JSON.stringify(data)}, updated_at = NOW()
    `;

    res.json({ success: true, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Save data error:", error);
    res.status(500).json({ error: "Failed to save data" });
  }
});

app.get("/api/health", async (req, res) => {
  try {
    await ensureDB();
    const db = getSql();
    if (db) {
      await db`SELECT 1`;
      res.json({ status: "ok", db: "connected" });
    } else {
      res.json({ status: "ok", db: "no url configured" });
    }
  } catch (e) {
    res.json({ status: "ok", db: "init failed" });
  }
});

export default app;
