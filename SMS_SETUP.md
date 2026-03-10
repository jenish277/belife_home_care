# SMS Setup Guide

## Twilio SMS Configuration

### 1. Get Twilio Credentials
1. Sign up at https://www.twilio.com/
2. Go to Console Dashboard
3. Copy your Account SID and Auth Token

### 2. Update .env File
```env
TWILIO_ACCOUNT_SID=your_actual_account_sid
TWILIO_AUTH_TOKEN=your_actual_auth_token
TWILIO_FROM_NUMBER=9327664627
```

### 3. SMS Format
When an order is created, the customer receives:
```
BeLife Home Care - Order Confirmed!

Order ID: ABC123
Customer: John Doe

Items:
Dish Wash 1000ML x2
Floor Cleaner Rose x1

Subtotal: ₹420
Discount: ₹20
Total: ₹400

Thank you for your order!
```

### 4. Testing
- Create an order from `/admin/orders`
- SMS will be sent to the customer's phone number
- Check Twilio console for delivery status

### Note
- SMS is sent from: 9327664627
- SMS is sent to: User's phone number from database
- Make sure phone numbers are in E.164 format (+91XXXXXXXXXX)
