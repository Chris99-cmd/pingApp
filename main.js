const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

// ✅ Initialize @electron/remote
require('@electron/remote/main').initialize();

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true // ✅ Required for @electron/remote to work
    }
  });

  // ✅ Enable @electron/remote for this window
  require('@electron/remote/main').enable(win.webContents);

  const usersPath = path.join(__dirname, 'data/users.json');
  const users = fs.existsSync(usersPath) ? JSON.parse(fs.readFileSync(usersPath)) : [];

  if (users.length === 0) {
    win.loadFile('registerAdmin.html');
  } else {
    win.loadFile('login.html');
  }
}

app.whenReady().then(createWindow);
