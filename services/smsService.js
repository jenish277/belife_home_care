// const { Client, LocalAuth } = require('whatsapp-web.js');

// const client = new Client({
//   authStrategy: new LocalAuth()
// });

// let isReady = false;

// client.on('qr', (qr) => {
//   console.log('Scan QR code:', qr);
// });

// client.on('ready', () => {
//   console.log('WhatsApp client ready');
//   isReady = true;
// });

// client.initialize();

// exports.sendOrderSMS = async (toNumber, orderDetails) => {
//   try {
//     if (!isReady) {
//       console.log('WhatsApp not ready');
//       return;
//     }

//     const message = `*BeLife Home Care - Order Confirmed!*\n\nOrder ID: ${orderDetails.orderId}\nCustomer: ${orderDetails.customerName}\n\n*Items:*\n${orderDetails.items}\n\nSubtotal: ₹${orderDetails.subtotal}\nDiscount: ₹${orderDetails.discount}\n*Total: ₹${orderDetails.total}*\n\nThank you for your order!`;

//     const chatId = toNumber.replace(/\D/g, '') + '@c.us';
//     await client.sendMessage(chatId, message);

//     console.log(`WhatsApp sent to ${toNumber}`);
//   } catch (error) {
//     console.error('WhatsApp Error:', error.message);
//   }
// };
