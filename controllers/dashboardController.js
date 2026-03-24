const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");

exports.getDashboard = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const { filter, startDate, endDate } = req.query;
    let dateQuery = {};

    if (filter || startDate || endDate) {
      const now = new Date();

      if (filter === "today") {
        const start = new Date(now.setHours(0, 0, 0, 0));
        const end = new Date(now.setHours(23, 59, 59, 999));
        dateQuery = { orderDate: { $gte: start, $lte: end } };
      } else if (filter === "week") {
        const start = new Date(now.setDate(now.getDate() - 7));
        dateQuery = { orderDate: { $gte: start } };
      } else if (filter === "month") {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        dateQuery = { orderDate: { $gte: start } };
      } else if (filter === "year") {
        const start = new Date(now.getFullYear(), 0, 1);
        dateQuery = { orderDate: { $gte: start } };
      } else if (startDate && endDate) {
        dateQuery = {
          orderDate: {
            $gte: new Date(startDate),
            $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
          },
        };
      }
    }

    const products = await Product.find();
    const users = await User.find();
    const allOrders = await Order.find(dateQuery)
      .populate("user")
      .populate("products.product")
      .sort({ orderDate: -1 });

    const totalOrders = allOrders.length;
    const totalPages = Math.ceil(totalOrders / limit);
    const orders = allOrders.slice(skip, skip + limit);

    const totalSales = allOrders.reduce((sum, o) => sum + o.total, 0);
    const totalGPay = allOrders
      .filter((o) => o.paymentMethod === "GPay")
      .reduce((sum, o) => sum + o.total, 0);
    const totalCash = allOrders
      .filter((o) => o.paymentMethod === "Cash")
      .reduce((sum, o) => sum + o.total, 0);

    // Calculate total pending: pending field + orders with Pending payment method
    const totalPending =
      allOrders.reduce((sum, o) => sum + (o.pending || 0), 0) +
      allOrders
        .filter((o) => o.paymentMethod === "Pending")
        .reduce((sum, o) => sum + o.total, 0);
    const totalDiscount = allOrders.reduce(
      (sum, o) => sum + (o.discount || 0),
      0,
    );

    // Calculate product-wise sales (include all products even with 0 orders)
    const productSalesMap = {};
    products.forEach((p) => {
      productSalesMap[p._id.toString()] = { name: p.name, quantity: 0, totalSales: 0 };
    });
    allOrders.forEach((order) => {
      order.products.forEach((item) => {
        if (!item.product) return;
        const productId = item.product._id.toString();
        if (!productSalesMap[productId]) {
          productSalesMap[productId] = { name: item.product.name, quantity: 0, totalSales: 0 };
        }
        productSalesMap[productId].quantity += item.quantity;
        productSalesMap[productId].totalSales += item.price * item.quantity;
      });
    });
    const productSales = Object.values(productSalesMap);

    res.render("admin/dashboard", {
      products,
      users,
      orders,
      totalSales,
      totalGPay,
      totalCash,
      totalPending,
      totalDiscount,
      productSales,
      currentPage: page,
      totalPages,
      filter: filter || "all",
      startDate: startDate || "",
      endDate: endDate || "",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
