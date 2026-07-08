const path = require("node:path");
const { app, BrowserWindow, Menu, shell } = require("electron");
const { startServer } = require("../server/index.cjs");

let mainWindow;
let apiServer;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 980,
    minHeight: 680,
    title: "Study Calendar",
    backgroundColor: "#f8fafc",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const startUrl = process.env.ELECTRON_START_URL;
  if (startUrl) {
    mainWindow.loadURL(startUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

function createMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        { role: "reload" },
        { type: "separator" },
        { role: "quit" }
      ]
    },
    {
      label: "View",
      submenu: [
        { role: "toggleDevTools" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  if (process.env.ELECTRON_MANAGED_API !== "false") {
    apiServer = startServer({ dataFile: path.join(app.getPath("userData"), "calendar.json") });
  }
  createMenu();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (apiServer) apiServer.close();
});
