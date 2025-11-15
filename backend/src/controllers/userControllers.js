const db = require("../config/db");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateAccessToken = (payload) => {
  if (!process.env.ACCESS_TOKEN_SECRET)
    throw new Error("ACCESS_TOKEN_SECRET missing");
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "30m", // Short-lived access token
  });
};

const generateRefreshToken = (payload) => {
  if (!process.env.REFRESH_TOKEN_SECRET)
    throw new Error("REFRESH_TOKEN_SECRET missing");
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d", // Long-lived refresh token
  });
};

const verifyToken = (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    return res.status(200).json({ valid: true, user: decoded });
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

const googleLogin = async (req, res) => {
  const { googleToken, email, name } = req.body;

  try {
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const googleId = payload.sub;

    // Whitelist check - only these Gmail accounts can access
    const allowedEmails = [
      "kerbydalan076@gmail.com",
      "dencell-jay.montederamos@cvsu.edu.ph",
    ];

    if (!allowedEmails.includes(email)) {
      return res.status(403).json({
        error:
          "Access denied. Only authorized Gmail accounts can access this system.",
      });
    }

    // Find or create user
    db.query(
      "SELECT user_id, username, email FROM users WHERE google_id = ? OR email = ?",
      [googleId, email],
      (err, rows) => {
        if (err) return res.status(500).json({ error: "Database error" });

        let userId, username;

        if (rows.length === 0) {
          // Create new user
          db.query(
            "INSERT INTO users (username, email, google_id) VALUES (?, ?, ?)",
            [name, email, googleId],
            (err, result) => {
              if (err)
                return res.status(500).json({ error: "User creation failed" });
              userId = result.insertId;
              generateAndSendTokens(userId, name, res);
            }
          );
        } else {
          // User exists
          userId = rows[0].user_id;
          username = rows[0].username;

          // Update google_id if not set
          if (!rows[0].google_id) {
            db.query("UPDATE users SET google_id = ? WHERE user_id = ?", [
              googleId,
              userId,
            ]);
          }

          generateAndSendTokens(userId, username, res);
        }
      }
    );
  } catch (err) {
    console.error("Google token verification failed:", err);
    return res.status(401).json({ error: "Invalid Google token" });
  }
};

function generateAndSendTokens(userId, username, res) {
  const payload = { user_id: userId, username };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Use refresh token embedded expiration (seconds → ms)
  const rtDecoded = jwt.decode(refreshToken);
  const expiresAt = new Date(rtDecoded.exp * 1000);

  db.query(
    "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
    [userId, refreshToken, expiresAt],
    (err) => {
      if (err) return res.status(500).json({ error: "Token save failed" });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: rtDecoded.exp * 1000 - Date.now(),
      });

      return res.status(200).json({
        accessToken,
        user: { user_id: userId, username },
      });
    }
  );
}

const refresh = (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res
      .status(401)
      .json({ error: "Invalid refresh token. Please log in again." });
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    return res.status(403).json({ error: "Invalid Token" });
  }

  db.query(
    "SELECT id, expires_at FROM refresh_tokens WHERE user_id = ? AND token = ? LIMIT 1",
    [decoded.user_id, refreshToken],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error" });

      if (!rows || rows.length === 0) {
        return res
          .status(403)
          .json({ error: "Token expired. Please log in again." });
      }

      const newAccessToken = generateAccessToken({
        user_id: decoded.user_id,
        username: decoded.username,
      });

      return res.status(200).json({ accessToken: newAccessToken });
    }
  );
};

const logout = (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({ error: "No refresh token provided" });
  }

  // Delete refresh token from database
  db.query(
    "DELETE FROM refresh_tokens WHERE token = ?",
    [refreshToken],
    (err) => {
      if (err) return res.status(500).json({ error: "Failed to logout" });

      // Clear cookie
      res.clearCookie("refreshToken");
      return res.status(200).json({ message: "Logged out successfully" });
    }
  );
};

module.exports = {
  verifyToken,
  login,
  googleLogin,
  refresh,
  logout,
};
