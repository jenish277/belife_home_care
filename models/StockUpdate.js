const mongoose = require("mongoose");

const stockUpdateSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantityAdded: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  notes: { type: String },
}, {
  timestamps: true
});

module.exports = mongoose.model("StockUpdate", stockUpdateSchema);
