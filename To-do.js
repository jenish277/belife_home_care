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
const dbURI = 'mongodb+srv://jenishrabadiya277:DlawQns07yu3RPQ1@jr-project.gtdgy.mongodb.net/?retryWrites=true&w=majority';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Task Schema with Separate Fields
const taskSchema = new mongoose.Schema({
  no: { type: String, required: true },
  date: { type: String, required: true },
  name: { type: String, required: true },
  number: { type: String, required: true },
  address: { type: String, required: true },
  
  // Dish Wash
  dishWash1000mlQnt: { type: Number, default: 0 },
  dishWash5000mlQnt: { type: Number, default: 0 },
  
  // Laundry Wash
  laundryWash1000mlQnt: { type: Number, default: 0 },
  laundryWash5000mlQnt: { type: Number, default: 0 },
  
  // Floor Cleaner
  floorCleanerRoseQnt: { type: Number, default: 0 },
  floorCleanerJasmineFree: { type: Boolean, default: false },
  
  // Toilet Cleaner
  toiletCleanerQnt: { type: Number, default: 0 },
  
  // Hand Wash
  handWashBlackBerryQnt: { type: Number, default: 0 },
  handWashSandalwoodQnt: { type: Number, default: 0 },
  
  // New Fields
  bathroomShinerQnt: { type: Number, default: 0 },
  copperQnt: { type: Number, default: 0 },
  finalQnt: { type: Number, default: 0 },
  
  // Free Item Checkboxes
  bathroomShinerFree: { type: Boolean, default: false },
  copperFree: { type: Boolean, default: false },
  finalFree: { type: Boolean, default: false },
  
  // Total
  Total: { type: Number, default: 0 },
});

const Task = mongoose.model("Task", taskSchema);

// Routes
app.get("/", async (req, res) => {
  res.render("Home.ejs");
});

app.post("/addTask", async (req, res) => {
  try {
    const taskCount = await Task.countDocuments();
    const taskNumber = taskCount + 1;
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

    // Parse free item checkboxes (true if checked, false if not)
    const bathroomShinerFree = req.body.bathroomShinerFree === 'on';
    const copperFree = req.body.copperFree === 'on';
    const finalFree = req.body.finalFree === 'on';
    const floorCleanerJasmineFree = req.body.floorCleanerJasmineFree === 'on';

    // Calculate Total (exclude free items)
    const total = 
      (dishWash1000mlQnt * 60) + 
      (dishWash5000mlQnt * 270) +
      (laundryWash1000mlQnt * 120) +
      (laundryWash5000mlQnt * 580) +
      (floorCleanerRoseQnt * 99) +
      (floorCleanerJasmineFree ? 0 : floorCleanerJasmineQnt * 99) +
      (toiletCleanerQnt * 60) +
      (handWashBlackBerryQnt * 120) +
      (handWashSandalwoodQnt * 120) +
      (bathroomShinerFree ? 0 : bathroomShinerQnt * 80) +
      (copperFree ? 0 : copperQnt * 60) +
      (finalFree ? 0 : finalQnt * 80);

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

    const task = await Task.create(payload);

    // Call function to append data to Google Sheets
    await appendToSheet(payload);

    // Redirect to the Thank You page
    res.render("thankyou.ejs", { task });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).send("Error creating task");
  }
});

// Start Server
app.listen(5000, () => {
  console.log('Server Connected on port: 5000');
});
