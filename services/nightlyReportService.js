const cron = require("node-cron");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");

const REPORT_TIMEZONE = process.env.REPORT_TIMEZONE || "Asia/Kolkata";
const REPORT_RECIPIENT = process.env.REPORT_EMAIL_TO || "jenishrabadiya277@gmail.com";

function getTransporter() {
  const user = "jenishrabadiya277@gmail.com";
  const pass = "xgmn umva aofh jijv";

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

function formatDate(date) {
  return new Date(date).toLocaleString("en-IN", {
    timeZone: REPORT_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildOrdersHtml(orders, label) {
  if (!orders.length) {
    return `<p>No orders in the ${label.toLowerCase()} period.</p>`;
  }

  const rows = orders.map((order) => {
    const items = order.products
      .map((item) => `${item.product?.name || "Unknown Product"} x ${item.quantity}`)
      .join(", ");

    return `
      <tr>
        <td>${order.user?.name || "Unknown User"}</td>
        <td>${order.user?.phoneNumber || "-"}</td>
        <td>${items}</td>
        <td>${order.total}</td>
        <td>${formatDate(order.orderDate || order.createdAt)}</td>
      </tr>
    `;
  }).join("");

  return `
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;">
      <thead>
        <tr>
          <th>User</th>
          <th>Phone</th>
          <th>Products</th>
          <th>Total</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function buildUsersHtml(users, label) {
  if (!users.length) {
    return `<p>No new users in the ${label.toLowerCase()} period.</p>`;
  }

  const rows = users.map((user) => `
    <tr>
      <td>${user.name}</td>
      <td>${user.phoneNumber}</td>
      <td>${user.address}</td>
      <td>${formatDate(user.createdAt)}</td>
    </tr>
  `).join("");

  return `
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;">
      <thead>
        <tr>
          <th>Name</th>
          <th>Phone</th>
          <th>Address</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function buildProductsHtml(products, label) {
  if (!products.length) {
    return `<p>No new products in the ${label.toLowerCase()} period.</p>`;
  }

  const rows = products.map((product) => `
    <tr>
      <td>${product.name}</td>
      <td>${product.price}</td>
      <td>${product.availableQuantity}</td>
      <td>${formatDate(product.createdAt)}</td>
    </tr>
  `).join("");

  return `
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;">
      <thead>
        <tr>
          <th>Name</th>
          <th>Price</th>
          <th>Current Stock</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

async function sendReport({ label, startDate, endDate }) {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn(`${label} report skipped: REPORT_EMAIL_USER or REPORT_EMAIL_PASS is missing.`);
    return;
  }

  const [users, products, orders] = await Promise.all([
    User.find({ createdAt: { $gte: startDate, $lte: endDate } }).sort({ createdAt: -1 }),
    Product.find({ createdAt: { $gte: startDate, $lte: endDate } }).sort({ createdAt: -1 }),
    Order.find({ orderDate: { $gte: startDate, $lte: endDate } })
      .populate("user")
      .populate("products.product")
      .sort({ orderDate: -1 }),
  ]);

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;">
      <h2>BeLife Home Care ${label} Report</h2>
      <p>Report window: ${formatDate(startDate)} to ${formatDate(endDate)}</p>
      <p>
        <strong>Orders:</strong> ${orders.length}<br>
        <strong>Users:</strong> ${users.length}<br>
        <strong>Products:</strong> ${products.length}
      </p>
      <h3>Orders</h3>
      ${buildOrdersHtml(orders, label)}
      <h3>Users</h3>
      ${buildUsersHtml(users, label)}
      <h3>Products</h3>
      ${buildProductsHtml(products, label)}
    </div>
  `;

  await transporter.sendMail({
    from: process.env.REPORT_EMAIL_USER,
    to: REPORT_RECIPIENT,
    subject: `BeLife ${label} Report - ${endDate.toISOString().slice(0, 10)}`,
    html,
  });

  console.log(`${label} report sent to ${REPORT_RECIPIENT} at ${formatDate(new Date())}`);
}

async function sendDailyReport() {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - (24 * 60 * 60 * 1000));
  await sendReport({ label: "Daily", startDate, endDate });
}

async function sendWeeklyReport() {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - (7 * 24 * 60 * 60 * 1000));
  await sendReport({ label: "Weekly", startDate, endDate });
}

async function sendMonthlyReport() {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000));
  await sendReport({ label: "Monthly", startDate, endDate });
}

function isLastDayOfMonth(date) {
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.getMonth() !== date.getMonth();
}

async function startNightlyReportJob() {
  cron.schedule("0 0 * * *", async () => {
    try {
      await sendDailyReport();
    } catch (error) {
      console.error("Daily report failed:", error);
    }
  }, {
    timezone: REPORT_TIMEZONE,
  });

  cron.schedule("0 0 * * 0", async () => {
    try {
      await sendWeeklyReport();
    } catch (error) {
      console.error("Weekly report failed:", error);
    }
  }, {
    timezone: REPORT_TIMEZONE,
  });

  cron.schedule("0 0 * * *", async () => {
    const now = new Date();
    if (!isLastDayOfMonth(now)) {
      return;
    }

    try {
      await sendMonthlyReport();
    } catch (error) {
      console.error("Monthly report failed:", error);
    }
  }, {
    timezone: REPORT_TIMEZONE,
  });
  console.log(`Daily report scheduled for 12:00 AM (${REPORT_TIMEZONE}).`);
  console.log(`Weekly report scheduled for Sunday 12:00 AM (${REPORT_TIMEZONE}).`);
  console.log(`Monthly report scheduled for the last day of the month at 12:00 AM (${REPORT_TIMEZONE}).`);
}

module.exports = {
  sendDailyReport,
  sendWeeklyReport,
  sendMonthlyReport,
  startNightlyReportJob,
};
