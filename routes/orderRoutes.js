const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

router.get("/", orderController.getOrders);
router.post("/", orderController.addOrder);
router.get("/customer/:userId", orderController.getCustomerHistory);
router.get("/product/:productId", orderController.getProductSales);

module.exports = router;
