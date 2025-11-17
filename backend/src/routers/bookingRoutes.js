const express = require("express");
const router = express.Router();

const {
  addBooking,
  getAllBookings,
  declineBooking,
  acceptBooking,
} = require("../controllers/bookingControllers");

router.post("/add", addBooking);
router.post("/decline/:bookingId", declineBooking);
router.post("/accept/:bookingId", acceptBooking);
router.get("/", getAllBookings);

module.exports = router;
