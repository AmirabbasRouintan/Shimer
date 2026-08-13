import express from "express";
import cors from "cors";
import { neon } from "@neondatabase/serverless";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cloudinary from "cloudinary";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET || "shimer-secret-change-in-production";
const DATABASE_URL = process.env.DATABASE_URL;
const APP_REDIRECT_SCHEME = "Shimer";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

let googleClient;
let googleOAuth2;
try {
  if (GOOGLE_CLIENT_ID) {
    googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
    googleOAuth2 = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      `${APP_REDIRECT_SCHEME}://auth-success`
    );
  }
} catch (e) {
  console.error("Failed to create Google clients:", e);
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
        google_id VARCHAR(255) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        picture TEXT,
        password_hash VARCHAR(255),
        auth_provider VARCHAR(50) DEFAULT 'google',
        created_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP DEFAULT NOW()
      );
    `;
    await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`;
    await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'google'`;
    await db`ALTER TABLE users ALTER COLUMN google_id DROP NOT NULL`;
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

async function findOrCreateUser(google_id, email, name, picture) {
  await ensureDB();
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
  return user;
}

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, googleId: user.google_id || null, email: user.email },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

// Start Google OAuth login
app.get("/api/auth/google/login", (req, res) => {
  if (!googleOAuth2) {
    return res.status(500).send("Google OAuth not configured");
  }
  const authUrl = googleOAuth2.generateAuthUrl({
    access_type: "offline",
    scope: ["profile", "email"],
    prompt: "select_account",
  });
  res.redirect(authUrl);
});

// Google OAuth callback
app.get("/api/auth/google/callback", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send("Missing authorization code");
    }

    const { tokens } = await googleOAuth2.getToken(code);
    const idToken = tokens.id_token;

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: google_id, email, name, picture } = payload;

    const user = await findOrCreateUser(google_id, email, name, picture);
    const appToken = generateToken(user);

    const dataRows = await getSql()`
      SELECT data FROM user_data WHERE user_id = ${user.id}
    `;
    const hasData = dataRows[0]?.data && Object.keys(dataRows[0].data).length > 0;

    res.redirect(
      `${APP_REDIRECT_SCHEME}://auth-success?token=${appToken}&hasData=${hasData}`
    );
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.status(500).send("Authentication failed");
  }
});

// App sends idToken directly (for dev / fallback)
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

    const user = await findOrCreateUser(google_id, email, name, picture);
    const appToken = generateToken(user);

    const dataRows = await getSql()`
      SELECT data FROM user_data WHERE user_id = ${user.id}
    `;
    const hasData = dataRows[0]?.data && Object.keys(dataRows[0].data).length > 0;

    res.json({ token: appToken, user, hasData });
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
});

// Email/password signup
app.post("/api/auth/signup", async (req, res) => {
  try {
    await ensureDB();
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const db = getSql();
    const existing = await db`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const users = await db`
      INSERT INTO users (email, name, password_hash, auth_provider, last_login)
      VALUES (${email}, ${name || email.split("@")[0]}, ${passwordHash}, 'email', NOW())
      RETURNING id, google_id, email, name, picture, auth_provider, created_at, last_login
    `;
    const user = users[0];

    await db`
      INSERT INTO user_data (user_id, data) VALUES (${user.id}, '{}')
      ON CONFLICT (user_id) DO NOTHING
    `;

    const appToken = generateToken(user);
    res.json({ token: appToken, user, hasData: false });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Failed to create account" });
  }
});

// Email/password login
app.post("/api/auth/login", async (req, res) => {
  try {
    await ensureDB();
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const db = getSql();
    const users = await db`
      SELECT id, google_id, email, name, picture, password_hash, auth_provider, created_at, last_login
      FROM users WHERE email = ${email} AND auth_provider = 'email'
    `;

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    await db`UPDATE users SET last_login = NOW() WHERE id = ${user.id}`;

    const { password_hash, ...safeUser } = user;
    const appToken = generateToken(safeUser);

    const dataRows = await db`
      SELECT data FROM user_data WHERE user_id = ${user.id}
    `;
    const hasData = dataRows[0]?.data && Object.keys(dataRows[0].data).length > 0;

    res.json({ token: appToken, user: safeUser, hasData });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    await ensureDB();
    const db = getSql();
    const users = await db`
      SELECT id, google_id, email, name, picture, auth_provider, created_at, last_login
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

app.put("/api/auth/profile", authMiddleware, async (req, res) => {
  try {
    await ensureDB();
    const db = getSql();
    const { name, email, picture } = req.body;

    if (email) {
      const existing = await db`
        SELECT id FROM users WHERE email = ${email} AND id != ${req.user.userId}
      `;
      if (existing.length > 0) {
        return res.status(409).json({ error: "Email already in use" });
      }
    }

    const setClauses = [];
    const values = [];
    if (name !== undefined) { setClauses.push(`name = $${setClauses.length + 1}`); values.push(name); }
    if (email !== undefined) { setClauses.push(`email = $${setClauses.length + 1}`); values.push(email); }
    if (picture !== undefined) { setClauses.push(`picture = $${setClauses.length + 1}`); values.push(picture); }
    if (setClauses.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(req.user.userId);
    const query = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING id, google_id, email, name, picture, auth_provider, created_at, last_login`;
    const users = await db(query, values);

    res.json({ user: users[0] });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

app.put("/api/auth/password", authMiddleware, async (req, res) => {
  try {
    await ensureDB();
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    const db = getSql();
    const users = await db`
      SELECT id, password_hash, auth_provider FROM users WHERE id = ${req.user.userId}
    `;

    if (users.length === 0 || users[0].auth_provider !== 'email') {
      return res.status(400).json({ error: "Password change only available for email accounts" });
    }

    const valid = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${req.user.userId}`;

    res.json({ success: true });
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({ error: "Failed to change password" });
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

// Upload profile image to Cloudinary
app.post("/api/upload/image", authMiddleware, async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Missing image" });
    }

    const result = await cloudinary.v2.uploader.upload(image, {
      folder: "shimer/avatars",
      transformation: [
        { width: 500, height: 500, crop: "fill" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    res.json({ url: result.secure_url });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload image" });
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
