import express from "express";
import cors from "cors";
import pkg from "pg";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import "dotenv/config";

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET || "shimer-secret-change-in-production";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        google_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        picture TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_data (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        data JSONB NOT NULL DEFAULT '{}',
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Database initialized");
  } finally {
    client.release();
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
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: "Missing idToken" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: google_id, email, name, picture } = payload;

    const result = await pool.query(
      `INSERT INTO users (google_id, email, name, picture, last_login)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (google_id)
       DO UPDATE SET email = $2, name = $3, picture = $4, last_login = NOW()
       RETURNING id, google_id, email, name, picture, created_at, last_login`,
      [google_id, email, name, picture]
    );

    const user = result.rows[0];

    // Ensure user_data row exists
    await pool.query(
      `INSERT INTO user_data (user_id, data) VALUES ($1, '{}')
       ON CONFLICT (user_id) DO NOTHING`,
      [user.id]
    );

    const token = jwt.sign(
      { userId: user.id, googleId: user.google_id, email: user.email },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Check if user has existing data
    const dataResult = await pool.query(
      "SELECT data FROM user_data WHERE user_id = $1",
      [user.id]
    );
    const hasData = dataResult.rows[0]?.data && Object.keys(dataResult.rows[0].data).length > 0;

    res.json({ token, user, hasData });
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
});

app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, google_id, email, name, picture, created_at, last_login FROM users WHERE id = $1",
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const dataResult = await pool.query(
      "SELECT data FROM user_data WHERE user_id = $1",
      [req.user.userId]
    );
    const hasData = dataResult.rows[0]?.data && Object.keys(dataResult.rows[0].data).length > 0;

    res.json({ user: result.rows[0], hasData });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
});

app.get("/api/data", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT data, updated_at FROM user_data WHERE user_id = $1",
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.json({ data: {}, updatedAt: null });
    }

    res.json({ data: result.rows[0].data, updatedAt: result.rows[0].updated_at });
  } catch (error) {
    console.error("Get data error:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

app.put("/api/data", authMiddleware, async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ error: "Missing data" });
    }

    await pool.query(
      `INSERT INTO user_data (user_id, data, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET data = $2, updated_at = NOW()`,
      [req.user.userId, JSON.stringify(data)]
    );

    res.json({ success: true, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Save data error:", error);
    res.status(500).json({ error: "Failed to save data" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3001;

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
