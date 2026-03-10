const mongoose = require("mongoose");
require('dotenv').config();

const dbURI = "mongodb+srv://jenishrabadiya277:DlawQns07yu3RPQ1@jr-project.gtdgy.mongodb.net/?retryWrites=true&w=majority";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  address: { type: String, required: true },
}, {
  timestamps: true
});

const User = mongoose.model("User", userSchema);

const dummyUsers = [
  { name: "Rajesh Kumar", phoneNumber: "9876543210", address: "123 MG Road, Mumbai, Maharashtra" },
  { name: "Priya Sharma", phoneNumber: "9876543211", address: "456 Park Street, Delhi" },
  { name: "Amit Patel", phoneNumber: "9876543212", address: "789 Lake View, Ahmedabad, Gujarat" },
  { name: "Sneha Reddy", phoneNumber: "9876543213", address: "321 Beach Road, Chennai, Tamil Nadu" },
  { name: "Vikram Singh", phoneNumber: "9876543214", address: "654 Hill Station, Bangalore, Karnataka" },
];

async function addDummyUsers() {
  try {
    await mongoose.connect(dbURI);
    console.log("Connected to MongoDB");

    // Clear existing users
    await User.deleteMany({});
    console.log("Cleared existing users");

    // Add dummy users
    await User.insertMany(dummyUsers);
    console.log("Added dummy users successfully!");

    const users = await User.find();
    console.log("\nUsers in database:");
    users.forEach(u => console.log(`- ${u.name}: ${u.number}`));

    mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error);
    mongoose.connection.close();
  }
}

addDummyUsers();
