const express = require("express");
const router = express.Router();
const stockController = require("../controllers/stockController");

router.get("/", stockController.getStockUpdates);
router.post("/", stockController.addStock);

module.exports = router;
