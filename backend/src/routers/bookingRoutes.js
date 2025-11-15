const express = require("express");
const router = express.Router();

const { addBooking } = require("../controllers/bookingControllers");

router.post("/add", addBooking);

module.exports = router;
