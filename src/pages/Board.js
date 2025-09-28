import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import '../styles/board.css';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const STATUSES = [
  { key: 'learning', label: 'Learning', icon: 'bi-book', color: '#8b5cf6' },
  { key: 'working', label: 'Working', icon: 'bi-gear', color: '#3b82f6' },
  { key: 'testing', label: 'Testing', icon: 'bi-bug', color: '#f59e0b' },
  { key: 'completed', label: 'Completed', icon: 'bi-check-circle', color: '#10b981' },
];

const PRIORITIES = ['low', 'medium', 'high'];
const CATEGORIES = ['office', 'own'];

export default function Board() {
  const [projects, setProjects] = useState([]);
  const [view, setView] = useState('kanban'); // 'kanban' | 'list'

  // filters
  const [projectFilter, setProjectFilter] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [category, setCategory] = useState('all');
  const [q, setQ] = useState('');

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = () => {
    fetch('/projects', { headers: { ...authHeaders() } })
      .then(r => r.json())
      .then(d => setProjects(d || []))
      .catch(() => setProjects([]));
  };

  const fetchTasks = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (status !== 'all') params.set('status', status);
    if (priority !== 'all') params.set('priority', priority);
    if (category !== 'all') params.set('category', category);
    if (projectFilter.trim()) params.set('project_name', projectFilter.trim());
    params.set('sort', 'updated_at');
    params.set('order', 'desc');
    fetch(`/tasks?${params.toString()}`, { headers: { ...authHeaders() } })
      .then(r => r.json())
      .then(d => { setTasks(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [q, status, priority, category, projectFilter]);

  useEffect(() => { fetchProjects(); }, []);
  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Listen to realtime refresh events
  useEffect(() => {
    const handler = () => fetchTasks();
    window.addEventListener('tasks:refresh', handler);
    return () => window.removeEventListener('tasks:refresh', handler);
  }, [fetchTasks]);

  const grouped = useMemo(() => {
    const map = new Map(STATUSES.map(s => [s.key, []]));
    for (const t of tasks) {
      let k = t.status;
      if (!map.has(k)) {
        // map legacy statuses
        if (k === 'pending') k = 'todo';
        else if (k === 'completed') k = 'done';
      }
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(t);
    }
    return map;
  }, [tasks]);

  // Create Task modal
  const [showCreate, setShowCreate] = useState(false);
  const [ctTitle, setCtTitle] = useState('');
  const [ctStatus, setCtStatus] = useState('learning');
  const [ctPriority, setCtPriority] = useState('medium');
  const [ctCategory, setCtCategory] = useState('office');
  const [ctDueDate, setCtDueDate] = useState('');
  const [ctDueTime, setCtDueTime] = useState('');
  const [ctProject, setCtProject] = useState('');

  const createTask = (e) => {
    e.preventDefault();
    if (!ctTitle.trim()) return;
    const body = {
      title: ctTitle.trim(),
      status: ctStatus,
      priority: ctPriority,
      category: ctCategory,
      due_date: ctDueDate || null,
      due_time: ctDueTime || null,
    };
    if (ctProject.trim()) body.project_name = ctProject.trim();
    fetch('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    })
      .then(r => r.json())
      .then(() => {
        setShowCreate(false);
        setCtTitle(''); setCtStatus('learning'); setCtPriority('medium'); setCtCategory('office'); setCtDueDate(''); setCtDueTime(''); setCtProject('');
        fetchTasks();
      })
      .catch(() => {});
  };

  const columns = STATUSES;

  // Drag and Drop functionality
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const dragCounter = useRef(0);


  // Drag and Drop handlers
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '';
    setDraggedTask(null);
    setDragOverColumn(null);
    dragCounter.current = 0;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, columnKey) => {
    e.preventDefault();
    dragCounter.current++;
    setDragOverColumn(columnKey);
  };

  const handleDragLeave = (e) => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragOverColumn(null);

    if (draggedTask && draggedTask.status !== targetStatus) {
      // Update task status
      fetch(`/tasks/${draggedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ status: targetStatus })
      }).then(() => {
        fetchTasks();
        // Show success feedback
        const event = new CustomEvent('task:moved', {
          detail: { task: draggedTask.title, from: draggedTask.status, to: targetStatus }
        });
        window.dispatchEvent(event);
      }).catch((error) => {
        console.error('Failed to move task:', error);
      });
    }

    setDraggedTask(null);
  };

  return (
    <div className="app-container board-page">
      <div className="board-toolbar d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="left">
          <div className="title" style={{textAlign:'left'}}>Task Board</div>
        </div>
        <div className="right">
          <input className="search-box form-control" placeholder="Search tasks..." value={q} onChange={e=>setQ(e.target.value)} />
          <div className="view-toggle">
            <button className={`btn ${view==='kanban' ? 'btn-primary' : 'btn-outline'}`} onClick={()=>setView('kanban')}>Kanban</button>
            <button className={`btn ${view==='list' ? 'btn-primary' : 'btn-outline'}`} onClick={()=>setView('list')}>List</button>
          </div>
          <button className="btn btn-success" onClick={()=>setShowCreate(true)}><i className="bi bi-plus-lg me-1"></i>Create Task</button>
        </div>
      </div>

      <div className="filter-bar card">
        <div className="row">
          <div className="form-group" style={{minWidth:180}}>
            <label>Project</label>
            <input
              type="text"
              className="form-control"
              value={projectFilter}
              onChange={e=>setProjectFilter(e.target.value)}
              placeholder="Filter by project..."
              list="filter-project-suggestions"
            />
            <datalist id="filter-project-suggestions">
              {Array.isArray(projects) ? projects.map(p => <option key={p.id} value={p.name}></option>) : null}
            </datalist>
          </div>
          <div className="form-group" style={{minWidth:180}}>
            <label>Status</label>
            <select
              className="select-adv"
              value={status}
              onChange={e=>setStatus(e.target.value)}
              onFocus={(e) => {
                if (window.innerWidth <= 768) {
                  e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
            >
              <option value="all">All Statuses</option>
              {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div className="form-group" style={{minWidth:160}}>
            <label>Priority</label>
            <select
              className="select-adv"
              value={priority}
              onChange={e=>setPriority(e.target.value)}
              onFocus={(e) => {
                if (window.innerWidth <= 768) {
                  e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
            >
              <option value="all">All Priorities</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group" style={{minWidth:160}}>
            <label>Category</label>
            <select
              className="select-adv"
              value={category}
              onChange={e=>setCategory(e.target.value)}
              onFocus={(e) => {
                if (window.innerWidth <= 768) {
                  e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="pillbar">
            {(q || status!=='all' || priority!=='all' || category!=='all' || projectFilter) && (
              <button className="btn btn-outline" onClick={()=>{ setQ(''); setStatus('all'); setPriority('all'); setCategory('all'); setProjectFilter(''); }}>Clear all</button>
            )}
          </div>
        </div>
      </div>

      {view === 'list' ? (
        <div className="card" style={{padding:12}}>
          <div className="board-table-container">
            <table className="board-table table table-hover align-middle">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Category</th>
                <th>Due</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6">Loading…</td></tr>
              ) : tasks.length === 0 ? (
                <tr><td colSpan="6" className="muted">No tasks</td></tr>
              ) : tasks.map(t => (
                <tr key={t.id} data-status={t.status}>
                  <td>{t.title}</td>
                  <td>{t.status}</td>
                  <td data-priority={t.priority} style={{textTransform:'capitalize'}}>{t.priority}</td>
                  <td data-category={t.category} style={{textTransform:'capitalize'}}>{t.category}</td>
                  <td>{t.due_date ? new Date(t.due_date).toLocaleDateString() : ''} {t.due_time ? t.due_time.slice(0,5) : ''}</td>
                  <td>{new Date(t.updated_at || t.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="kanban">
          {columns.map(col => {
            const list = grouped.get(col.key) || [];
            const isDragOver = dragOverColumn === col.key;
            return (
              <div
                key={col.key}
                className={`kanban-col card ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, col.key)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.key)}
              >
                <div className="kanban-head">
                  <div className="kanban-title">
                    {col.label}
                    {isDragOver && draggedTask && (
                      <i className="bi bi-arrow-down-circle-fill ms-2 drag-indicator"></i>
                    )}
                  </div>
                  <div className="badge">{list.length}</div>
                </div>
                <div className="kanban-list">
                  {loading ? (
                    <div className="muted">Loading…</div>
                  ) : list.length === 0 ? (
                    <div className={`muted ${isDragOver ? 'drag-target' : ''}`}>
                      {isDragOver ? 'Drop task here' : 'No tasks'}
                    </div>
                  ) : list.map(t => (
                    <div
                      key={t.id}
                      className={`task-card ${draggedTask?.id === t.id ? 'dragging' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, t)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="task-header">
                        <div className="t-title">{t.title}</div>
                        <div className="drag-handle">
                          <i className="bi bi-grip-vertical"></i>
                        </div>
                      </div>

                      {t.description && (
                        <div className="t-description">{t.description}</div>
                      )}

                      <div className="t-meta">
                        <div className="meta-row">
                          <span className={`pill priority-${t.priority}`}>{t.priority}</span>
                          <span className={`pill category-${t.category}`}>{t.category}</span>
                        </div>

                        {(t.due_date || t.due_time) && (
                          <div className="meta-row">
                            {t.due_date && <span className="due-date">
                              <i className="bi bi-calendar-event me-1"></i>
                              {new Date(t.due_date).toLocaleDateString()}
                            </span>}
                            {t.due_time && <span className="due-time">
                              <i className="bi bi-clock me-1"></i>
                              {t.due_time.slice(0,5)}
                            </span>}
                          </div>
                        )}


                        <div className="meta-row task-actions">
                          <div className="task-info">
                            <span className="task-id">#{t.id}</span>
                            <span className="updated-time" title={`Updated: ${new Date(t.updated_at || t.created_at).toLocaleString()}`}>
                              <i className="bi bi-clock-history me-1"></i>
                              {new Date(t.updated_at || t.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate ? (
        <div className="modal-overlay" onClick={()=>setShowCreate(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-head">
              <div className="title" style={{textAlign:'left'}}>Create Task</div>
            </div>
            <form className="form" onSubmit={createTask}>
              <div className="form-group">
                <label>Title</label>
                <input value={ctTitle} onChange={e=>setCtTitle(e.target.value)} placeholder="Task title" />
              </div>
              <div className="row">
                <div className="form-group" style={{minWidth:160}}>
                  <label>Status</label>
                  <select
                    className="select-adv"
                    value={ctStatus}
                    onChange={e=>setCtStatus(e.target.value)}
                    onFocus={(e) => {
                      if (window.innerWidth <= 768) {
                        setTimeout(() => {
                          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 100);
                      }
                    }}
                  >
                    {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{minWidth:140}}>
                  <label>Priority</label>
                  <select
                    className="select-adv"
                    value={ctPriority}
                    onChange={e=>setCtPriority(e.target.value)}
                    onFocus={(e) => {
                      if (window.innerWidth <= 768) {
                        setTimeout(() => {
                          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 100);
                      }
                    }}
                  >
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{minWidth:140}}>
                  <label>Category</label>
                  <select
                    className="select-adv"
                    value={ctCategory}
                    onChange={e=>setCtCategory(e.target.value)}
                    onFocus={(e) => {
                      if (window.innerWidth <= 768) {
                        setTimeout(() => {
                          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 100);
                      }
                    }}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{minWidth:160}}>
                  <label>Project</label>
                  <input
                    type="text"
                    value={ctProject}
                    onChange={e=>setCtProject(e.target.value)}
                    placeholder="Enter project name"
                    list="project-suggestions"
                  />
                  <datalist id="project-suggestions">
                    {Array.isArray(projects) ? projects.map(p => <option key={p.id} value={p.name}></option>) : null}
                  </datalist>
                </div>
              </div>
              <div className="row">
                <div className="form-group" style={{minWidth:160}}>
                  <label>Due date</label>
                  <input type="date" value={ctDueDate} onChange={e=>setCtDueDate(e.target.value)} />
                </div>
                <div className="form-group" style={{minWidth:160}}>
                  <label>Due time</label>
                  <input type="time" value={ctDueTime} onChange={e=>setCtDueTime(e.target.value)} />
                </div>
              </div>
              <div className="row" style={{justifyContent:'flex-end'}}>
                <button type="button" className="btn btn-outline" onClick={()=>setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
