const mongoose = require("mongoose");
require('dotenv').config();

const dbURI = "mongodb+srv://jenishrabadiya277:DlawQns07yu3RPQ1@jr-project.gtdgy.mongodb.net/?retryWrites=true&w=majority";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  availableQuantity: { type: Number, default: 0 },
}, {
  timestamps: true
});

const Product = mongoose.model("Product", productSchema);

const dummyProducts = [
  { name: "Dish Wash 1000ML", price: 150, availableQuantity: 50 },
  { name: "Dish Wash 5000ML", price: 650, availableQuantity: 30 },
  { name: "Laundry Wash 1000ML", price: 180, availableQuantity: 40 },
  { name: "Laundry Wash 5000ML", price: 750, availableQuantity: 25 },
  { name: "Floor Cleaner Rose", price: 120, availableQuantity: 60 },
  { name: "Floor Cleaner Jasmine", price: 120, availableQuantity: 55 },
  { name: "Toilet Cleaner", price: 100, availableQuantity: 70 },
  { name: "Hand Wash Black Berry", price: 90, availableQuantity: 80 },
  { name: "Hand Wash Sandalwood", price: 90, availableQuantity: 75 },
];

async function addDummyData() {
  try {
    await mongoose.connect(dbURI);
    console.log("Connected to MongoDB");

    // Clear existing products
    await Product.deleteMany({});
    console.log("Cleared existing products");

    // Add dummy products
    await Product.insertMany(dummyProducts);
    console.log("Added dummy products successfully!");

    const products = await Product.find();
    console.log("\nProducts in database:");
    products.forEach(p => console.log(`- ${p.name}: ₹${p.price} (Stock: ${p.availableQuantity})`));

    mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error);
    mongoose.connection.close();
  }
}

addDummyData();
