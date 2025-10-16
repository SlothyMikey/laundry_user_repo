const express = require("express");
const router = express.Router();

const { handleUserGreetings } = require("../controllers/userControllers");

// Example route: User greetings
router.get("/greet", handleUserGreetings);

module.exports = router;
