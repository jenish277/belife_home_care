const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
require('dotenv').config();
const app = express();

// Initialize WhatsApp service
const whatsappService = require('./services/whatsappService');

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));

// Import routes
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");
const stockRoutes = require("./routes/stockRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

// Import middleware
const authMiddleware = require("./middleware/authMiddleware");
const errorHandler = require("./middleware/errorHandler");

// MongoDB Connection
const dbURI = "mongodb+srv://jenishrabadiya277:DlawQns07yu3RPQ1@jr-project.gtdgy.mongodb.net/?retryWrites=true&w=majority";
mongoose
  .connect(dbURI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Routes with auth
app.use("/api/products", authMiddleware, productRoutes);
app.use("/api/users", authMiddleware, userRoutes);
app.use("/api/orders", authMiddleware, orderRoutes);
app.use("/api/stock", authMiddleware, stockRoutes);
app.use("/api/dashboard", authMiddleware, dashboardRoutes);

// Dashboard view (for admin interface)
app.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    
    const products = await require("./models/Product").find();
    const users = await require("./models/User").find();
    const allOrders = await require("./models/Order").find().populate("user").populate("products.product");
    const totalSales = allOrders.reduce((sum, order) => sum + order.total, 0);
    const totalProducts = products.reduce((sum, product) => sum + product.availableQuantity, 0);
    
    const totalOrders = allOrders.length;
    const orders = await require("./models/Order").find().populate("user").populate("products.product").sort({ orderDate: -1 }).skip(skip).limit(limit);
    const totalPages = Math.ceil(totalOrders / limit);
    
    res.render("admin/dashboard", { products, users, orders, totalSales, totalProducts, currentPage: page, totalPages });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Admin Products Page
app.get("/admin/products", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    
    const Product = require("./models/Product");
    const totalProducts = await Product.countDocuments();
    const products = await Product.find().skip(skip).limit(limit);
    const totalPages = Math.ceil(totalProducts / limit);
    
    res.render("admin/products", { products, currentPage: page, totalPages });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/admin/products", async (req, res) => {
  try {
    const Product = require("./models/Product");
    await Product.create(req.body);
    res.redirect("/admin/products");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/admin/products/update/:id", async (req, res) => {
  try {
    const Product = require("./models/Product");
    await Product.findByIdAndUpdate(req.params.id, req.body);
    res.redirect("/admin/products");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/admin/products/delete/:id", async (req, res) => {
  try {
    const Product = require("./models/Product");
    await Product.findByIdAndDelete(req.params.id);
    res.redirect("/admin/products");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Admin Users Page
app.get("/admin/users", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    
    const User = require("./models/User");
    const Order = require("./models/Order");
    const totalUsers = await User.countDocuments();
    const users = await User.find().skip(skip).limit(limit);
    
    const usersWithOrders = await Promise.all(users.map(async (user) => {
      const orders = await Order.find({ user: user._id }).populate('products.product');
      const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
      return {
        ...user.toObject(),
        orders: orders,
        totalSpent: totalSpent
      };
    }));
    
    const totalPages = Math.ceil(totalUsers / limit);
    res.render("admin/users", { users: usersWithOrders, currentPage: page, totalPages });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/admin/users", async (req, res) => {
  try {
    const User = require("./models/User");
    await User.create({
      name: req.body.name,
      phoneNumber: req.body.number,
      address: req.body.address
    });
    res.redirect("/admin/users");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/admin/users/update/:id", async (req, res) => {
  try {
    const User = require("./models/User");
    await User.findByIdAndUpdate(req.params.id, {
      name: req.body.name,
      phoneNumber: req.body.number,
      address: req.body.address
    });
    res.redirect("/admin/users");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/admin/users/delete/:id", async (req, res) => {
  try {
    const User = require("./models/User");
    await User.findByIdAndDelete(req.params.id);
    res.redirect("/admin/users");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Admin Orders Page
app.get("/admin/orders", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    
    const Order = require("./models/Order");
    const totalOrders = await Order.countDocuments();
    const orders = await Order.find().populate("user").populate("products.product").sort({ orderDate: -1 }).skip(skip).limit(limit);
    const users = await require("./models/User").find();
    const products = await require("./models/Product").find();
    const totalPages = Math.ceil(totalOrders / limit);
    
    res.render("admin/orders", { orders, users, products, currentPage: page, totalPages });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/admin/orders", async (req, res) => {
  try {
    const Order = require("./models/Order");
    const Product = require("./models/Product");
    const User = require("./models/User");
    
    // Create or find user
    let user = await User.findOne({ phoneNumber: req.body.customerPhone });
    if (!user) {
      user = await User.create({
        name: req.body.customerName,
        phoneNumber: req.body.customerPhone,
        address: req.body.customerAddress
      });
    }
    
    // Handle multiple products
    const productIds = Array.isArray(req.body.productId) ? req.body.productId : [req.body.productId];
    const quantities = Array.isArray(req.body.quantity) ? req.body.quantity : [req.body.quantity];
    
    let orderProducts = [];
    let subtotal = 0;
    let productDetails = [];
    
    for (let i = 0; i < productIds.length; i++) {
      const product = await Product.findById(productIds[i]);
      const qty = parseInt(quantities[i]);
      const itemTotal = product.price * qty;
      
      orderProducts.push({
        product: productIds[i],
        quantity: qty,
        price: product.price
      });
      
      subtotal += itemTotal;
      productDetails.push(`${product.name} - ₹${product.price} (x${qty}) = ₹${itemTotal}`);
      
      // Update stock
      product.availableQuantity -= qty;
      await product.save();
    }
    
    const discount = parseFloat(req.body.discount) || 0;
    const total = subtotal - discount;
    
    const order = await Order.create({
      user: user._id,
      products: orderProducts,
      total: total,
      discount: discount,
      paymentMethod: req.body.paymentMethod
    });
    
    // Send WhatsApp message
    const phoneWithCountryCode = user.phoneNumber.startsWith('+91') ? user.phoneNumber : '+91' + user.phoneNumber;
    const message = `🛒 *Order Confirmation*\n\nHi ${user.name}!\n\n📦 Products:\n${productDetails.join('\n')}\n\n💰 Subtotal: ₹${subtotal}\n🎯 Discount: ₹${discount}\n💳 Total: ₹${total}\n\nThank you for your order!\n\n*BeLife Home Care*`;
    
    whatsappService.sendBill(phoneWithCountryCode, message);
    
    res.redirect("/admin/orders");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/admin/orders/delete/:id", async (req, res) => {
  try {
    const Order = require("./models/Order");
    await Order.findByIdAndDelete(req.params.id);
    res.redirect("/admin/orders");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/admin/orders/update/:id", async (req, res) => {
  try {
    const Order = require("./models/Order");
    const Product = require("./models/Product");
    const User = require("./models/User");
    
    let user = await User.findOne({ phoneNumber: req.body.customerPhone });
    if (!user) {
      user = await User.create({
        name: req.body.customerName,
        phoneNumber: req.body.customerPhone,
        address: req.body.customerAddress
      });
    } else {
      user.name = req.body.customerName;
      user.address = req.body.customerAddress;
      await user.save();
    }
    
    const product = await Product.findById(req.body.productId);
    const subtotal = product.price * req.body.quantity;
    const discount = parseFloat(req.body.discount) || 0;
    const total = subtotal - discount;
    
    await Order.findByIdAndUpdate(req.params.id, {
      user: user._id,
      products: [{ product: req.body.productId, quantity: req.body.quantity, price: product.price }],
      total: total,
      discount: discount,
      paymentMethod: req.body.paymentMethod
    });
    
    res.redirect("/admin/orders");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Admin Stock Page
app.get("/admin/stock", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    
    const StockUpdate = require("./models/StockUpdate");
    const totalStockUpdates = await StockUpdate.countDocuments();
    const stockUpdates = await StockUpdate.find().populate("product").sort({ date: -1 }).skip(skip).limit(limit);
    const products = await require("./models/Product").find();
    const totalPages = Math.ceil(totalStockUpdates / limit);
    
    res.render("admin/stock", { stockUpdates, products, currentPage: page, totalPages });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/admin/stock", async (req, res) => {
  try {
    const StockUpdate = require("./models/StockUpdate");
    const Product = require("./models/Product");
    const product = await Product.findById(req.body.productId);
    await StockUpdate.create({
      product: req.body.productId,
      quantityAdded: req.body.quantityAdded,
      notes: req.body.notes
    });
    product.availableQuantity += parseInt(req.body.quantityAdded);
    await product.save();
    res.redirect("/admin/stock");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Error handling middleware
app.use(errorHandler);

// Start Server
if (require.main === module) {
  app.listen(5001, () => {
    console.log("Server Connected on port: 5001");
  });
} else {
  module.exports = app;
}
