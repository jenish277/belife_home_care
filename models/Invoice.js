const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  invoiceNumber: { type: String, required: true },
  details: { type: String, required: true }, // bill text
  sentAt: { type: Date, default: Date.now },
}, {
  timestamps: true
});

module.exports = mongoose.model("Invoice", invoiceSchema);
