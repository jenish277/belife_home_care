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

const CSS = `
  body{font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px;color:#111827;}
  .container{max-width:1020px;margin:auto;background:#fff;border-radius:10px;padding:24px;box-shadow:0 4px 12px rgba(0,0,0,.07);}
  h1{margin-bottom:4px;font-size:22px;}
  p.subtitle{margin:0 0 16px;color:#6b7280;font-size:14px;}
  .summary{display:flex;gap:12px;margin:12px 0;}
  .card{flex:1;padding:14px 16px;border-radius:8px;background:#f3f4f6;text-align:center;}
  .card h2{margin:0;font-size:20px;color:#4f46e5;}
  .card p{margin:4px 0 0;font-size:13px;color:#6b7280;}
  .card.card-total{background:#eff6ff;} .card.card-total h2{color:#2563eb;}
  .card.card-cash{background:#f0fdf4;}  .card.card-cash h2{color:#16a34a;}
  .card.card-gpay{background:#f0fdf4;}  .card.card-gpay h2{color:#0d9488;}
  .card.card-pend{background:#fffbeb;} .card.card-pend h2{color:#d97706;}
  h3{margin:24px 0 8px;font-size:16px;border-bottom:2px solid #e5e7eb;padding-bottom:4px;}
  table{width:100%;border-collapse:collapse;margin-top:6px;}
  th{background:#eef2ff;padding:9px 10px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.04em;}
  td{padding:9px 10px;border-bottom:1px solid #e5e7eb;font-size:13px;}
  tr:hover td{background:#f9fafb;}
  tr.pending td{background:#fffbeb;color:#92400e;border-left:3px solid #f59e0b;}
  tfoot tr td{background:#f3f4f6;font-weight:bold;}
  .badge-pend{display:inline-block;background:#fef3c7;color:#b45309;border:1px solid #f59e0b;border-radius:4px;padding:2px 7px;font-size:11px;font-weight:bold;}
`;

function buildOrdersHtml(orders, label) {
  if (!orders.length) {
    return `<p>No orders in the ${label.toLowerCase()} period.</p>`;
  }

  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const cashTotal = orders.filter(o => o.paymentMethod === 'Cash').reduce((s, o) => s + (o.total || 0), 0);
  const gpayTotal = orders.filter(o => o.paymentMethod === 'GPay').reduce((s, o) => s + (o.total || 0), 0);
  const pendingTotal = orders.filter(o => o.paymentMethod === 'Pending').reduce((s, o) => s + (o.total || 0), 0)
    + orders.reduce((s, o) => s + (o.pending || 0), 0);
  const pendingCount = orders.filter(o => o.paymentMethod === 'Pending' || o.pending > 0).length;

  const rows = orders.map((order) => {
    const items = order.products
      .map(item => `${item.product?.name || 'Unknown'} x${item.quantity}`)
      .join(', ');
    const isPending = order.paymentMethod === 'Pending' || order.pending > 0;
    const paymentCell = isPending
      ? `<span class="badge-pend">&#9203; Pending</span>`
      : order.paymentMethod || 'Cash';

    return `
      <tr${isPending ? ' class="pending"' : ''}>
        <td>${order.user?.name || 'Unknown'}</td>
        <td>${order.user?.phoneNumber || '-'}</td>
        <td>${items}</td>
        <td>${paymentCell}</td>
        <td>&#8377;${(order.total || 0).toFixed(2)}</td>
        <td>${formatDate(order.orderDate || order.createdAt)}</td>
      </tr>`;
  }).join('');

  return `
    <div class="summary">
      <div class="card card-total"><h2>&#8377;${totalRevenue.toFixed(2)}</h2><p>&#128722; Order Total</p></div>
      <div class="card card-cash"><h2>&#8377;${cashTotal.toFixed(2)}</h2><p>&#128181; Cash</p></div>
      <div class="card card-gpay"><h2>&#8377;${gpayTotal.toFixed(2)}</h2><p>&#128242; GPay</p></div>
      <div class="card card-pend"><h2>&#8377;${pendingTotal.toFixed(2)}</h2><p>&#9203; Pending</p></div>
    </div>
    <table>
      <thead>
        <tr><th>User</th><th>Phone</th><th>Products</th><th>Payment</th><th>Total</th><th>Date</th></tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="4">Total (${orders.length} orders &bull; ${pendingCount} pending)</td>
          <td>&#8377;${totalRevenue.toFixed(2)}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>`;
}

