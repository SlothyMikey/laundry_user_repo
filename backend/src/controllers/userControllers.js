const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const generateAccessToken = (payload) => {
  if (!process.env.ACCESS_TOKEN_SECRET)
    throw new Error("ACCESS_TOKEN_SECRET missing");
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1m", // Short-lived access token
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

const login = (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required." });
  }

  const sql =
    "SELECT user_id, username, password_hash FROM users WHERE username = ? LIMIT 1";
  db.query(sql, [username], async (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!rows || rows.length === 0)
      return res.status(401).json({ error: "Invalid credentials" });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Incorrect Password" });

    const payload = { user_id: user.user_id, username: user.username };

    const accessToken = generateAccessToken(payload);

    const refreshToken = generateRefreshToken(payload);

    //Refresh Token Expiration Date
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    db.query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
      [user.user_id, refreshToken, expiresAt],
      (err) => {
        if (err)
          return res
            .status(500)
            .json({ error: "Failed to save refresh token" });

        // Send refresh token as HTTP-only cookie
        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return res.status(200).json({
          accessToken,
          user: { user_id: user.user_id, username: user.username },
        });
      }
    );
  });
};

const refresh = (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  console.log("Refresh Token:", refreshToken);
  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token not found" });
  }

  // Verify refresh token
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Check if refresh token exists in database
    db.query(
      "SELECT * FROM refresh_tokens WHERE user_id = ? AND token = ? AND expires_at > NOW() LIMIT 1",
      [decoded.user_id, refreshToken],
      (err, rows) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (!rows || rows.length === 0) {
          return res.status(403).json({ error: "Invalid refresh token" });
        }

        // Generate new access token
        const payload = {
          user_id: decoded.user_id,
          username: decoded.username,
        };
        const newAccessToken = generateAccessToken(payload);

        return res.status(200).json({ accessToken: newAccessToken });
      }
    );
  } catch (err) {
    return res.status(403).json({ error: "Invalid refresh token" });
  }
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

const updateUserPassword = (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required." });
  }

  db.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: "Database query error" });
      }
      if (results.length <= 0) {
        return res.status(409).json({ error: "User not found" });
      }

      const user = results[0];

      const saltRounds = 10;
      bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
          return res.status(500).json({ error: "Error hashing password" });
        }
        db.query(
          "UPDATE users SET password_hash = ? WHERE user_id = ?",
          [hash, user.user_id],
          (err, results) => {
            if (err) {
              return res
                .status(500)
                .json({ error: "Database insertion error" });
            }
            return res
              .status(200)
              .json({ message: "User updated successfully" });
          }
        );
      });
    }
  );
};

module.exports = { verifyToken, login, refresh, logout, updateUserPassword };
