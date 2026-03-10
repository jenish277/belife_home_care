# BeLife Home Care - Admin Panel

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Add Dummy Data

**Add Products:**
```bash
npm run add-products
```

This will add 9 products:
- Dish Wash 1000ML - ₹150
- Dish Wash 5000ML - ₹650
- Laundry Wash 1000ML - ₹180
- Laundry Wash 5000ML - ₹750
- Floor Cleaner Rose - ₹120
- Floor Cleaner Jasmine - ₹120
- Toilet Cleaner - ₹100
- Hand Wash Black Berry - ₹90
- Hand Wash Sandalwood - ₹90

**Add Users:**
```bash
npm run add-users
```

This will add 5 dummy users with names, phone numbers, and addresses.

### 3. Start Server
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

### 4. Access Admin Panel
Open browser and go to: `http://localhost:5001`

---

## 📱 Admin Pages

- **Dashboard** - `/` - Overview with statistics
- **Products** - `/admin/products` - Manage products
- **Users** - `/admin/users` - Manage customers
- **Orders** - `/admin/orders` - Create and view orders (with discount)
- **Stock** - `/admin/stock` - Manage inventory

---

## ✨ New Features

### Order Creation with Discount
When creating an order:
1. Select customer
2. Select product
3. Enter quantity
4. Enter discount amount (optional)
5. See real-time calculation:
   - Subtotal
   - Discount
   - Final Total

---

## 🎯 Product Categories

Based on your requirements:
- **Dish Wash**: 1000ML, 5000ML
- **Laundry Wash**: 1000ML, 5000ML
- **Floor Cleaner**: Rose, Jasmine
- **Toilet Cleaner**: Standard
- **Hand Wash**: Black Berry, Sandalwood

---

## 🛠️ Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- EJS Templates
- Bootstrap 5
- Font Awesome Icons

---

## 📝 Notes

- All pages have clean, professional design
- Purple gradient theme (#667eea to #764ba2)
- Fully responsive
- Simple and easy to use
- Discount calculation in real-time

---

## 🔧 Commands

```bash
npm start          # Start server
npm run dev        # Start with nodemon
npm run add-products   # Add dummy products
npm run add-users      # Add dummy users
```
