require('@electron/remote/main').initialize();

import * as AutoLaunch from 'auto-launch';
import {
  app,
  BrowserWindow,
  Menu,
  nativeImage,
  screen,
  Tray,
  dialog,
} from 'electron';
import * as path from 'path';
import * as url from 'url';
import { autoUpdater } from 'electron-updater';

import * as log from 'electron-log';

//-------------------------------------------------------------------
// Logging
//
// THIS SECTION IS NOT REQUIRED
//
// This logging setup is not required for auto-updates to work,
// but it sure makes debugging easier :)
//-------------------------------------------------------------------
// autoUpdater.logger = log;
// autoUpdater.logger.transports.file.level = 'info';
log.info('App starting... ');

//-------------------------------------------------------------------
// Auto Updater
//-------------------------------------------------------------------

// Tell the autoUpdater where to check for the updates
autoUpdater.setFeedURL('https://ftp.codext.de/windows10-tweaks/released/');

// We want the user to proactively download the install
autoUpdater.autoDownload = true;

log.transports.file.level = 'info';
autoUpdater.logger = log;

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update... ');
});
autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('Update available.');
});
autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('Update not available.');
});
autoUpdater.on('error', (err) => {
  sendStatusToWindow('Error in auto-updater. ' + err);
});
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = 'Download speed: ' + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message =
    log_message +
    ' (' +
    progressObj.transferred +
    '/' +
    progressObj.total +
    ')';
  sendStatusToWindow(log_message);
});
function sendStatusToWindow(text) {
  log.info(text);
  // win.webContents.send('message', text);
}

let myWindow = null;
let tray = null;

const gotTheLock = app.requestSingleInstanceLock();

let win, serve, upload, hidden;
const args = process.argv.slice(1);
serve = args.some((val) => val === '--serve');
upload = args.some((val) => val === '--upload');
hidden = args.some((val) => val === '--hidden');

function createWindow() {
  autoUpdater.checkForUpdates();

  let autoLaunch = new AutoLaunch({
    name: 'Windows 10 - Tweaks',
    path: app.getPath('exe'),
    isHidden: true,
  });
  autoLaunch.isEnabled().then((isEnabled) => {
    if (!isEnabled) {
      // autoLaunch.enable();
    }
  });

  app.setAppUserModelId('de.codext.windows10-tweaks');

  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
    width: 410,
    minWidth: 250,
    minHeight: 250,
    height: 600,
    icon: path.join(__dirname, 'data/icon-white.png'),
    show: !hidden,
    titleBarStyle: process.platform === 'darwin' ? 'hidden' : 'default',
    frame: process.platform === 'darwin' ? true : false,
    center: true,
    backgroundColor: '#252a33',
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: serve ? true : false,
      contextIsolation: false,
      enableRemoteModule: true,
      // enableRemoteModule: true,
    } as any,
  });

  require('@electron/remote/main').enable(win.webContents);

  const iconPath = path.join(__dirname, 'data/icon-white.png');

  tray = new Tray(nativeImage.createFromPath(iconPath));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Öffnen',
      click: () => {
        win.show();
      },
    },
    {
      label: 'Schließen',
      click: () => {
        win.close();
      },
    },
  ]);
  tray.setToolTip('Windows 10 - Tweaks');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    win.show();
  });

  if (serve) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`),
    });
    win.loadURL('http://localhost:4200');
  } else {
    win.loadURL(
      url.format({
        pathname: path.join(__dirname, 'dist/index.html'),
        protocol: 'file:',
        slashes: true,
      })
    );
  }

  if (serve) {
    win.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });
}

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  if (!gotTheLock) {
    app.quit();
  } else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      // Someone tried to run a second instance, we should focus our window.
      if (win) {
        win.show();
        win.focus();
        // if (win.isMinimized()) win.restore();
      }
    });

    // Create myWindow, load the rest of the app, etc...
    app.on('ready', createWindow);
  }

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });
} catch (e) {
  // Catch Error
  // throw e;
}
