const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
require('@electron/remote/main').initialize();

const defaultDataFiles = [
  'clerks.json',
  'clients.json',
  'express.json',
  'groomers.json',
  'jobOrderCounter.json',
  'matting.json',
  'packages.json',
  'prices.json',
  'sessionSummaries.json',
  'shedding.json',
  'sizes.json',
  'tangling.json',
  'users.json',
  'cancelledSessions.json'
];

const sourceDataDir = path.join(__dirname, 'data');
const userDataDir = app.getPath('userData');

let dataCopied = false;

function copyDefaultDataFilesOnce() {
  if (dataCopied) return;
  dataCopied = true;

  console.log("🛠 Copying default JSON files to userData...");
  defaultDataFiles.forEach(file => {
    const src = path.join(sourceDataDir, file);
    const dest = path.join(userDataDir, file);

    if (!fs.existsSync(src)) {
      console.warn(`⚠️ Source file missing: ${file}`);
      return;
    }

    if (!fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
      console.log(`📁 Copied ${file} to userData`);
    } else {
      console.log(`⏭️ Skipped (already exists): ${file}`);
    }
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false, // wait until ready-to-show
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  require('@electron/remote/main').enable(win.webContents);

  win.once('ready-to-show', () => {
    win.show();
    win.focus();
  });

  // Optional: force focus regain after blur (helps with input lag on Windows)
  win.on('blur', () => {
    setTimeout(() => {
      if (!win.isDestroyed()) {
        win.focus();
      }
    }, 300);
  });

  const usersPath = path.join(userDataDir, 'users.json');
  const users = fs.existsSync(usersPath) ? JSON.parse(fs.readFileSync(usersPath)) : [];

  if (users.length === 0) {
    win.loadFile('registerAdmin.html');
  } else {
    win.loadFile('login.html');
  }
}

app.whenReady().then(() => {
  copyDefaultDataFilesOnce();
  createWindow();
});
