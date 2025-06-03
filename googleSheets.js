const { google } = require('googleapis');
require('dotenv').config();

const auth = new google.auth.GoogleAuth({
  credentials: {
    type: process.env.TYPE,
    project_id: process.env.PROJECT_ID,
    private_key_id: process.env.PRIVATE_KEY_ID,
    private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
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

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

async function appendToSheet(taskData) {
  const headers = [
    'No', 'Date', 'Name', 'Number', 'Address',
    'Dish Wash 1000ml', 'Dish Wash 5000ml',
    'Laundry Wash 1000ml', 'Laundry Wash 5000ml',
    'Floor Cleaner Rose', 'Floor Cleaner Jasmine',
    'Toilet Cleaner', 'Hand Wash BlackBerry', 'Hand Wash Sandalwood',
    'Bathroom Shiner', 'Copper', 'Final',
    'Bathroom Shiner Free', 'Copper Free', 'Final Free', 'Floor Cleaner Jasmine Free',
    'Total',
  ];

  try {
    const sheetData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A1:V1',
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
          taskData.dishWash1000mlQnt,
          taskData.dishWash5000mlQnt,
          taskData.laundryWash1000mlQnt,
          taskData.laundryWash5000mlQnt,
          taskData.floorCleanerRoseQnt,
          taskData.floorCleanerJasmineQnt,
          taskData.toiletCleanerQnt,
          taskData.handWashBlackBerryQnt,
          taskData.handWashSandalwoodQnt,
          taskData.bathroomShinerQnt,
          taskData.copperQnt,
          taskData.finalQnt,
          taskData.bathroomShinerFree ? 'Yes' : 'No',
          taskData.copperFree ? 'Yes' : 'No',
          taskData.finalFree ? 'Yes' : 'No',
          taskData.floorCleanerJasmineFree ? 'Yes' : 'No',
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

async function updateSheet(taskId, updatedTask) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A2:V',
    });

    const rows = response.data.values || [];
    let rowIndex = -1;

    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] == updatedTask.no) {
        rowIndex = i + 2; // +2 because rows start at A2
        break;
      }
    }

    if (rowIndex === -1) {
      console.error("Task not found in Google Sheets");
      return;
    }

    const updatedRow = [
      updatedTask.no,
      updatedTask.date,
      updatedTask.name,
      updatedTask.number,
      updatedTask.address,
      updatedTask.dishWash1000mlQnt,
      updatedTask.dishWash5000mlQnt,
      updatedTask.laundryWash1000mlQnt,
      updatedTask.laundryWash5000mlQnt,
      updatedTask.floorCleanerRoseQnt,
      updatedTask.floorCleanerJasmineQnt,
      updatedTask.toiletCleanerQnt,
      updatedTask.handWashBlackBerryQnt,
      updatedTask.handWashSandalwoodQnt,
      updatedTask.bathroomShinerQnt,
      updatedTask.copperQnt,
      updatedTask.finalQnt,
      updatedTask.bathroomShinerFree ? 'Yes' : 'No',
      updatedTask.copperFree ? 'Yes' : 'No',
      updatedTask.finalFree ? 'Yes' : 'No',
      updatedTask.floorCleanerJasmineFree ? 'Yes' : 'No',
      updatedTask.Total,
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Sheet1!A${rowIndex}:V${rowIndex}`,
      valueInputOption: 'RAW',
      resource: { values: [updatedRow] },
    });

    console.log('Google Sheet updated successfully!');
  } catch (err) {
    console.error('Error updating Google Sheet:', err);
  }
}

async function deleteFromSheet(taskNo) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A2:V',
    });

    const rows = response.data.values || [];
    let rowIndex = -1;

    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] == taskNo) {
        rowIndex = i + 2; // +2 because rows start at A2
        break;
      }
    }

    if (rowIndex === -1) {
      console.error('Task not found in Google Sheets');
      return;
    }

    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `Sheet1!A${rowIndex}:V${rowIndex}`,
    });

    console.log('Task deleted from Google Sheets!');
  } catch (err) {
    console.error('Error deleting from Google Sheets:', err);
  }
}

module.exports = { appendToSheet, updateSheet, deleteFromSheet };
