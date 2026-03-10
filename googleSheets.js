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
    'Dish Wash', 'Dish Quantity', 'Laundry Wash', 'Laundry Quantity',
    'Floor Cleaner', 'Floor Cleaner Quantity', 'Toilet Cleaner Quantity',
    'Hand Wash', 'Hand Wash Quantity', 'Total',
  ];

  try {
    const sheetData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A1:Z1',
    });

    const rows = sheetData.data.values || [];
    if (rows.length === 0 || rows[0].join() !== headers.join()) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A1',
        valueInputOption: 'RAW',
        resource: { values: [headers] },
      });
      console.log('Headers added to the sheet.');
    }

    const resource = {
      values: [
        [
          taskData.no,
          taskData.date,
          taskData.name,
          taskData.number,
          taskData.address,
          taskData.dishWash,
          taskData.dishQnt,
          taskData.laundryWash,
          taskData.laundryQnt,
          taskData.floorClener,
          taskData.floorClenerQnt,
          taskData.toiletClenerQnt,
          taskData.handWash,
          taskData.handWashQnt,
          taskData.Total,
        ],
      ],
    };

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A2',
      valueInputOption: 'RAW',
      resource: resource,
    });

    console.log('Data successfully appended to Google Sheets!');
  } catch (err) {
    console.error('Error appending data to Google Sheets:', err);
  }
}

module.exports = appendToSheet;
