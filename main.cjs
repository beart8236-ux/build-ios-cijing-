const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');
if (!app.requestSingleInstanceLock()) app.quit();
let win;
function create() {
  win = new BrowserWindow({
    width: 1360, height: 900, minWidth: 980, minHeight: 640,
    title: 'Yves词境', backgroundColor: '#eef3fb',
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true }
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate([{ role: 'appMenu' }, { role: 'editMenu' }, { role: 'viewMenu' }, { role: 'windowMenu' }]));
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//i.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file://')) e.preventDefault(); });
  win.on('page-title-updated', e => e.preventDefault());
}
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(create);
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) create(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
