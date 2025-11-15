const express = require("express");
const router = express.Router();

const { getAllActiveServices } = require("../controllers/serviceControllers");

router.get("/active", getAllActiveServices);

module.exports = router;
