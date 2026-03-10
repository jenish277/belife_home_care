// Utility functions for bill generation and calculations

const generateBillText = (invoiceNumber, user, products, total, orderDate) => {
  let text = `Invoice Number: ${invoiceNumber}\n`;
  text += `Customer: ${user.name}\n`;
  text += `Phone: ${user.phoneNumber}\n`;
  text += `Address: ${user.address}\n\n`;
  text += `Products:\n`;
  products.forEach(item => {
    text += `${item.product.name} x${item.quantity} = ₹${item.price * item.quantity}\n`;
  });
  text += `\nTotal: ₹${total}\n`;
  text += `Order Date: ${orderDate.toDateString()}\n\nThank you for shopping!`;
  return text;
};

const calculateTotalSold = (productId, orders) => {
  return orders.reduce((total, order) => {
    const item = order.products.find(p => p.product.toString() === productId);
    return total + (item ? item.quantity : 0);
  }, 0);
};

module.exports = {
  generateBillText,
  calculateTotalSold,
};
