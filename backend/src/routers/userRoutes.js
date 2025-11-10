const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");

const {
  login,
  logout,
  updateUserPassword,
} = require("../controllers/userControllers");

// Example route: User greetings
router.post("/login", login);
router.post("/logout", logout);
router.put("/update", updateUserPassword);
router.get("/protected", authenticateToken, (req, res) => {
  res.send(`Hello, ${req.user.username}. This is a protected route.`);
});

module.exports = router;
