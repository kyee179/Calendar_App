const API_BASE = import.meta.env.VITE_API_BASE_URL || (window.location.protocol === "file:" ? "http://127.0.0.1:4010" : "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });

  if (!response.ok) {
    const error = response.status === 204 ? {} : await response.json().catch(() => ({}));
    throw new Error(error.errors?.join(", ") || error.error || `Request failed with ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  getTime: () => request("/api/time"),
  getSettings: () => request("/api/settings"),
  updateSettings: (settings) => request("/api/settings", { method: "PUT", body: JSON.stringify(settings) }),
  listEvents: ({ from, to } = {}) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return request(`/api/events?${params.toString()}`);
  },
  createEvent: (event) => request("/api/events", { method: "POST", body: JSON.stringify(event) }),
  updateEvent: (id, event) => request(`/api/events/${id}`, { method: "PUT", body: JSON.stringify(event) }),
  deleteEvent: (id) => request(`/api/events/${id}`, { method: "DELETE" })
};