function buildUsersHtml(users, label, pendingUserIds = new Set()) {
  if (!users.length) {
    return `<p>No new users in the ${label.toLowerCase()} period.</p>`;
  }

  const rows = users.map((user) => {
    const isPending = pendingUserIds.has(String(user._id));
    const statusCell = isPending
      ? `<span class="badge-pend">&#9203; Pending</span>`
      : '&#10003; Clear';
    return `
      <tr${isPending ? ' class="pending"' : ''}>
        <td>${user.name}</td>
        <td>${user.phoneNumber}</td>
        <td>${user.address}</td>
        <td>${statusCell}</td>
        <td>${formatDate(user.createdAt)}</td>
      </tr>`;
  }).join('');

  const pendingCount = pendingUserIds.size;

  return `
    <table>
      <thead>
        <tr><th>Name</th><th>Phone</th><th>Address</th><th>Status</th><th>Created</th></tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="4">Total Users${pendingCount ? ` (${pendingCount} pending)` : ''}</td>
          <td>${users.length}</td>
        </tr>
      </tfoot>
    </table>`;
}

function buildProductsHtml(products, label) {
  if (!products.length) {
    return `<p>No new products in the ${label.toLowerCase()} period.</p>`;
  }

  const rows = products.map((product) => `
    <tr>
      <td>${product.name}</td>
      <td>&#8377;${product.price}</td>
      <td>${product.availableQuantity}</td>
      <td>${formatDate(product.createdAt)}</td>
    </tr>`).join('');

  const totalStock = products.reduce((s, p) => s + (p.availableQuantity || 0), 0);
  const totalValue = products.reduce((s, p) => s + ((p.price || 0) * (p.availableQuantity || 0)), 0);

  return `
    <table>
      <thead>
        <tr><th>Name</th><th>Price</th><th>Stock</th><th>Created</th></tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td>Total (${products.length} products)</td>
          <td>&#8377;${totalValue.toFixed(2)}</td>
          <td>${totalStock} units</td>
          <td></td>
        </tr>
      </tfoot>
    </table>`;
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

  // Build set of user IDs who have pending orders
  const pendingUserIds = new Set(
    orders
      .filter(o => o.paymentMethod === 'Pending' || o.pending > 0)
      .map(o => String(o.user?._id))
      .filter(Boolean)
  );

  const pendingOrderCount = orders.filter(o => o.paymentMethod === 'Pending' || o.pending > 0).length;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>${CSS}</style></head>
<body>
<div class="container">
  <h1>&#128202; BeLife Home Care &mdash; ${label} Report</h1>
  <p class="subtitle">Report window: ${formatDate(startDate)} &rarr; ${formatDate(endDate)}</p>

  <div class="summary">
    <div class="card"><h2>${orders.length}</h2><p>Orders (${pendingOrderCount} Pending)</p></div>
    <div class="card"><h2>${users.length}</h2><p>Users</p></div>
    <div class="card"><h2>${products.length}</h2><p>Products</p></div>
  </div>

  <h3>Orders</h3>
  ${buildOrdersHtml(orders, label)}

  <h3>Users</h3>
  ${buildUsersHtml(users, label, pendingUserIds)}

  <h3>Products</h3>
  ${buildProductsHtml(products, label)}
</div>
</body>
</html>`;

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
