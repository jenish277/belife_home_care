# WhatsApp Setup Guide

## Setup Steps

### 1. Install Package
```bash
npm install whatsapp-web.js
```

### 2. Start Server
```bash
npm start
```

### 3. Scan QR Code
- When server starts, a QR code will appear in console
- Open WhatsApp on your phone (9327664627)
- Go to Settings > Linked Devices > Link a Device
- Scan the QR code from console

### 4. Create Order
- Go to `/admin/orders`
- Create an order
- WhatsApp message will be sent automatically to customer

## Message Format
```
*BeLife Home Care - Order Confirmed!*

Order ID: ABC123
Customer: John Doe

*Items:*
Dish Wash 1000ML x2
Floor Cleaner Rose x1

Subtotal: ₹420
Discount: ₹20
*Total: ₹400*

Thank you for your order!
```

## Notes
- Messages sent from: 9327664627 (your WhatsApp)
- Messages sent to: Customer's phone number
- QR code needs to be scanned only once
- Session is saved automatically
