const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  }],
  total: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ["GPay", "Cash", "Pending"], default: "Cash" },
  pending: { type: Number, default: 0 },
  orderDate: { type: Date, default: Date.now },
}, {
  timestamps: true
});

module.exports = mongoose.model("Order", orderSchema);
