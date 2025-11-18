const express = require("express");
const router = express.Router();

const { createWalkInOrder } = require("../controllers/orderControllers");

router.post("/create", createWalkInOrder);

module.exports = router;
