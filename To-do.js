require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const {
  appendToSheet,
  updateSheet,
  deleteFromSheet,
} = require("./googleSheets");
const path = require("path");
const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// MongoDB Connection
const dbURI =
  "mongodb+srv://jenishrabadiya277:DlawQns07yu3RPQ1@jr-project.gtdgy.mongodb.net/?retryWrites=true&w=majority";
mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Task Schema
const taskSchema = new mongoose.Schema(
  {
    no: { type: String, required: true },
    date: { type: String, required: true },
    name: { type: String, required: true },
    number: { type: String, required: true },
    address: { type: String, required: true },
    dishWash1000mlQnt: { type: Number, default: 0 },
    dishWash5000mlQnt: { type: Number, default: 0 },
    dishWashYellow5000mlQnt: { type: Number, default: 0 },
    laundryWash1000mlQnt: { type: Number, default: 0 },
    laundryWash5000mlQnt: { type: Number, default: 0 },
    laundryWashSkyBule5000mlQnt: { type: Number, default: 0 },
    floorCleanerRoseQnt: { type: Number, default: 0 },
    floorCleanerJasmineQnt: { type: Number, default: 0 },
    floorCleanerJasmineFree: { type: Boolean, default: false },
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
  },
  {
    timestamps: true,
  }
);

const Task = mongoose.model("Task", taskSchema);

// Routes
// Default route: Show task list
app.get("/", async (req, res) => {
  try {
    const searchQuery = req.query.search || "";
    let tasks;
    if (searchQuery) {
      tasks = await Task.aggregate([
        {
          $match: {
            $or: [
              { name: { $regex: searchQuery, $options: "i" } },
              { number: { $regex: searchQuery, $options: "i" } },
              { address: { $regex: searchQuery, $options: "i" } },
            ],
          },
        },
        {
          $addFields: {
            noNumeric: { $toInt: "$no" },
          },
        },
        {
          $sort: { createdAt: -1, noNumeric: -1 },
        },
      ]);
    } else {
      tasks = await Task.aggregate([
        {
          $addFields: {
            noNumeric: { $toInt: "$no" },
          },
        },
        {
          $sort: { createdAt: -1, noNumeric: -1 },
        },
      ]);
    }
    res.render("Tasks.ejs", { tasks, searchQuery });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).send("Error fetching tasks");
  }
});

// Add task form route
app.get("/add", async (req, res) => {
  res.render("Home.ejs");
});

// List all tasks (same as root route, kept for compatibility)
app.get("/tasks", async (req, res) => {
  try {
    const searchQuery = req.query.search || "";
    let tasks;
    if (searchQuery) {
      tasks = await Task.aggregate([
        {
          $match: {
            $or: [
              { name: { $regex: searchQuery, $options: "i" } },
              { number: { $regex: searchQuery, $options: "i" } },
              { address: { $regex: searchQuery, $options: "i" } },
            ],
          },
        },
        {
          $addFields: {
            noNumeric: { $toInt: "$no" },
          },
        },
        {
          $sort: { createdAt: -1, noNumeric: -1 },
        },
      ]);
    } else {
      tasks = await Task.aggregate([
        {
          $addFields: {
            noNumeric: { $toInt: "$no" },
          },
        },
        {
          $sort: { createdAt: -1, noNumeric: -1 },
        },
      ]);
    }

    res.render("Tasks.ejs", { tasks, searchQuery });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).send("Error fetching tasks");
  }
});

// Edit task route (GET)
app.get("/edit/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).send("Task not found");
    }
    res.render("EditTask.ejs", { task });
  } catch (error) {
    console.error("Error fetching task for edit:", error);
    res.status(500).send("Error fetching task");
  }
});

