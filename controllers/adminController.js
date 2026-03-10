const Product = require("../models/Product");
const User = require("../models/User");
const Order = require("../models/Order");
const StockUpdate = require("../models/StockUpdate");
const smsService = require("../services/smsService");

// Dashboard
exports.getDashboard = async (req, res) => {
  try {
    const products = await Product.find();
    const users = await User.find();
    const orders = await Order.find().populate("user").populate("products.product");
    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
    const totalProducts = products.reduce((sum, product) => sum + product.availableQnt, 0);
    res.render("admin/dashboard", { products, users, orders, totalSales, totalProducts });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// Products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.render("admin/products", { products });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.addProduct = async (req, res) => {
  try {
    const { name, price, availableQnt } = req.body;
    await Product.create({ name, price, availableQnt });
    res.redirect("/admin/products");
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// Users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.render("admin/users", { users });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.addUser = async (req, res) => {
  try {
    const { name, number, address } = req.body;
    await User.create({ name, number, address });
    res.redirect("/admin/users");
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// Orders
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("user").populate("products.product");
    res.render("admin/orders", { orders });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.addOrder = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;
    const product = await Product.findById(productId);
    if (!product || product.availableQnt < quantity) {
      return res.status(400).send("Insufficient stock");
    }
    const total = product.price * quantity;
    const order = await Order.create({
      user: userId,
      products: [{ product: productId, quantity, price: product.price }],
      total,
    });
    product.availableQnt -= quantity;
    await product.save();

    // Send WhatsApp message
    const user = await User.findById(userId);
    await smsService.sendOrderSMS(user.number, {
      orderId: order._id.toString().slice(-6),
      customerName: user.name,
      items: `${product.name} x${quantity}`,
      subtotal: total,
      discount: 0,
      total: total
    });

    res.redirect("/admin/orders");
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// Stock
exports.getStock = async (req, res) => {
  try {
    const stockUpdates = await StockUpdate.find().populate("product");
    const products = await Product.find();
    res.render("admin/stock", { stockUpdates, products });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.addStock = async (req, res) => {
  try {
    const { productId, quantityAdded, notes } = req.body;
    await StockUpdate.create({ product: productId, quantityAdded, notes });
    const product = await Product.findById(productId);
    product.availableQnt += parseInt(quantityAdded);
    await product.save();
    res.redirect("/admin/stock");
  } catch (error) {
    res.status(500).send(error.message);
  }
};
