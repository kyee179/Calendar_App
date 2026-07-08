import { useEffect, useMemo, useRef, useState } from "react";
import {
  addMinutes,
  format,
  isSameDay,
  parseISO
} from "date-fns";
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  MapPin,
  Plus,
  Save,
  Trash2,
  Umbrella,
  X
} from "lucide-react";
import { api } from "./api.js";
import {
  buildMonthDays,
  eventToReminderLine,
  formatTimeRange,
  getDayState,
  getEventsForDay,
  getMonthRange,
  shiftMonth,
  toLocalInputValue
} from "./calendarUtils.js";

const categoryOptions = [
  { value: "personal", label: "Personal", color: "#2563eb" },
  { value: "study", label: "Study", color: "#16a34a" },
  { value: "vacation", label: "Vacation", color: "#f59e0b" },
  { value: "holiday", label: "Holiday", color: "#dc2626" },
  { value: "birthday", label: "Birthday", color: "#9333ea" },
  { value: "other", label: "Other", color: "#475569" }
];

const repeatOptions = ["none", "daily", "weekly", "monthly", "yearly"];
const notificationOptions = ["Desktop notification", "Silent reminder", "Email later", "AI summary later"];

function createEmptyForm(day = new Date()) {
  const start = new Date(day);
  start.setHours(9, 0, 0, 0);
  const end = addMinutes(start, 30);
  return {
    id: null,
    title: "",
    startsAt: toLocalInputValue(start),
    endsAt: toLocalInputValue(end),
    calendarType: "personal",
    location: "",
    notes: "",
    color: "#2563eb",
    notifyMinutesBefore: 15,
    notificationFormat: "Desktop notification",
    repeat: "none"
  };
}

function formFromEvent(event) {
  return {
    ...event,
    startsAt: toLocalInputValue(event.startsAt),
    endsAt: toLocalInputValue(event.endsAt)
  };
}

