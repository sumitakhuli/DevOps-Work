// Thin wrapper around the FastAPI backend. The browser only ever talks to /api;
// nginx (compose) or the Ingress (Kubernetes) routes it to the backend Service.
const API = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.detail) detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  listTasks: () => request('/tasks'),
  stats: () => request('/tasks/stats'),
  createTask: (task) => request('/tasks', { method: 'POST', body: JSON.stringify(task) }),
  updateTask: (id, patch) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(patch) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
};
