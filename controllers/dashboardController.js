const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const StockUpdate = require("../models/StockUpdate");

// Get dashboard analytics
exports.getDashboard = async (req, res) => {
  try {
    const products = await Product.find();
    const orders = await Order.find().populate("products.product");
    const users = await User.find();

    const totalProducts = products.reduce((sum, p) => sum + p.availableQuantity, 0);
    const totalSold = orders.reduce((sum, o) => sum + o.products.reduce((s, p) => s + p.quantity, 0), 0);
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const lowStockProducts = products.filter(p => p.availableQuantity < 10); // assuming low stock <10

    const recentOrders = await Order.find().populate("user").populate("products.product").sort({ orderDate: -1 }).limit(5);

    res.json({
      totalProducts,
      totalStock: totalProducts,
      totalSales: totalSold,
      totalRevenue,
      recentOrders,
      lowStockProducts,
      totalUsers: users.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
