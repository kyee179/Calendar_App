const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("studyCalendar", {
  platform: process.platform,
  isDesktop: true
});
