const express = require("express");
const router = express.Router();

const {
  createWalkInOrder,
  getAllOrders,
  updateOrderStatus,
  updateOrderPaymentStatus,
  editOrder,
} = require("../controllers/orderControllers");

router.post("/create", createWalkInOrder);
router.get("/", getAllOrders);
router.patch("/:orderId/status", updateOrderStatus);
router.patch("/:orderId/payment", updateOrderPaymentStatus);
router.put("/:orderId/edit", editOrder);
module.exports = router;
