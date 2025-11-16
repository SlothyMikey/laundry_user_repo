const express = require("express");
const router = express.Router();

const {
  addBooking,
  getAllBookings,
  declineBooking,
} = require("../controllers/bookingControllers");

router.post("/add", addBooking);
router.post("/decline/:bookingId", declineBooking);
router.get("/", getAllBookings);

module.exports = router;
