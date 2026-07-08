const crypto = require("node:crypto");
const path = require("node:path");
const express = require("express");
const cors = require("cors");
const { createStore } = require("./store.cjs");

const VALID_TYPES = new Set(["personal", "study", "vacation", "holiday", "birthday", "other"]);
const VALID_REPEAT = new Set(["none", "daily", "weekly", "monthly", "yearly"]);

function isIsoDate(value) {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

function validateEventPayload(payload, { partial = false } = {}) {
  const errors = [];
  const requireField = (field) => {
    if (!partial && payload[field] === undefined) errors.push(`${field} is required`);
  };

  ["title", "startsAt", "endsAt", "calendarType", "notificationFormat"].forEach(requireField);

  if (payload.title !== undefined && String(payload.title).trim().length < 1) {
    errors.push("title must not be empty");
  }
  if (payload.startsAt !== undefined && !isIsoDate(payload.startsAt)) {
    errors.push("startsAt must be an ISO date string");
  }
  if (payload.endsAt !== undefined && !isIsoDate(payload.endsAt)) {
    errors.push("endsAt must be an ISO date string");
  }
  if (isIsoDate(payload.startsAt) && isIsoDate(payload.endsAt) && new Date(payload.endsAt) < new Date(payload.startsAt)) {
    errors.push("endsAt must be after startsAt");
  }
  if (payload.calendarType !== undefined && !VALID_TYPES.has(payload.calendarType)) {
    errors.push(`calendarType must be one of ${Array.from(VALID_TYPES).join(", ")}`);
  }
  if (payload.repeat !== undefined && !VALID_REPEAT.has(payload.repeat)) {
    errors.push(`repeat must be one of ${Array.from(VALID_REPEAT).join(", ")}`);
  }
  if (payload.notifyMinutesBefore !== undefined && Number(payload.notifyMinutesBefore) < 0) {
    errors.push("notifyMinutesBefore must be zero or greater");
  }

  return errors;
}

function normalizeEvent(payload, existing = {}) {
  const now = new Date().toISOString();
  const merged = {
    ...existing,
    ...payload,
    title: String(payload.title ?? existing.title ?? "").trim(),
    calendarType: payload.calendarType ?? existing.calendarType ?? "personal",
    location: payload.location ?? existing.location ?? "",
    notes: payload.notes ?? existing.notes ?? "",
    color: payload.color ?? existing.color ?? "#2563eb",
    notifyMinutesBefore: Number(payload.notifyMinutesBefore ?? existing.notifyMinutesBefore ?? 15),
    notificationFormat: payload.notificationFormat ?? existing.notificationFormat ?? "Desktop notification",
    repeat: payload.repeat ?? existing.repeat ?? "none",
    createdAt: existing.createdAt ?? now,
    updatedAt: now
  };
  return merged;
}

function createApp({ store }) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "study-calendar-api" });
  });

  app.get("/api/time", (_req, res) => {
    const now = new Date();
    res.json({
      now: now.toISOString(),
      localTime: now.toLocaleTimeString(),
      localDate: now.toLocaleDateString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
    });
  });

  app.get("/api/settings", (_req, res) => {
    res.json(store.getSettings());
  });

  app.put("/api/settings", (req, res) => {
    const allowed = ["timezone", "locale", "weekStartsOn", "defaultNotifyMinutesBefore"];
    const patch = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    res.json(store.updateSettings(patch));
  });

  app.get("/api/events", (req, res) => {
    res.json(store.listEvents({ from: req.query.from, to: req.query.to }));
  });

  app.post("/api/events", (req, res) => {
    const errors = validateEventPayload(req.body);
    if (errors.length > 0) return res.status(400).json({ errors });

    const event = {
      id: crypto.randomUUID(),
      ...normalizeEvent(req.body)
    };
    res.status(201).json(store.createEvent(event));
  });

  app.put("/api/events/:id", (req, res) => {
    const errors = validateEventPayload(req.body, { partial: true });
    if (errors.length > 0) return res.status(400).json({ errors });

    const patch = { ...req.body };
    if (patch.title !== undefined) patch.title = String(patch.title).trim();
    if (patch.notifyMinutesBefore !== undefined) patch.notifyMinutesBefore = Number(patch.notifyMinutesBefore);
    const event = store.updateEvent(req.params.id, patch);
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  });

  app.delete("/api/events/:id", (req, res) => {
    const deleted = store.deleteEvent(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Event not found" });
    res.status(204).send();
  });

  return app;
}

function startServer({ port = process.env.PORT || 4010, dataFile } = {}) {
  const store = createStore(dataFile || path.join(__dirname, "data", "calendar.json"));
  const app = createApp({ store });
  const server = app.listen(Number(port), "127.0.0.1", () => {
    console.log(`Study Calendar API listening on http://127.0.0.1:${port}`);
  });
  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = { createApp, startServer, validateEventPayload, normalizeEvent };


