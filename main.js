const { app, BrowserWindow, session } = require('electron');
const path = require('path');

app.whenReady().then(() => {
  // Only the local page is ever loaded, so grant mic access without a prompt.
  session.defaultSession.setPermissionRequestHandler((_wc, perm, cb) => cb(perm === 'media'));
  session.defaultSession.setPermissionCheckHandler((_wc, perm) => perm === 'media');

  const win = new BrowserWindow({
    width: 460, height: 860, minWidth: 380, minHeight: 600,
    backgroundColor: '#0e0f13',
    autoHideMenuBar: true,
    title: 'bettermic',
    icon: path.join(__dirname, 'icon.png'),
  });
  win.loadFile('index.html');
});

app.on('window-all-closed', () => app.quit());
