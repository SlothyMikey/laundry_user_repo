const express = require("express");
const router = express.Router();
const {
  verifyToken,
  googleLogin,
  refresh,
  logout,
} = require("../controllers/userControllers");

router.post("/google-login", googleLogin);
router.get("/verify", verifyToken);
router.post("/refresh", refresh);
router.post("/logout", logout);

module.exports = router;
