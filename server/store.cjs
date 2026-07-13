const fs = require("node:fs");
const path = require("node:path");

const defaultData = {
  settings: {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    locale: "en-US",
    weekStartsOn: 0,
    defaultNotifyMinutesBefore: 15,
    aiProvider: "local",
    dailyAiRequestLimit: 10,
    defaultAvailability: [
      { label: "Evening focus", startsAt: "20:00", endsAt: "24:00" }
    ]
  },
  events: [
    {
      id: "seed-1",
      title: "Plan the week",
      startsAt: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
      endsAt: new Date(new Date().setHours(9, 30, 0, 0)).toISOString(),
      calendarType: "personal",
      location: "Home",
      notes: "Review tasks, study goals, and reminders.",
      color: "#2563eb",
      notifyMinutesBefore: 15,
      notificationFormat: "Desktop notification",
      repeat: "none",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  journals: [],
  journalAnalyses: []
};

function ensureShape(data) {
  return {
    settings: { ...defaultData.settings, ...(data.settings || {}) },
    events: Array.isArray(data.events) ? data.events : [],
    journals: Array.isArray(data.journals) ? data.journals : [],
    journalAnalyses: Array.isArray(data.journalAnalyses) ? data.journalAnalyses : []
  };
}

function ensureFile(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    return;
  }

  const current = ensureShape(JSON.parse(fs.readFileSync(filePath, "utf8")));
  fs.writeFileSync(filePath, JSON.stringify(current, null, 2));
}

function createStore(filePath) {
  ensureFile(filePath);

  function read() {
    const raw = fs.readFileSync(filePath, "utf8");
    return ensureShape(JSON.parse(raw));
  }

  function write(data) {
    fs.writeFileSync(filePath, JSON.stringify(ensureShape(data), null, 2));
    return data;
  }

  return {
    getSettings() {
      return read().settings;
    },
    updateSettings(patch) {
      const data = read();
      data.settings = { ...data.settings, ...patch };
      write(data);
      return data.settings;
    },
    listEvents({ from, to } = {}) {
      const data = read();
      const fromTime = from ? new Date(from).getTime() : Number.NEGATIVE_INFINITY;
      const toTime = to ? new Date(to).getTime() : Number.POSITIVE_INFINITY;

      return data.events
        .filter((event) => {
          const start = new Date(event.startsAt).getTime();
          const end = new Date(event.endsAt).getTime();
          return start <= toTime && end >= fromTime;
        })
        .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
    },
    createEvent(event) {
      const data = read();
      data.events.push(event);
      write(data);
      return event;
    },
    updateEvent(id, patch) {
      const data = read();
      const index = data.events.findIndex((event) => event.id === id);
      if (index === -1) return null;
      data.events[index] = { ...data.events[index], ...patch, id, updatedAt: new Date().toISOString() };
      write(data);
      return data.events[index];
    },
    deleteEvent(id) {
      const data = read();
      const before = data.events.length;
      data.events = data.events.filter((event) => event.id !== id);
      write(data);
      return data.events.length !== before;
    },
    listJournals({ type, bookmarked } = {}) {
      const data = read();
      return data.journals
        .filter((journal) => !type || journal.type === type)
        .filter((journal) => bookmarked === undefined || journal.bookmarked === bookmarked)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    },
    getJournal(id) {
      return read().journals.find((journal) => journal.id === id) || null;
    },
    createJournal(journal) {
      const data = read();
      data.journals.push(journal);
      write(data);
      return journal;
    },
    updateJournal(id, patch) {
      const data = read();
      const index = data.journals.findIndex((journal) => journal.id === id);
      if (index === -1) return null;
      data.journals[index] = { ...data.journals[index], ...patch, id, updatedAt: new Date().toISOString() };
      write(data);
      return data.journals[index];
    },
    deleteJournal(id) {
      const data = read();
      const before = data.journals.length;
      data.journals = data.journals.filter((journal) => journal.id !== id);
      data.journalAnalyses = data.journalAnalyses.filter((analysis) => analysis.journalId !== id);
      write(data);
      return data.journals.length !== before;
    },
    saveJournalAnalysis(analysis) {
      const data = read();
      data.journalAnalyses = data.journalAnalyses.filter((item) => item.id !== analysis.id && item.journalId !== analysis.journalId);
      data.journalAnalyses.push(analysis);
      write(data);
      return analysis;
    },
    getJournalAnalysis(journalId) {
      return read().journalAnalyses.find((analysis) => analysis.journalId === journalId) || null;
    }
  };
}

module.exports = { createStore, defaultData, ensureShape };