const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const app = express();

// Initialize WhatsApp service
// const whatsappService = require('./services/whatsappService');

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.use(express.static("public"));

// Import routes
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");
const stockRoutes = require("./routes/stockRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const {
  startNightlyReportJob,
  sendDailyReport,
  sendWeeklyReport,
  sendMonthlyReport,
} = require("./services/nightlyReportService");

// Import middleware
const authMiddleware = require("./middleware/authMiddleware");
const errorHandler = require("./middleware/errorHandler");

// MongoDB Connection
const dbURI = process.env.MONGO_URL;
mongoose
  .connect(dbURI)
  .then(() => {
    console.log("Connected to MongoDB");
    startNightlyReportJob();
  })
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

    const products = await require("./models/Product").find();
    const users = await require("./models/User").find();
    const allOrders = await require("./models/Order")
      .find(dateQuery)
      .populate("user")
      .populate("products.product")
      .sort({ orderDate: -1 });

    // Calculate product sales and payment totals
    const productSalesMap = {};
    let totalSales = 0;
    let cashTotal = 0;
    let gpayTotal = 0;
    let totalDiscount = 0;
    let totalPending = 0;

    allOrders.forEach((order) => {
      totalSales += order.total;
      totalDiscount += order.discount || 0;

      // Calculate payment method totals
      if (order.paymentMethod === "Cash") {
        cashTotal += order.total;
      } else if (order.paymentMethod === "GPay") {
        gpayTotal += order.total;
      } else if (order.paymentMethod === "Pending") {
        // If payment method is Pending, entire order total is pending
        totalPending += order.total;
      }

      // Also add any additional pending amount from pending field
      totalPending += order.pending || 0;

      order.products.forEach((item) => {
        const productId = item.product._id.toString();
        if (!productSalesMap[productId]) {
          productSalesMap[productId] = {
            name: item.product.name,
            quantity: 0,
            totalSales: 0,
          };
        }
        productSalesMap[productId].quantity += item.quantity;
        productSalesMap[productId].totalSales += item.quantity * item.price;
      });
    });

    const productSales = Object.values(productSalesMap).sort(
      (a, b) => b.totalSales - a.totalSales,
    );
    const totalProductSales = productSales.length;
    const totalProductPages = Math.ceil(totalProductSales / limit);
    const paginatedProductSales = productSales.slice(skip, skip + limit);

    res.render("admin/dashboard", {
      products,
      users,
      orders: allOrders,
      totalSales,
      totalCash: cashTotal,
      totalGPay: gpayTotal,
      totalPending,
      totalDiscount,
      currentPage: page,
      totalPages: totalProductPages,
      filter: filter || "all",
      startDate: startDate || "",
      endDate: endDate || "",
      productSales: paginatedProductSales,
    });
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
    const StockUpdate = require("./models/StockUpdate");
    const totalProducts = await Product.countDocuments();
    const products = await Product.find().skip(skip).limit(limit);
    const totalPages = Math.ceil(totalProducts / limit);
    
    // Get recent stock updates for display
    const stockUpdates = await StockUpdate.find()
      .populate("product")
      .sort({ date: -1 })
      .limit(5);

    res.render("admin/products", { 
      products, 
      stockUpdates, 
      currentPage: page, 
      totalPages 
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/admin/products", async (req, res) => {
  try {
    const Product = require("./models/Product");
    await Product.create({
      name: req.body.name,
      price: req.body.price,
      availableQuantity: 0,
    });
    res.redirect("/admin/products");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/admin/products/update/:id", async (req, res) => {
  try {
    const Product = require("./models/Product");
    await Product.findByIdAndUpdate(req.params.id, {
      name: req.body.name,
      price: req.body.price,
    });
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

    const usersWithOrders = await Promise.all(
      users.map(async (user) => {
        const orders = await Order.find({ user: user._id }).populate(
          "products.product",
        );
        const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

        // Calculate total pending for this user
        const totalPending = orders.reduce((sum, order) => {
          let pending = 0;
          if (order.paymentMethod === "Pending") {
            pending += order.total;
          }
          pending += order.pending || 0;
          return sum + pending;
        }, 0);

        return {
          ...user.toObject(),
          orders: orders,
          totalSpent: totalSpent,
          totalPending: totalPending,
        };
      }),
    );

    const totalPages = Math.ceil(totalUsers / limit);
    res.render("admin/users", {
      users: usersWithOrders,
      currentPage: page,
      totalPages,
    });
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
      address: req.body.address,
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
      address: req.body.address,
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
    const orders = await Order.find()
      .populate("user")
      .populate("products.product")
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit);
    const users = await require("./models/User").find();
    const products = await require("./models/Product").find();
    const totalPages = Math.ceil(totalOrders / limit);

    res.render("admin/orders", {
      orders,
      users,
      products,
      currentPage: page,
      totalPages,
    });
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
        address: req.body.customerAddress,
      });
    }

    // Handle multiple products
    const productIds = Array.isArray(req.body.productId)
      ? req.body.productId
      : [req.body.productId];
    const quantities = Array.isArray(req.body.quantity)
      ? req.body.quantity
      : [req.body.quantity];

    // Check stock availability first
    for (let i = 0; i < productIds.length; i++) {
      const product = await Product.findById(productIds[i]);
      const qty = parseInt(quantities[i]);

      if (product.availableQuantity < qty) {
        return res.status(400).send(`
          <script>
            alert('Insufficient stock for ${product.name}! Available: ${product.availableQuantity}, Requested: ${qty}');
            window.history.back();
          </script>
        `);
      }
    }

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
        price: product.price,
      });

      subtotal += itemTotal;
      productDetails.push(
        `${product.name} - ₹${product.price} (x${qty}) = ₹${itemTotal}`,
      );

      // Update stock
      product.availableQuantity -= qty;
      await product.save();
    }

    const discount = parseFloat(req.body.discount) || 0;
    const pending = parseFloat(req.body.pending) || 0;
    const total = subtotal - discount;

    const order = await Order.create({
      user: user._id,
      products: orderProducts,
      total: total,
      discount: discount,
      pending: pending,
      paymentMethod: req.body.paymentMethod,
    });

    // Send WhatsApp message
    const phoneWithCountryCode = user.phoneNumber.startsWith("+91")
      ? user.phoneNumber
      : "+91" + user.phoneNumber;
    const message = `🛒 *Order Confirmation*\n\nHi ${user.name}!\n\n📦 Products:\n${productDetails.join("\n")}\n\n💰 Subtotal: ₹${subtotal}\n🎯 Discount: ₹${discount}\n💳 Total: ₹${total}\n\nThank you for your order!\n\n*BeLife Home Care*`;

    // whatsappService.sendBill(phoneWithCountryCode, message);

    res.redirect("/admin/orders");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/admin/orders/delete/:id", async (req, res) => {
  try {
    const Order = require("./models/Order");
    const Product = require("./models/Product");
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).send("Order not found");
    }

    for (const item of order.products) {
      const product = await Product.findById(item.product);
      if (product) {
        product.availableQuantity += Number(item.quantity);
        await product.save();
      }
    }

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
    const existingOrder = await Order.findById(req.params.id);

    if (!existingOrder) {
      return res.status(404).send("Order not found");
    }

    let user = await User.findOne({ phoneNumber: req.body.customerPhone });
    if (!user) {
      user = await User.create({
        name: req.body.customerName,
        phoneNumber: req.body.customerPhone,
        address: req.body.customerAddress,
      });
    } else {
      user.name = req.body.customerName;
      user.address = req.body.customerAddress;
      await user.save();
    }

    for (const item of existingOrder.products) {
      const oldProduct = await Product.findById(item.product);
      if (oldProduct) {
        oldProduct.availableQuantity += Number(item.quantity);
        await oldProduct.save();
      }
    }

    // Handle multiple products
    const productIds = req.body.productId || [];
    const quantities = req.body.quantity || [];
    
    if (!Array.isArray(productIds)) {
      // Handle single product case (backward compatibility)
      productIds = [req.body.productId];
      quantities = [req.body.quantity];
    }
    
    const products = [];
    let subtotal = 0;

    for (let i = 0; i < productIds.length; i++) {
      const productId = productIds[i];
      const quantity = parseInt(quantities[i], 10);
      
      if (!productId || !quantity) continue;
      
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).send("Product not found");
      }

      if (product.availableQuantity < quantity) {
        // Restore original stock quantities
        for (const item of existingOrder.products) {
          const oldProduct = await Product.findById(item.product);
          if (oldProduct) {
            oldProduct.availableQuantity -= Number(item.quantity);
            await oldProduct.save();
          }
        }

        return res.status(400).send(`
          <script>
            alert('Insufficient stock for ${product.name}! Available: ${product.availableQuantity}, Requested: ${quantity}');
            window.history.back();
          </script>
        `);
      }

      product.availableQuantity -= quantity;
      await product.save();
      
      products.push({ product: productId, quantity, price: product.price });
      subtotal += product.price * quantity;
    }

    const discount = parseFloat(req.body.discount) || 0;
    const pending = parseFloat(req.body.pending) || 0;
    const total = subtotal - discount;

    await Order.findByIdAndUpdate(req.params.id, {
      user: user._id,
      products: products,
      total: total,
      discount: discount,
      pending: pending,
      paymentMethod: req.body.paymentMethod,
    });

    res.redirect("/admin/orders");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Admin Test Reports Route
