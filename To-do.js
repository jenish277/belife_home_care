const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const appendToSheet = require('./googleSheets'); // Import the Google Sheets function
const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// MongoDB Connection
const dbURI = 'mongodb+srv://jenishrabadiya277:DlawQns07yu3RPQ1@jr-project.gtdgy.mongodb.net/?retryWrites=true&w=majority';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Task Schema and Model
const taskSchema = new mongoose.Schema({
  no: { type: String, required: true },
  date: { type: String, required: true },
  name: { type: String, required: true },
  number: { type: String, required: true },
  address: { type: String, required: true },
  dishWash: { type: String, enum: ["1000ML", "5000ML"] },
  dishQnt: { type: Number, default: 0 },
  laundryWash: { type: String, enum: ["1000ML", "5000ML"] },
  laundryQnt: { type: Number, default: 0 },
  floorClener: { type: String, enum: ["Rose", "Jasmine"] },
  floorClenerQnt: { type: Number, default: 0 },
  toiletClenerQnt: { type: Number, default: 0 },
  handWash: { type: String, enum: ["Black Berry", "Sandalwood"] },
  handWashQnt: { type: Number, default: 0 },
  Total: { type: Number, default: 0 },
});

const Task = mongoose.model('Task', taskSchema);

// Routes
app.get('/', async (req, res) => {
  res.render('Home.ejs');
});

app.post('/addTask', async (req, res) => {
  try {
    const taskCount = await Task.countDocuments();
    const taskNumber = taskCount + 1;
    const currentDate = new Date().toISOString().split('T')[0];

    // Calculate Total
    let total = 0;

    if (req?.body?.dishWash) {
      if (req.body.dishWash === "1000ML") {
        total += 60 * (parseInt(req.body.dishQnt) || 0);
      } else if (req.body.dishWash === "5000ML") {
        total += 270 * (parseInt(req.body.dishQnt) || 0);
      }
    }

    if (req?.body?.laundryWash) {
      if (req.body.laundryWash === "1000ML") {
        total += 120 * (parseInt(req.body.laundryQnt) || 0);
      } else if (req.body.laundryWash === "5000ML") {
        total += 580 * (parseInt(req.body.laundryQnt) || 0);
      }
    }

    total += 99 * (parseInt(req.body.floorClenerQnt) || 0);
    total += 99 * (parseInt(req.body.toiletClenerQnt) || 0);
    total += 120 * (parseInt(req.body.handWashQnt) || 0);

    const payload = {
      no: taskNumber,
      date: currentDate,
      name: req.body.name,
      number: req.body.number,
      address: req.body.address,
      dishWash: req.body.dishWash || null,
      dishQnt: req.body.dishQnt || 0,
      laundryWash: req.body.laundryWash || null,
      laundryQnt: req.body.laundryQnt || 0,
      floorClener: req.body.floorCleaner || null,
      floorClenerQnt: req.body.floorClenerQnt || 0,
      toiletClenerQnt: req.body.toiletClenerQnt || 0,
      handWash: req.body.handWash || null,
      handWashQnt: req.body.handWashQnt || 0,
      Total: total,
    };

    const task = await Task.create(payload);
    
    // Call function to append data to Google Sheets
    await appendToSheet(payload);  // Appends the task to Google Sheets

    // Redirect to the Thank You page
    res.render('thankyou.ejs', { task });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).send('Error creating task');
  }
});

// Start Server
app.listen(5000, () => {
  console.log('Server Connected on port: 5000');
});
