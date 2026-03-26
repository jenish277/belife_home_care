const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const Invoice = require("../models/Invoice");
// const whatsappService = require("../services/whatsappService");
const invoiceService = require("../services/invoiceService");
const smsService = require("../services/smsService");

// Get all orders
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("user").populate("products.product");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a new order
exports.addOrder = async (req, res) => {
  try {
    const { userId, products: orderProducts } = req.body;
    if (!userId || !orderProducts || orderProducts.length === 0) {
      return res.status(400).json({ message: "User ID and products are required" });
    }
    for (const item of orderProducts) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ message: "Invalid product data" });
      }
    }
    // ... rest of the code

    let totalPrice = 0;
    const products = [];

    for (const item of orderProducts) {
      const product = await Product.findById(item.productId);
      if (!product || product.availableQuantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
      products.push({ product: item.productId, quantity: item.quantity, price: product.price });
      totalPrice += product.price * item.quantity;
      product.availableQuantity -= item.quantity;
      await product.save();
    }

    const discount = req.body.discount || 0;
    const finalTotal = totalPrice - discount;

    const order = new Order({
      user: userId,
      products,
      total: finalTotal,
      discount: discount,
      orderDate: new Date(),
    });
    await order.save();

    const user = await User.findById(userId);
    const itemsList = products.map(p => `${p.product.name} x${p.quantity}`).join('\n');

    // Send SMS
    await smsService.sendOrderSMS(user.phoneNumber, {
      orderId: order._id.toString().slice(-6),
      customerName: user.name,
      items: itemsList,
      subtotal: totalPrice,
      discount: discount,
      total: finalTotal
    });

    res.status(201).json({ order });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get customer purchase history
exports.getCustomerHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ user: userId }).populate("products.product");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get product-wise sales
exports.getProductSales = async (req, res) => {
  try {
    const { productId } = req.params;
    const orders = await Order.find({ "products.product": productId }).populate("user");
    const sales = orders.map(order => ({
      user: order.user,
      quantity: order.products.find(p => p.product.toString() === productId).quantity,
      total: order.products.find(p => p.product.toString() === productId).price * order.products.find(p => p.product.toString() === productId).quantity,
      orderDate: order.orderDate,
    }));
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
