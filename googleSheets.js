const { google } = require('googleapis');
require('dotenv').config();

const auth = new google.auth.GoogleAuth({
  credentials: {
    type: process.env.TYPE,
    project_id: process.env.PROJECT_ID,
    private_key_id: process.env.PRIVATE_KEY_ID,
    private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'), // Replace escaped newlines
    client_email: process.env.CLIENT_EMAIL,
    client_id: process.env.CLIENT_ID,
    auth_uri: process.env.AUTH_URI,
    token_uri: process.env.TOKEN_URI,
    auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
    universe_domain: process.env.UNIVERSE_DOMAIN,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

const SPREADSHEET_ID = process.env.SPREADSHEET_ID; // Add this to your environment variables

async function appendToSheet(taskData) {
  const headers = [
    'No', 'Date', 'Name', 'Number', 'Address',
    'Dish Wash 1000ml', 'Dish Wash 5000ml',
    'Laundry Wash 1000ml', 'Laundry Wash 5000ml',
    'Floor Cleaner Rose', 'Floor Cleaner Jasmine',
    'Toilet Cleaner', 'Hand Wash BlackBerry', 'Hand Wash Sandalwood',
    'Bathroom Shiner Free', 'Copper Free', 'Final Free', // Added free item headers
    'Total',
  ];

  try {
    // Check if headers are already added to the sheet
    const sheetData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A1:R1', // Updated range to include 18 columns
    });

    const rows = sheetData.data.values || [];

    // If no headers exist or they don't match, add them
    if (rows.length === 0 || rows[0].join() !== headers.join()) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A1',
        valueInputOption: 'RAW',
        resource: { values: [headers] },
      });
      console.log('Headers added/updated in the sheet.');
    }

    // Prepare the data to append
    const resource = {
      values: [
        [
          taskData.no,
          taskData.date,
          taskData.name,
          taskData.number,
          taskData.address,
          taskData.dishWash1000mlQnt,
          taskData.dishWash5000mlQnt,
          taskData.laundryWash1000mlQnt,
          taskData.laundryWash5000mlQnt,
          taskData.floorCleanerRoseQnt,
          taskData.floorCleanerJasmineQnt,
          taskData.toiletCleanerQnt,
          taskData.handWashBlackBerryQnt,
          taskData.handWashSandalwoodQnt,
          taskData.bathroomShinerFree ? 'Yes' : 'No', // Free item
          taskData.copperFree ? 'Yes' : 'No', // Free item
          taskData.finalFree ? 'Yes' : 'No', // Free item
          taskData.Total,
        ],
      ],
    };

    // Append data to the sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A2',
      valueInputOption: 'RAW',
      resource: resource,
    });

    console.log('Data successfully appended to Google Sheets!');
  } catch (err) {
    console.error('Error appending data to Google Sheets:', err);
    throw err; // Re-throw to handle in the calling function
  }
}

module.exports = appendToSheet;
