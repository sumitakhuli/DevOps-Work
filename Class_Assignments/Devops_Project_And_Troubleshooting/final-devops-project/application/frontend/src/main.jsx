import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { api } from './api.js';
import './styles.css';

const USER = { name: 'Sumit Akhuli', role: 'DevOps Engineer' };

const STATUSES = [
  { id: 'TODO', label: 'To do' },
  { id: 'IN_PROGRESS', label: 'In progress' },
  { id: 'DONE', label: 'Done' },
];
const STATUS_LABEL = Object.fromEntries(STATUSES.map((s) => [s.id, s.label]));
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

const VIEWS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid', subtitle: "Here's what's happening across the workspace today." },
  { id: 'my-tasks', label: 'My tasks', icon: 'check', subtitle: `Everything assigned to ${USER.name}.` },
  { id: 'board', label: 'Board', icon: 'columns', subtitle: 'Work grouped by status. Drag a card to move it.' },
  { id: 'activity', label: 'Activity', icon: 'pulse', subtitle: 'Everything that changed, newest first.' },
];

const EMPTY_STATS = { total: 0, todo: 0, inProgress: 0, done: 0 };
const LOG_KEY = 'taskboard.activity';

/* ───────────────────────────── helpers ───────────────────────────── */

const cls = (value) => value.toLowerCase().replace('_', '-');
const capitalize = (value) => value.charAt(0) + value.slice(1).toLowerCase();

function computeStats(tasks) {
  return tasks.reduce(
    (acc, t) => {
      acc.total += 1;
      if (t.status === 'TODO') acc.todo += 1;
      if (t.status === 'IN_PROGRESS') acc.inProgress += 1;
      if (t.status === 'DONE') acc.done += 1;
      return acc;
    },
    { ...EMPTY_STATS },
  );
}

// Postgres returns an offset; SQLite (local dev/tests) returns naive UTC timestamps.
const parseTime = (iso) => new Date(/(Z|[+-]\d\d:?\d\d)$/i.test(iso) ? iso : `${iso}Z`);