// Update task route (POST)
app.post("/update/:id", async (req, res) => {
  try {
    const taskId = req.params.id;
    const currentDate = new Date().toISOString().split("T")[0];

    // Parse quantities
    const dishWash1000mlQnt = parseInt(req.body.dishWash1000mlQnt) || 0;
    const dishWash5000mlQnt = parseInt(req.body.dishWash5000mlQnt) || 0;
    const dishWashYellow5000mlQnt =
      parseInt(req.body.dishWashYellow5000mlQnt) || 0;
    const laundryWash1000mlQnt = parseInt(req.body.laundryWash1000mlQnt) || 0;
    const laundryWash5000mlQnt = parseInt(req.body.laundryWash5000mlQnt) || 0;
    const laundryWashSkyBule5000mlQnt =
      parseInt(req.body.laundryWashSkyBule5000mlQnt) || 0;
    const floorCleanerRoseQnt = parseInt(req.body.floorCleanerRoseQnt) || 0;
    const floorCleanerJasmineQnt =
      parseInt(req.body.floorCleanerJasmineQnt) || 0;
    const toiletCleanerQnt = parseInt(req.body.toiletCleanerQnt) || 0;
    const handWashBlackBerryQnt = parseInt(req.body.handWashBlackBerryQnt) || 0;
    const handWashSandalwoodQnt = parseInt(req.body.handWashSandalwoodQnt) || 0;
    const bathroomShinerQnt = parseInt(req.body.bathroomShinerQnt) || 0;
    const copperQnt = parseInt(req.body.copperQnt) || 0;
    const finalQnt = parseInt(req.body.finalQnt) || 0;

    // Parse free item checkboxes
    const bathroomShinerFree = req.body.bathroomShinerFree === "on";
    const copperFree = req.body.copperFree === "on";
    const finalFree = req.body.finalFree === "on";
    const floorCleanerJasmineFree = req.body.floorCleanerJasmineFree === "on";

    // Calculate Total
    const total =
      dishWash1000mlQnt * 60 +
      dishWash5000mlQnt * 270 +
      dishWashYellow5000mlQnt * 180 +
      laundryWash1000mlQnt * 120 +
      laundryWash5000mlQnt * 580 +
      laundryWashSkyBule5000mlQnt * 400 +
      floorCleanerRoseQnt * 99 +
      (floorCleanerJasmineFree ? 0 : floorCleanerJasmineQnt * 99) +
      toiletCleanerQnt * 60 +
      handWashBlackBerryQnt * 120 +
      handWashSandalwoodQnt * 120 +
      (bathroomShinerFree ? 0 : bathroomShinerQnt * 80) +
      (copperFree ? 0 : copperQnt * 60) +
      (finalFree ? 0 : finalQnt * 80);

    const updatedTask = {
      date: currentDate,
      name: req.body.name,
      number: req.body.number,
      address: req.body.address,
      dishWash1000mlQnt,
      dishWash5000mlQnt,
      dishWashYellow5000mlQnt,
      laundryWash1000mlQnt,
      laundryWash5000mlQnt,
      laundryWashSkyBule5000mlQnt,
      floorCleanerRoseQnt,
      floorCleanerJasmineQnt,
      floorCleanerJasmineFree,
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

    // Update task in MongoDB
    await Task.findByIdAndUpdate(taskId, updatedTask);

    // Update Google Sheets
    await updateSheet(taskId, updatedTask);

    res.redirect("/");
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).send("Error updating task");
  }
});

// Delete task route
app.post("/delete/:id", async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).send("Task not found");
    }
    await Task.findByIdAndDelete(taskId);
    await deleteFromSheet(task.no);
    res.redirect("/");
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).send("Error deleting task");
  }
});

// Add task route
app.post("/addTask", async (req, res) => {
  try {
    const taskCount = await Task.countDocuments();
    const taskNumber = taskCount + 1;
    const currentDate = new Date().toISOString().split("T")[0];

    // Parse quantities
    const dishWash1000mlQnt = parseInt(req.body.dishWash1000mlQnt) || 0;
    const dishWash5000mlQnt = parseInt(req.body.dishWash5000mlQnt) || 0;
    const dishWashYellow5000mlQnt =
      parseInt(req.body.dishWashYellow5000mlQnt) || 0;
    const laundryWash1000mlQnt = parseInt(req.body.laundryWash1000mlQnt) || 0;
    const laundryWash5000mlQnt = parseInt(req.body.laundryWash5000mlQnt) || 0;
    const laundryWashSkyBule5000mlQnt =
      parseInt(req.body.laundryWashSkyBule5000mlQnt) || 0;
    const floorCleanerRoseQnt = parseInt(req.body.floorCleanerRoseQnt) || 0;
    const floorCleanerJasmineQnt =
      parseInt(req.body.floorCleanerJasmineQnt) || 0;
    const toiletCleanerQnt = parseInt(req.body.toiletCleanerQnt) || 0;
    const handWashBlackBerryQnt = parseInt(req.body.handWashBlackBerryQnt) || 0;
    const handWashSandalwoodQnt = parseInt(req.body.handWashSandalwoodQnt) || 0;
    const bathroomShinerQnt = parseInt(req.body.bathroomShinerQnt) || 0;
    const copperQnt = parseInt(req.body.copperQnt) || 0;
    const finalQnt = parseInt(req.body.finalQnt) || 0;

    // Parse free item checkboxes
    const bathroomShinerFree = req.body.bathroomShinerFree === "on";
    const copperFree = req.body.copperFree === "on";
    const finalFree = req.body.finalFree === "on";
    const floorCleanerJasmineFree = req.body.floorCleanerJasmineFree === "on";

    // Calculate Total
    const total =
      dishWash1000mlQnt * 60 +
      dishWash5000mlQnt * 270 +
      dishWashYellow5000mlQnt * 180 +
      laundryWash1000mlQnt * 120 +
      laundryWash5000mlQnt * 580 +
      laundryWashSkyBule5000mlQnt * 400 +
      floorCleanerRoseQnt * 99 +
      (floorCleanerJasmineFree ? 0 : floorCleanerJasmineQnt * 99) +
      toiletCleanerQnt * 60 +
      handWashBlackBerryQnt * 120 +
      handWashSandalwoodQnt * 120 +
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
      dishWashYellow5000mlQnt,
      laundryWash1000mlQnt,
      laundryWash5000mlQnt,
      laundryWashSkyBule5000mlQnt,
      floorCleanerRoseQnt,
      floorCleanerJasmineQnt,
      floorCleanerJasmineFree,
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
    await appendToSheet(payload);
    res.render("thankyou.ejs", { task });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).send("Error creating task");
  }
});

// Start Server
app.listen(5000, () => {
  console.log("Server Connected on port: 5000");
});