app.get("/admin/test-reports", async (req, res) => {
  try {
    console.log("Manually triggering all reports for testing...");
    await sendDailyReport();
    await sendWeeklyReport();
    await sendMonthlyReport();
    res.send("All reports sent successfully for testing!");
  } catch (error) {
    console.error("Error sending test reports:", error);
    res.status(500).send("Error sending reports: " + error.message);
  }
});
app.get("/admin/stock", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const StockUpdate = require("./models/StockUpdate");
    const totalStockUpdates = await StockUpdate.countDocuments();
    const stockUpdates = await StockUpdate.find()
      .populate("product")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);
    const products = await require("./models/Product").find();
    const totalPages = Math.ceil(totalStockUpdates / limit);

    res.render("admin/stock", {
      stockUpdates,
      products,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

async function applyStockAdjustment({
  previousUpdate = null,
  nextProductId = null,
  nextQuantityAdded = 0,
}) {
  const Product = require("./models/Product");

  if (previousUpdate) {
    const previousProduct = await Product.findById(previousUpdate.product);
    if (previousProduct) {
      previousProduct.availableQuantity = Math.max(
        0,
        previousProduct.availableQuantity - previousUpdate.quantityAdded,
      );
      await previousProduct.save();
    }
  }

  if (nextProductId) {
    const nextProduct = await Product.findById(nextProductId);
    if (!nextProduct) {
      throw new Error("Product not found");
    }

    nextProduct.availableQuantity += nextQuantityAdded;
    await nextProduct.save();
  }
}

app.post("/admin/stock", async (req, res) => {
  try {
    const StockUpdate = require("./models/StockUpdate");
    const quantityAdded = parseInt(req.body.quantityAdded, 10);

    if (Number.isNaN(quantityAdded) || quantityAdded <= 0) {
      return res.status(400).send("Quantity must be greater than 0");
    }

    await StockUpdate.create({
      product: req.body.productId,
      quantityAdded,
      notes: req.body.notes,
    });
    await applyStockAdjustment({
      nextProductId: req.body.productId,
      nextQuantityAdded: quantityAdded,
    });
    res.redirect("/admin/stock");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

async function updateStockEntry(req, res) {
  try {
    const StockUpdate = require("./models/StockUpdate");
    const quantityAdded = parseInt(req.body.quantityAdded, 10);

    if (Number.isNaN(quantityAdded) || quantityAdded <= 0) {
      return res.status(400).send("Quantity must be greater than 0");
    }

    const stockUpdate = await StockUpdate.findById(req.params.id);
    if (!stockUpdate) {
      return res.status(404).send("Stock update not found");
    }

    await applyStockAdjustment({
      previousUpdate: stockUpdate,
      nextProductId: req.body.productId,
      nextQuantityAdded: quantityAdded,
    });

    stockUpdate.product = req.body.productId;
    stockUpdate.quantityAdded = quantityAdded;
    stockUpdate.notes = req.body.notes;
    await stockUpdate.save();

    res.redirect("/admin/stock");
  } catch (error) {
    res.status(500).send(error.message);
  }
}

async function deleteStockEntry(req, res) {
  try {
    const StockUpdate = require("./models/StockUpdate");
    const stockUpdate = await StockUpdate.findById(req.params.id);

    if (!stockUpdate) {
      return res.status(404).send("Stock update not found");
    }

    await applyStockAdjustment({ previousUpdate: stockUpdate });
    await stockUpdate.deleteOne();

    res.redirect("/admin/stock");
  } catch (error) {
    res.status(500).send(error.message);
  }
}

app.post("/admin/stock/:id/edit", updateStockEntry);
app.post("/admin/stock/update/:id", updateStockEntry);
app.post("/admin/stock/:id/delete", deleteStockEntry);
app.post("/admin/stock/delete/:id", deleteStockEntry);

// Error handling middleware
app.use(errorHandler);

const port = process.env.PORT || 3000;

// Start Server
app.listen(port, () => {
  console.log("Server Connected on port:", port);
});
