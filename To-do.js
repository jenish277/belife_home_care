require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const appendToSheet = require('./googleSheets');
const path = require("path");
const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// MongoDB Connection
const dbURI = process.env.MONGODB_URI;
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Task Schema
const taskSchema = new mongoose.Schema({
  no: { type: String, required: true },
  date: { type: String, required: true },
  name: { type: String, required: true },
  number: { type: String, required: true },
  address: { type: String, required: true },
  dishWash1000mlQnt: { type: Number, default: 0 },
  dishWash5000mlQnt: { type: Number, default: 0 },
  laundryWash1000mlQnt: { type: Number, default: 0 },
  laundryWash5000mlQnt: { type: Number, default: 0 },
  floorCleanerRoseQnt: { type: Number, default: 0 },
  floorCleanerJasmineQnt: { type: Number, default: 0 },
  toiletCleanerQnt: { type: Number, default: 0 },
  handWashBlackBerryQnt: { type: Number, default: 0 },
  handWashSandalwoodQnt: { type: Number, default: 0 },
  bathroomShinerQnt: { type: Number, default: 0 },
  copperQnt: { type: Number, default: 0 },
  finalQnt: { type: Number, default: 0 },
  bathroomShinerFree: { type: Boolean, default: false },
  copperFree: { type: Boolean, default: false },
  finalFree: { type: Boolean, default: false },
  Total: { type: Number, default: 0 },
});

const Task = mongoose.model("Task", taskSchema);

// Routes
app.get("/", async (req, res) => {
  res.render("Home.ejs");
});

app.post("/addTask", async (req, res) => {
  try {
    const taskNumber = Math.floor(1000 + Math.random() * 9000).toString(); // Random 4-digit number
    const currentDate = new Date().toISOString().split("T")[0];

    // Parse quantities
    const dishWash1000mlQnt = parseInt(req.body.dishWash1000mlQnt) || 0;
    const dishWash5000mlQnt = parseInt(req.body.dishWash5000mlQnt) || 0;
    const laundryWash1000mlQnt = parseInt(req.body.laundryWash1000mlQnt) || 0;
    const laundryWash5000mlQnt = parseInt(req.body.laundryWash5000mlQnt) || 0;
    const floorCleanerRoseQnt = parseInt(req.body.floorCleanerRoseQnt) || 0;
    const floorCleanerJasmineQnt = parseInt(req.body.floorCleanerJasmineQnt) || 0;
    const toiletCleanerQnt = parseInt(req.body.toiletCleanerQnt) || 0;
    const handWashBlackBerryQnt = parseInt(req.body.handWashBlackBerryQnt) || 0;
    const handWashSandalwoodQnt = parseInt(req.body.handWashSandalwoodQnt) || 0;
    const bathroomShinerQnt = parseInt(req.body.bathroomShinerQnt) || 0;
    const copperQnt = parseInt(req.body.copperQnt) || 0;
    const finalQnt = parseInt(req.body.finalQnt) || 0;

    // Parse free item checkboxes
    const bathroomShinerFree = req.body.bathroomShinerFree === 'on';
    const copperFree = req.body.copperFree === 'on';
    const finalFree = req.body.finalFree === 'on';

    // Calculate Total (excluding free items)
    const total = 
      (dishWash1000mlQnt * 60) + 
      (dishWash5000mlQnt * 270) +
      (laundryWash1000mlQnt * 120) +
      (laundryWash5000mlQnt * 580) +
      (floorCleanerRoseQnt * 99) +
      (floorCleanerJasmineQnt * 99) +
      (toiletCleanerQnt * 60) +
      (handWashBlackBerryQnt * 120) +
      (handWashSandalwoodQnt * 120) +
      (bathroomShinerQnt * 80) +
      (copperQnt * 60) +
      (finalQnt * 80);

    const payload = {
      no: taskNumber,
      date: currentDate,
      name: req.body.name,
      number: req.body.number,
      address: req.body.address,
      dishWash1000mlQnt,
      dishWash5000mlQnt,
      laundryWash1000mlQnt,
      laundryWash5000mlQnt,
      floorCleanerRoseQnt,
      floorCleanerJasmineQnt,
      toiletCleanerQnt,
      handWashBlackBerryQnt,
      handWashSandalwoodQnt,
      bathroomShinerQnt,
      copperQnt,
      finalQnt,
      bathroomShinerFree,
      copperFree,
      finalFree,
      Total: total,
    };

    // Try appending to Google Sheets first
    await appendToSheet(payload);
    console.log('Data appended to Google Sheets, skipping MongoDB.');

    // Render thank you page with payload (no MongoDB task ID)
    res.render("thankyou.ejs", { task: payload });
  } catch (error) {
    console.error('Error appending to Google Sheets, falling back to MongoDB:', error);
    try {
      // Fallback to MongoDB if Google Sheets fails
      const taskCount = await Task.countDocuments();
      payload.no = (taskCount + 1).toString(); // Override random number with sequential
      const task = await Task.create(payload);
      console.log('Data saved to MongoDB as fallback.');
      res.render("thankyou.ejs", { task });
    } catch (mongoError) {
      console.error("Error creating task in MongoDB:", mongoError);
      res.status(500).send("Error processing task");
    }
  }
});

// Start Server
app.listen(5000, () => {
  console.log('Server Connected on port: 5000');
});