function timeAgo(iso) {
  const seconds = Math.max(0, (Date.now() - parseTime(iso).getTime()) / 1000);
  if (seconds < 45) return 'just now';
  if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} h ago`;
  if (seconds < 7 * 86400) return `${Math.round(seconds / 86400)} d ago`;
  return parseTime(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function initials(name) {
  return (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function avatarHue(name) {
  let hash = 0;
  for (const ch of name || '') hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  return hash;
}

// The activity log lives in the browser only; it is a convenience, so storage failures are ignored.
function loadLog() {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY)) || [];
  } catch {
    return [];
  }
}

function saveLog(entries) {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(entries));
  } catch {
    /* private mode / storage disabled */
  }
}

function useHashView() {
  const read = () => {
    const id = window.location.hash.replace(/^#\/?/, '');
    return VIEWS.some((v) => v.id === id) ? id : 'dashboard';
  };
  const [view, setView] = useState(read);
  useEffect(() => {
    const onChange = () => setView(read());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return view;
}

/* ───────────────────────────── icons ───────────────────────────── */

const ICON_PATHS = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  check: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  columns: 'M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM9 3v18M15 3v18',
  pulse: 'M22 12h-4l-3 9L9 3l-3 9H2',
  plus: 'M12 5v14M5 12h14',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6',
  edit: 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35',
  x: 'M18 6L6 18M6 6l12 12',
  refresh: 'M21 12a9 9 0 1 1-2.64-6.36L21 8M21 3v5h-5',
  alert: 'M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
  done: 'M20 6L9 17l-5-5',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  circle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  layers: 'M12 2l10 5-10 5L2 7l10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
};

function Icon({ name, size = 18 }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

/* ───────────────────────────── app ───────────────────────────── */

function App() {
  const view = useHashView();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null); // null = closed, {} = new task, task = edit
  const [log, setLog] = useState(loadLog);
  const [toast, setToast] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [taskList, taskStats] = await Promise.all([api.listTasks(), api.stats()]);
      setTasks(taskList);
      setStats(taskStats);
      setError('');
    } catch (e) {
      setError(e.message || 'Backend unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const closeModal = useCallback(() => setEditing(null), []);
  const notify = (text, tone = 'ok') => setToast({ text, tone, key: Date.now() });

  const record = (kind, text) =>
    setLog((prev) => {
      const next = [{ id: `${Date.now()}-${prev.length}`, kind, text, at: new Date().toISOString() }, ...prev].slice(0, 60);
      saveLog(next);
      return next;
    });

  // Throws on failure so the modal can show the error and stay open.
  async function saveTask(data) {
    if (editing?.id) {
      const updated = await api.updateTask(editing.id, data);
      record('edit', `Updated “${updated.title}”`);
      notify('Task updated');
    } else {
      await api.createTask(data);
      notify('Task created');
    }
    setEditing(null);
    await refresh();
  }

  async function changeStatus(task, status) {
    if (task.status === status) return;
    setTasks((list) => list.map((t) => (t.id === task.id ? { ...t, status } : t)));
    try {
      await api.updateTask(task.id, { status });
      record(status === 'DONE' ? 'done' : 'status', `“${task.title}” moved to ${STATUS_LABEL[status]}`);
    } catch (e) {
      notify(`Could not update task: ${e.message}`, 'error');
    }
    refresh();
  }

  async function removeTask(task) {
    setTasks((list) => list.filter((t) => t.id !== task.id));
    try {
      await api.deleteTask(task.id);
      record('delete', `Deleted “${task.title}”`);
      notify('Task deleted');
    } catch (e) {
      notify(`Could not delete task: ${e.message}`, 'error');
    }
    refresh();
  }

  const mine = useMemo(() => tasks.filter((t) => t.assignee === USER.name), [tasks]);
  const scoped = view === 'my-tasks' ? mine : tasks;
  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scoped;
    return scoped.filter((t) => `${t.title} ${t.description} ${t.assignee}`.toLowerCase().includes(q));
  }, [scoped, query]);
  const visible = filter === 'ALL' ? searched : searched.filter((t) => t.status === filter);

  // Task creation comes from the server's created_at; status changes and deletes from the local log.
  const activity = useMemo(() => {
    const created = tasks.map((t) => ({ id: `created-${t.id}`, kind: 'create', text: `“${t.title}” was created`, at: t.created_at }));
    return [...created, ...log].sort((a, b) => parseTime(b.at) - parseTime(a.at));
  }, [tasks, log]);

  const current = VIEWS.find((v) => v.id === view);
  const handlers = { onStatus: changeStatus, onEdit: setEditing, onDelete: removeTask };
  const openMine = mine.filter((t) => t.status !== 'DONE').length;

  return (
    <div className="app">
      <Sidebar view={view} badges={{ 'my-tasks': openMine }} />

      <main className="main">
        <header className="topbar">
          <div className="heading">
            <p className="eyebrow">Workspace <span>/</span> {current.label}</p>
            <h1>{view === 'dashboard' ? `${greeting()}, ${USER.name.split(' ')[0]}` : current.label}</h1>
            <p className="muted">{current.subtitle}</p>
          </div>
          <div className="topbar-actions">
            {view !== 'activity' && (
              <label className="search">
                <Icon name="search" size={16} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks…" aria-label="Search tasks" />
                {query && (
                  <button type="button" className="search-clear" onClick={() => setQuery('')} aria-label="Clear search">
                    <Icon name="x" size={14} />
                  </button>
                )}
              </label>
            )}
            <button className="btn btn-primary" onClick={() => setEditing({})}>
              <Icon name="plus" size={16} /> New task
            </button>
          </div>
        </header>

        {error && (
          <div className="alert" role="alert">
            <Icon name="alert" />
            <span><b>Backend unavailable.</b> {error}. Check that the API and PostgreSQL are running.</span>
            <button className="btn btn-ghost sm" onClick={refresh}><Icon name="refresh" size={14} /> Retry</button>
          </div>
        )}

        {view === 'dashboard' && (
          <>
            <StatsRow stats={stats} />
            <section className="content-grid">
              <TaskTable title="Tasks" subtitle="Track work across the product team." tasks={visible} all={searched}
                loading={loading} filter={filter} setFilter={setFilter} {...handlers} />
              <aside className="panel side-panel">
                <PanelHead title="Recent activity" subtitle="Latest workspace events.">
                  <a className="link" href="#/activity">View all <Icon name="arrow" size={14} /></a>
                </PanelHead>
                <ActivityList items={activity.slice(0, 6)} />
                <Pipeline />
              </aside>
            </section>
          </>
        )}

        {view === 'my-tasks' && (
          <>
            <StatsRow stats={computeStats(mine)} />
            <TaskTable title="Assigned to me" subtitle="Click a task to edit it." tasks={visible} all={searched}
              loading={loading} filter={filter} setFilter={setFilter} hideAssignee
              emptyText="Nothing assigned to you yet. Create a task to get started." {...handlers} />
          </>
        )}

        {view === 'board' && <Board tasks={searched} loading={loading} {...handlers} />}

        {view === 'activity' && (
          <section className="panel">
            <PanelHead title="Activity log" subtitle="Task creation comes from the API; edits, moves and deletes are logged in this browser." />
            <ActivityList items={activity} />
          </section>
        )}
      </main>

      {editing && <TaskModal task={editing} onClose={closeModal} onSave={saveTask} />}
      {toast && (
        <div className={`toast ${toast.tone}`} key={toast.key} role="status">
          <Icon name={toast.tone === 'error' ? 'alert' : 'done'} size={16} /> {toast.text}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────── layout ───────────────────────────── */

function Sidebar({ view, badges }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark"><Icon name="layers" size={18} /></span>
        <div>
          <b>TaskBoard</b>
          <small>DevOps Capstone</small>
        </div>
      </div>
      <nav>
        <p className="nav-label">Menu</p>
        {VIEWS.map((v) => (
          <a key={v.id} href={`#/${v.id}`} className={view === v.id ? 'active' : ''} aria-current={view === v.id ? 'page' : undefined}>
            <Icon name={v.icon} />
            <span>{v.label}</span>
            {badges[v.id] > 0 && <em className="badge">{badges[v.id]}</em>}
          </a>
        ))}
      </nav>
      <div className="side-bottom">
        <div className="env-card">
          <span className="pulse-dot" />
          <div>
            <strong>All systems operational</strong>
            <p>Built, scanned and deployed via GitOps.</p>
          </div>
        </div>
        <div className="profile">
          <Avatar name={USER.name} />
          <div>
            <b>{USER.name}</b>
            <small>{USER.role}</small>
          </div>
        </div>
      </div>
    </aside>
  );
}

