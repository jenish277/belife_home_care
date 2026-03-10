const Invoice = require("../models/Invoice");

class InvoiceService {
  async generateInvoice(order, user) {
    // Populate products if not already
    await order.populate("products.product");

    const invoiceNumber = `INV-${Date.now()}`;
    let details = `Invoice Number: ${invoiceNumber}\n`;
    details += `Customer: ${user.name}\n`;
    details += `Phone: ${user.phoneNumber}\n`;
    details += `Address: ${user.address}\n\n`;
    details += `Products:\n`;
    order.products.forEach(item => {
      details += `${item.product.name} x${item.quantity} = ₹${item.price * item.quantity}\n`;
    });
    details += `\nTotal: ₹${order.total}\n`;
    details += `Order Date: ${order.orderDate.toDateString()}\n\nThank you for shopping!`;

    const invoice = new Invoice({
      order: order._id,
      invoiceNumber,
      details,
    });
    await invoice.save();
    return invoice;
  }
}

module.exports = new InvoiceService();
