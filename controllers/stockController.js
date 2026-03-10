const StockUpdate = require("../models/StockUpdate");
const Product = require("../models/Product");

// Get all stock updates
exports.getStockUpdates = async (req, res) => {
  try {
    const stockUpdates = await StockUpdate.find().populate("product");
    res.json(stockUpdates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add stock
exports.addStock = async (req, res) => {
  try {
    const { productId, incomingQuantity, notes } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const totalAvailable = product.availableQuantity + incomingQuantity;
    const stockUpdate = new StockUpdate({
      product: productId,
      incomingQuantity,
      totalAvailable,
      stockDate: new Date(),
      notes,
    });
    await stockUpdate.save();

    product.availableQuantity = totalAvailable;
    await product.save();

    res.status(201).json(stockUpdate);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