function PanelHead({ title, subtitle, children }) {
  return (
    <div className="panel-head">
      <div>
        <h2>{title}</h2>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function StatsRow({ stats }) {
  const pct = (n) => (stats.total ? Math.round((n / stats.total) * 100) : 0);
  const cards = [
    { label: 'Total tasks', value: stats.total, icon: 'layers', tone: 'accent', note: 'Across all statuses', share: 100 },
    { label: 'To do', value: stats.todo, icon: 'circle', tone: 'todo', note: `${pct(stats.todo)}% of tasks`, share: pct(stats.todo) },
    { label: 'In progress', value: stats.inProgress, icon: 'clock', tone: 'in-progress', note: `${pct(stats.inProgress)}% of tasks`, share: pct(stats.inProgress) },
    { label: 'Completed', value: stats.done, icon: 'done', tone: 'done', note: `${pct(stats.done)}% completion rate`, share: pct(stats.done) },
  ];
  return (
    <section className="stats">
      {cards.map((c) => (
        <div className={`stat tone-${c.tone}`} key={c.label}>
          <div className="stat-top">
            <small>{c.label}</small>
            <span className="stat-icon"><Icon name={c.icon} size={16} /></span>
          </div>
          <strong>{c.value}</strong>
          <div className="meter"><i style={{ width: `${c.share}%` }} /></div>
          <span className="stat-note">{c.note}</span>
        </div>
      ))}
    </section>
  );
}

/* ───────────────────────────── tasks ───────────────────────────── */

function TaskTable({ title, subtitle, tasks, all, loading, filter, setFilter, hideAssignee, emptyText, onStatus, onEdit, onDelete }) {
  const counts = computeStats(all);
  const filters = [
    { id: 'ALL', label: 'All', count: counts.total },
    { id: 'TODO', label: 'To do', count: counts.todo },
    { id: 'IN_PROGRESS', label: 'In progress', count: counts.inProgress },
    { id: 'DONE', label: 'Done', count: counts.done },
  ];
  return (
    <div className="panel tasks-panel">
      <PanelHead title={title} subtitle={subtitle}>
        <div className="segmented" role="tablist">
          {filters.map((f) => (
            <button key={f.id} role="tab" aria-selected={filter === f.id} className={filter === f.id ? 'selected' : ''} onClick={() => setFilter(f.id)}>
              {f.label} <span>{f.count}</span>
            </button>
          ))}
        </div>
      </PanelHead>
      {loading ? (
        <div className="skeleton-list">{[0, 1, 2].map((i) => <div className="skeleton" key={i} />)}</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                {!hideAssignee && <th>Assignee</th>}
                <th>Priority</th>
                <th>Status</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td className="title-cell">
                    <button className="task-title" onClick={() => onEdit(t)} title="Edit task">
                      <span className={`dot ${cls(t.status)}`} />
                      <span>
                        <b className={t.status === 'DONE' ? 'struck' : ''}>{t.title}</b>
                        {t.description && <small>{t.description}</small>}
                      </span>
                    </button>
                  </td>
                  {!hideAssignee && <td><Assignee name={t.assignee} /></td>}
                  <td><Priority value={t.priority} /></td>
                  <td><StatusSelect task={t} onStatus={onStatus} /></td>
                  <td className="actions-cell">
                    <div className="row-actions">
                      <button className="icon-btn" onClick={() => onEdit(t)} aria-label="Edit task" title="Edit"><Icon name="edit" size={16} /></button>
                      <DeleteButton onConfirm={() => onDelete(t)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!tasks.length && <div className="empty">{emptyText || 'No tasks match this view.'}</div>}
        </div>
      )}
    </div>
  );
}

function Board({ tasks, loading, onStatus, onEdit, onDelete }) {
  const [over, setOver] = useState(null);
  const drop = (status) => (e) => {
    e.preventDefault();
    setOver(null);
    const task = tasks.find((t) => t.id === Number(e.dataTransfer.getData('text/plain')));
    if (task) onStatus(task, status);
  };
  return (
    <section className="board">
      {STATUSES.map((s) => {
        const column = tasks.filter((t) => t.status === s.id);
        return (
          <div key={s.id} className={`column ${over === s.id ? 'drop-target' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setOver(s.id); }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(null); }}
            onDrop={drop(s.id)}>
            <div className="column-head">
              <span className={`dot ${cls(s.id)}`} />
              <h3>{s.label}</h3>
              <span className="count">{column.length}</span>
            </div>
            {loading && <div className="skeleton card-skeleton" />}
            {column.map((t) => (
              <article key={t.id} className="card" draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', String(t.id))}>
                <div className="card-top">
                  <Priority value={t.priority} />
                  <DeleteButton onConfirm={() => onDelete(t)} compact />
                </div>
                <button className={`card-title ${t.status === 'DONE' ? 'struck' : ''}`} onClick={() => onEdit(t)}>{t.title}</button>
                {t.description && <p>{t.description}</p>}
                <div className="card-foot">
                  <Assignee name={t.assignee} />
                  <StatusSelect task={t} onStatus={onStatus} />
                </div>
              </article>
            ))}
            {!loading && !column.length && <div className="column-empty">Drop tasks here</div>}
          </div>
        );
      })}
    </section>
  );
}

function StatusSelect({ task, onStatus }) {
  return (
    <select className={`status ${cls(task.status)}`} value={task.status} onChange={(e) => onStatus(task, e.target.value)} aria-label="Change status">
      {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
    </select>
  );
}

function Priority({ value }) {
  return <span className={`priority ${cls(value)}`}><i />{capitalize(value)}</span>;
}

function Avatar({ name, small }) {
  return (
    <span className={`avatar ${small ? 'sm' : ''}`} style={{ '--hue': avatarHue(name) }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

function Assignee({ name }) {
  return <span className="assignee"><Avatar name={name} small />{name}</span>;
}

function DeleteButton({ onConfirm, compact }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return undefined;
    const timer = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(timer);
  }, [armed]);
  if (armed) {
    return (
      <span className="confirm">
        {!compact && <button className="btn btn-ghost sm" onClick={() => setArmed(false)}>Cancel</button>}
        <button className="btn btn-danger sm" onClick={onConfirm}>Delete</button>
      </span>
    );
  }
  return (
    <button className="icon-btn danger" onClick={() => setArmed(true)} aria-label="Delete task" title="Delete">
      <Icon name="trash" size={16} />
    </button>
  );
}

/* ───────────────────────────── activity ───────────────────────────── */

const ACTIVITY_ICON = { create: 'plus', edit: 'edit', status: 'arrow', done: 'done', delete: 'trash' };

function ActivityList({ items }) {
  if (!items.length) return <div className="empty">No activity yet.</div>;
  return (
    <ol className="activity">
      {items.map((a) => (
        <li key={a.id} className={`kind-${a.kind}`}>
          <span className="activity-icon"><Icon name={ACTIVITY_ICON[a.kind] || 'pulse'} size={14} /></span>
          <div>
            <b>{a.text}</b>
            <small>{timeAgo(a.at)}</small>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Pipeline() {
  const steps = ['CI', 'Build', 'Scan', 'Deploy'];
  return (
    <div className="pipeline">
      <p className="eyebrow">Delivery pipeline</p>
      <div className="pipeline-steps">
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <span className="step"><Icon name="done" size={12} />{s}</span>
            {i < steps.length - 1 && <i />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────────── modal ───────────────────────────── */

function TaskModal({ task, onClose, onSave }) {
  const isEdit = Boolean(task.id);
  const [form, setForm] = useState({
    title: task.title ?? '',
    description: task.description ?? '',
    priority: task.priority ?? 'MEDIUM',
    status: task.status ?? 'TODO',
    assignee: task.assignee ?? USER.name,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const titleRef = useRef(null);

  useEffect(() => {
    titleRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError('');
    try {
      await onSave({ ...form, title: form.title.trim(), assignee: form.assignee.trim() || 'Unassigned' });
    } catch (ex) {
      setError(ex.message);
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-head">
          <div>
            <p className="eyebrow">{isEdit ? 'Edit task' : 'Create task'}</p>
            <h2 id="modal-title">{isEdit ? 'Update task details' : 'Add a new task'}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>

        <label className="field">
          <span>Title</span>
          <input ref={titleRef} value={form.title} onChange={set('title')} required maxLength={200} placeholder="e.g. Configure production ingress" />
        </label>
        <label className="field">
          <span>Description</span>
          <textarea value={form.description} onChange={set('description')} rows={3} placeholder="What needs to be done?" />
        </label>

        <div className="field">
          <span>Priority</span>
          <div className="choice">
            {PRIORITIES.map((p) => (
              <label key={p} className={`choice-item ${cls(p)} ${form.priority === p ? 'checked' : ''}`}>
                <input type="radio" name="priority" value={p} checked={form.priority === p} onChange={set('priority')} />
                <i />{capitalize(p)}
              </label>
            ))}
          </div>
        </div>

        <div className="form-row">
          <label className="field">
            <span>Status</span>
            <select value={form.status} onChange={set('status')}>
              {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Assignee</span>
            <input value={form.assignee} onChange={set('assignee')} maxLength={120} />
          </label>
        </div>

        {error && <div className="form-error"><Icon name="alert" size={16} /> {error}</div>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
