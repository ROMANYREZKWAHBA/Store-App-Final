import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import pkg from 'node-machine-id';
const { machineId } = pkg;

import { encrypt, decrypt, getConfigPath, verifyLicenseKey, initTrialState, updateLastSeenTime, saveTrialState } from './trial-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;

let isTrialExpired = false;
let isTampered = false;
let isActivated = false;
let isTrialActivated = false;
let heartbeatInterval = null;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(app.getAppPath(), 'preload.js')
    }
  });

  const isLocked = (!isActivated && !isTrialActivated) || isTrialExpired || isTampered;
  if (isLocked) {
    mainWindow.loadFile(path.join(app.getAppPath(), 'trial-expired.html'));
  } else if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  const trialStatus = initTrialState(app);
  isTrialExpired = trialStatus.isTrialExpired;
  isTampered = trialStatus.isTampered;
  isActivated = trialStatus.isActivated;
  isTrialActivated = trialStatus.isTrialActivated;
  
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(() => {
      updateLastSeenTime(app, isTampered);
  }, 5 * 60 * 1000);

  ipcMain.handle('ping', () => 'pong');
  ipcMain.handle('get-machine-id', async () => await machineId());
  
  ipcMain.handle('activate-license', async (event, key) => {
      const machineIdStr = await machineId();
      const keyType = verifyLicenseKey(machineIdStr, key);

      if (keyType === 'FULL') {
          const configPath = getConfigPath(app);
          let state = {};
          if (fs.existsSync(configPath)) {
             try {
                 const dec = decrypt(fs.readFileSync(configPath, 'utf8'));
                 if (dec) state = JSON.parse(dec);
             } catch(e) {}
          }
          state.activated = true;
          saveTrialState(app, state);
          
          isTrialExpired = false;
          isActivated = true;
          isTrialActivated = false;
          
          const wins = BrowserWindow.getAllWindows();
          if (wins.length > 0) {
              if (isDev) {
                wins[0].loadURL('http://localhost:5173');
              } else {
                wins[0].loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
              }
          }
          return { success: true };
      } else if (keyType === 'TRIAL_7' || keyType === 'TRIAL_14') {
          const configPath = getConfigPath(app);
          let state = {};
          if (fs.existsSync(configPath)) {
             try {
                 const dec = decrypt(fs.readFileSync(configPath, 'utf8'));
                 if (dec) state = JSON.parse(dec);
             } catch(e) {}
          }

          if (state.trialActivated || state.trialStartDate) {
              return { success: false, message: "A trial has already been activated or has expired on this machine." };
          }

          const duration = keyType === 'TRIAL_7' ? (7 * 24 * 60 * 60 * 1000) : (14 * 24 * 60 * 60 * 1000);

          state.trialActivated = true;
          state.trialStartDate = Date.now();
          state.trialDuration = duration;
          state.lastSeenTime = Date.now();
          saveTrialState(app, state);

          isTrialExpired = false;
          isTrialActivated = true;
          
          const wins = BrowserWindow.getAllWindows();
          if (wins.length > 0) {
              if (isDev) {
                wins[0].loadURL('http://localhost:5173');
              } else {
                wins[0].loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
              }
          }
          return { success: true };
      }
      
      return { success: false, message: "Invalid activation key" };
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  updateLastSeenTime(app, isTampered);
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  updateLastSeenTime(app, isTampered);
});
