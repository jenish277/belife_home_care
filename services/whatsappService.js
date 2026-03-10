const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let client = null;
let isReady = false;
let isInitializing = false;

function initializeClient() {
  if (client || isInitializing) return;
  
  isInitializing = true;
  console.log('Initializing WhatsApp client...');
  
  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: './.wwebjs_auth/session'
    })
  });

  client.on('qr', (qr) => {
    console.log('\n=== WhatsApp QR Code ===');
    qrcode.generate(qr, {small: true});
    console.log('Scan this QR code with your phone\'s WhatsApp');
    console.log('========================\n');
  });

  client.on('ready', () => {
    console.log('WhatsApp client ready!');
    isReady = true;
    isInitializing = false;
  });

  client.on('disconnected', () => {
    console.log('WhatsApp disconnected');
    isReady = false;
    client = null;
    isInitializing = false;
  });

  client.initialize().catch(error => {
    console.error('WhatsApp initialization error:', error.message);
    isInitializing = false;
    client = null;
  });
}

// Auto-initialize when module loads
initializeClient();

class WhatsAppService {
  async sendBill(phoneNumber, message) {
    if (!client) {
      initializeClient();
    }
    
    if (!isReady) {
      console.log('WhatsApp not ready');
      return;
    }
    
    try {
      const chatId = phoneNumber.replace(/\D/g, '') + '@c.us';
      await client.sendMessage(chatId, message);
      console.log(`WhatsApp sent to ${phoneNumber}`);
    } catch (error) {
      console.error('WhatsApp Error:', error.message);
    }
  }

  async destroy() {
    if (client) {
      await client.destroy();
      client = null;
      isReady = false;
      isInitializing = false;
    }
  }
}

module.exports = new WhatsAppService();