function App() {
  const [activeDate, setActiveDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [settings, setSettings] = useState({ weekStartsOn: 0, defaultNotifyMinutesBefore: 15 });
  const [clock, setClock] = useState(new Date());
  const [serverTime, setServerTime] = useState(null);
  const [view, setView] = useState("month");
  const [form, setForm] = useState(createEmptyForm(new Date()));
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState("Ready");
  const notifiedEvents = useRef(new Set());

  const monthRange = useMemo(() => getMonthRange(activeDate, settings.weekStartsOn), [activeDate, settings.weekStartsOn]);
  const days = useMemo(() => buildMonthDays(activeDate, settings.weekStartsOn), [activeDate, settings.weekStartsOn]);
  const selectedEvents = useMemo(() => getEventsForDay(events, selectedDay), [events, selectedDay]);
  const agendaEvents = useMemo(() => [...events].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)), [events]);

  const metrics = useMemo(() => {
    const todayEvents = events.filter((event) => isSameDay(parseISO(event.startsAt), new Date()));
    return {
      today: todayEvents.length,
      vacation: events.filter((event) => event.calendarType === "vacation").length,
      reminders: events.filter((event) => Number(event.notifyMinutesBefore) >= 0).length
    };
  }, [events]);

  async function loadEvents(range = monthRange) {
    try {
      const data = await api.listEvents(range);
      setEvents(data);
      setStatus("Synced with local API");
    } catch (error) {
      setStatus(`API unavailable: ${error.message}`);
    }
  }

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    Promise.all([api.getSettings(), api.getTime()])
      .then(([settingsData, timeData]) => {
        setSettings(settingsData);
        setServerTime(timeData);
      })
      .catch((error) => setStatus(`Startup warning: ${error.message}`));
  }, []);

  useEffect(() => {
    loadEvents(monthRange);
  }, [monthRange.from, monthRange.to]);

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") Notification.requestPermission();
  }, []);

  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const now = Date.now();
    events.forEach((event) => {
      const notifyAt = new Date(event.startsAt).getTime() - Number(event.notifyMinutesBefore || 0) * 60_000;
      const key = `${event.id}:${notifyAt}`;
      if (notifyAt <= now && now - notifyAt < 60_000 && !notifiedEvents.current.has(key)) {
        notifiedEvents.current.add(key);
        new Notification(event.title, {
          body: eventToReminderLine(event),
          tag: key
        });
      }
    });
  }, [clock, events]);

  function startNewEvent(day = selectedDay) {
    setSelectedDay(day);
    setForm(createEmptyForm(day));
    setIsEditing(true);
  }

  function editEvent(event) {
    setForm(formFromEvent(event));
    setIsEditing(true);
  }

  async function saveEvent(event) {
    event.preventDefault();
    const payload = {
      ...form,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
      notifyMinutesBefore: Number(form.notifyMinutesBefore)
    };

    try {
      if (form.id) {
        await api.updateEvent(form.id, payload);
        setStatus("Reminder updated");
      } else {
        await api.createEvent(payload);
        setStatus("Reminder created");
      }
      setIsEditing(false);
      setForm(createEmptyForm(selectedDay));
      await loadEvents();
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function deleteEvent(eventId) {
    try {
      await api.deleteEvent(eventId);
      setStatus("Reminder deleted");
      await loadEvents();
      setIsEditing(false);
    } catch (error) {
      setStatus(error.message);
    }
  }

  function changeCategory(value) {
    const category = categoryOptions.find((option) => option.value === value);
    setForm((current) => ({ ...current, calendarType: value, color: category?.color || current.color }));
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Calendar summary">
        <div className="brand-row">
          <CalendarDays size={28} aria-hidden="true" />
          <div>
            <h1>Study Calendar</h1>
            <p>{format(clock, "EEEE, MMMM d, yyyy")}</p>
          </div>
        </div>

        <section className="time-panel" aria-label="Current time">
          <Clock size={20} aria-hidden="true" />
          <div>
            <strong>{format(clock, "h:mm:ss a")}</strong>
            <span>{serverTime?.timezone || settings.timezone || "Local time"}</span>
          </div>
        </section>

        <div className="quick-stats" aria-label="Calendar totals">
          <div>
            <span>{metrics.today}</span>
            <p>Today</p>
          </div>
          <div>
            <span>{metrics.vacation}</span>
            <p>Vacation</p>
          </div>
          <div>
            <span>{metrics.reminders}</span>
            <p>Alerts</p>
          </div>
        </div>

        <section className="selected-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Selected</span>
              <h2>{format(selectedDay, "MMM d")}</h2>
            </div>
            <button className="icon-button" type="button" title="Add reminder" onClick={() => startNewEvent(selectedDay)}>
              <Plus size={18} />
            </button>
          </div>

          <div className="event-list compact-list">
            {selectedEvents.length === 0 ? (
              <p className="empty-state">No reminders yet.</p>
            ) : selectedEvents.map((event) => (
              <button className="event-row" type="button" key={event.id} onClick={() => editEvent(event)}>
                <span className="color-dot" style={{ background: event.color }} />
                <span>
                  <strong>{event.title}</strong>
                  <small>{formatTimeRange(event)}</small>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="status-line" aria-live="polite">{status}</section>
      </aside>

      <section className="calendar-workspace">
        <header className="toolbar">
          <div className="month-controls">
            <button className="icon-button" type="button" title="Previous month" onClick={() => setActiveDate(shiftMonth(activeDate, -1))}>
              <ChevronLeft size={20} />
            </button>
            <button className="today-button" type="button" onClick={() => { setActiveDate(new Date()); setSelectedDay(new Date()); }}>
              Today
            </button>
            <button className="icon-button" type="button" title="Next month" onClick={() => setActiveDate(shiftMonth(activeDate, 1))}>
              <ChevronRight size={20} />
            </button>
            <h2>{format(activeDate, "MMMM yyyy")}</h2>
          </div>

          <div className="toolbar-actions">
            <div className="segmented" role="tablist" aria-label="Calendar view">
              <button type="button" className={view === "month" ? "active" : ""} onClick={() => setView("month")}>Month</button>
              <button type="button" className={view === "agenda" ? "active" : ""} onClick={() => setView("agenda")}>Agenda</button>
            </div>
            <button className="primary-button" type="button" onClick={() => startNewEvent(selectedDay)}>
              <Plus size={18} />
              Add
            </button>
          </div>
        </header>

        {view === "month" ? (
          <section className="month-grid" aria-label="Month calendar">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
              <div className="weekday" key={dayName}>{dayName}</div>
            ))}

            {days.map((day) => {
              const state = getDayState(day, activeDate);
              const dayEvents = getEventsForDay(events, day).slice(0, 4);
              const isSelected = isSameDay(day, selectedDay);
              return (
                <button
                  type="button"
                  className={`day-cell ${state.isCurrentMonth ? "" : "muted"} ${state.isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  onDoubleClick={() => startNewEvent(day)}
                >
                  <span className="day-number">{format(day, "d")}</span>
                  <span className="cell-events">
                    {dayEvents.map((event) => (
                      <span className="event-chip" key={event.id} style={{ borderLeftColor: event.color }}>
                        {event.calendarType === "vacation" && <Umbrella size={12} />}
                        {event.title}
                      </span>
                    ))}
                  </span>
                </button>
              );
            })}
          </section>
        ) : (
          <section className="agenda-list" aria-label="Agenda">
            {agendaEvents.length === 0 ? <p className="empty-state">No reminders in this month range.</p> : agendaEvents.map((event) => (
              <article className="agenda-item" key={event.id}>
                <div className="agenda-date">
                  <span>{format(parseISO(event.startsAt), "MMM")}</span>
                  <strong>{format(parseISO(event.startsAt), "d")}</strong>
                </div>
                <div className="agenda-body">
                  <div className="agenda-title-row">
                    <span className="color-dot" style={{ background: event.color }} />
                    <h3>{event.title}</h3>
                    <button className="icon-button" type="button" title="Edit reminder" onClick={() => editEvent(event)}>
                      <Edit3 size={16} />
                    </button>
                  </div>
                  <p><Clock size={14} /> {formatTimeRange(event)}</p>
                  {event.location && <p><MapPin size={14} /> {event.location}</p>}
                  <small>{eventToReminderLine(event)}</small>
                </div>
              </article>
            ))}
          </section>
        )}
      </section>

      {isEditing && (
        <aside className="editor-panel" aria-label="Reminder editor">
          <form onSubmit={saveEvent}>
            <div className="editor-heading">
              <div>
                <span className="eyebrow">Reminder</span>
                <h2>{form.id ? "Edit" : "Create"}</h2>
              </div>
              <button className="icon-button" type="button" title="Close editor" onClick={() => setIsEditing(false)}>
                <X size={18} />
              </button>
            </div>

            <label>
              Title
              <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Study algorithms" />
            </label>

            <div className="field-grid">
              <label>
                Starts
                <input type="datetime-local" required value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} />
              </label>
              <label>
                Ends
                <input type="datetime-local" required value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} />
              </label>
            </div>

            <div className="field-grid">
              <label>
                Category
                <select value={form.calendarType} onChange={(event) => changeCategory(event.target.value)}>
                  {categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label>
                Repeat
                <select value={form.repeat} onChange={(event) => setForm({ ...form, repeat: event.target.value })}>
                  {repeatOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            </div>

            <label>
              Location
              <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Library" />
            </label>

            <div className="field-grid">
              <label>
                Notify before
                <input type="number" min="0" value={form.notifyMinutesBefore} onChange={(event) => setForm({ ...form, notifyMinutesBefore: event.target.value })} />
              </label>
              <label>
                Notification format
                <select value={form.notificationFormat} onChange={(event) => setForm({ ...form, notificationFormat: event.target.value })}>
                  {notificationOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            </div>

            <label>
              Notes
              <textarea rows="4" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Add useful details" />
            </label>

            <div className="reminder-preview">
              <Bell size={16} />
              <span>time: {form.startsAt ? format(new Date(form.startsAt), "p") : "a"} to {form.endsAt ? format(new Date(form.endsAt), "p") : "b"}; {form.title || "title"}; {form.notificationFormat}</span>
            </div>

            <div className="editor-actions">
              {form.id && (
                <button className="danger-button" type="button" onClick={() => deleteEvent(form.id)}>
                  <Trash2 size={16} />
                  Delete
                </button>
              )}
              <button className="primary-button" type="submit">
                <Save size={16} />
                Save
              </button>
            </div>
          </form>
        </aside>
      )}
    </main>
  );
}

export default App;
