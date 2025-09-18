import React, { useEffect, useMemo, useState, useCallback } from 'react';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const STATUSES = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'dev_completed', label: 'Dev Completed' },
  { key: 'pr_in_review', label: 'PR In Review' },
  { key: 'pr_merged', label: 'PR Merged' },
  { key: 'qa_deployed', label: 'QA Deployed' },
  { key: 'qa_testing_completed', label: 'QA Testing Completed' },
  { key: 'done', label: 'Done' },
];

const PRIORITIES = ['low', 'medium', 'high'];
const CATEGORIES = ['office', 'own'];

export default function Board() {
  const [projects, setProjects] = useState([]);
  const [view, setView] = useState('kanban'); // 'kanban' | 'list'

  // filters
  const [projectId, setProjectId] = useState('all');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [category, setCategory] = useState('all');
  const [q, setQ] = useState('');
  const [importantOnly, setImportantOnly] = useState(false);

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
    if (projectId !== 'all') params.set('project_id', String(projectId));
    if (importantOnly) params.set('important', 'true');
    params.set('sort', 'updated_at');
    params.set('order', 'desc');
    fetch(`/tasks?${params.toString()}`, { headers: { ...authHeaders() } })
      .then(r => r.json())
      .then(d => { setTasks(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [q, status, priority, category, projectId, importantOnly]);

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
  const [ctStatus, setCtStatus] = useState('todo');
  const [ctPriority, setCtPriority] = useState('medium');
  const [ctCategory, setCtCategory] = useState('office');
  const [ctDueDate, setCtDueDate] = useState('');
  const [ctDueTime, setCtDueTime] = useState('');
  const [ctProject, setCtProject] = useState('all');
  const [ctImportant, setCtImportant] = useState(false);

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
      important: ctImportant,
    };
    if (ctProject !== 'all') body.project_id = Number(ctProject);
    fetch('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    })
      .then(r => r.json())
      .then(() => {
        setShowCreate(false);
        setCtTitle(''); setCtStatus('todo'); setCtPriority('medium'); setCtCategory('office'); setCtDueDate(''); setCtDueTime(''); setCtProject('all'); setCtImportant(false);
        fetchTasks();
      })
      .catch(() => {});
  };

  const columns = STATUSES;

  const toggleImportant = (task) => {
    fetch(`/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ important: !task.important })
    }).then(()=> fetchTasks()).catch(()=>{});
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
            <select className="select-adv" value={projectId} onChange={e=>setProjectId(e.target.value)}>
              <option value="all">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{minWidth:180}}>
            <label>Status</label>
            <select className="select-adv" value={status} onChange={e=>setStatus(e.target.value)}>
              <option value="all">All Statuses</option>
              {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div className="form-group" style={{minWidth:160}}>
            <label>Priority</label>
            <select className="select-adv" value={priority} onChange={e=>setPriority(e.target.value)}>
              <option value="all">All Priorities</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group" style={{minWidth:160}}>
            <label>Category</label>
            <select className="select-adv" value={category} onChange={e=>setCategory(e.target.value)}>
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="pillbar">
            <span className="pill soft">Assignee: Me</span>
            <button type="button" className={`chip ${importantOnly ? 'active' : ''}`} onClick={()=>setImportantOnly(v=>!v)}>
              ★ Important
            </button>
            {(q || status!=='all' || priority!=='all' || category!=='all' || projectId!=='all') && (
              <button className="btn btn-outline" onClick={()=>{ setQ(''); setStatus('all'); setPriority('all'); setCategory('all'); setProjectId('all'); setImportantOnly(false); }}>Clear all</button>
            )}
          </div>
        </div>
      </div>

      {view === 'list' ? (
        <div className="card" style={{padding:12}}>
          <table className="board-table table table-hover align-middle">
            <thead>
              <tr>
                <th style={{width:40}}><i className="bi bi-star"></i></th>
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
                <tr><td colSpan="7">Loading…</td></tr>
              ) : tasks.length === 0 ? (
                <tr><td colSpan="7" className="muted">No tasks</td></tr>
              ) : tasks.map(t => (
                <tr key={t.id}>
                  <td>
                    <button className={`star-btn btn btn-link p-0 ${t.important ? 'active' : ''}`} onClick={()=>toggleImportant(t)} title="Toggle important">
                      <i className={`bi ${t.important ? 'bi-star-fill text-warning' : 'bi-star'}`}></i>
                    </button>
                  </td>
                  <td>{t.title}</td>
                  <td>{t.status}</td>
                  <td style={{textTransform:'capitalize'}}>{t.priority}</td>
                  <td style={{textTransform:'capitalize'}}>{t.category}</td>
                  <td>{t.due_date ? new Date(t.due_date).toLocaleDateString() : ''} {t.due_time ? t.due_time.slice(0,5) : ''}</td>
                  <td>{new Date(t.updated_at || t.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="kanban">
          {columns.map(col => {
            const list = grouped.get(col.key) || [];
            return (
              <div key={col.key} className="kanban-col card">
                <div className="kanban-head">
                  <div className="kanban-title">{col.label}</div>
                  <div className="badge">{list.length}</div>
                </div>
                <div className="kanban-list">
                  {loading ? (
                    <div className="muted">Loading…</div>
                  ) : list.length === 0 ? (
                    <div className="muted">No tasks</div>
                  ) : list.map(t => (
                    <div key={t.id} className="task-card">
                      <div className="t-title">{t.title}</div>
                      <div className="t-meta">
                        <span className={`pill ${t.priority}`}>{t.priority}</span>
                        <span className={`pill ${t.category}`}>{t.category}</span>
                        {t.due_date ? <span className="due">{new Date(t.due_date).toLocaleDateString()}</span> : null}
                        {t.due_time ? <span className="due">{t.due_time.slice(0,5)}</span> : null}
                        <button className={`star-btn btn btn-link p-0 ${t.important ? 'active' : ''}`} onClick={()=>toggleImportant(t)} title="Toggle important">
                          <i className={`bi ${t.important ? 'bi-star-fill text-warning' : 'bi-star'}`}></i>
                        </button>
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
                  <select className="select-adv" value={ctStatus} onChange={e=>setCtStatus(e.target.value)}>
                    {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{minWidth:140}}>
                  <label>Priority</label>
                  <select className="select-adv" value={ctPriority} onChange={e=>setCtPriority(e.target.value)}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{minWidth:140}}>
                  <label>Category</label>
                  <select className="select-adv" value={ctCategory} onChange={e=>setCtCategory(e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{minWidth:160}}>
                  <label>Project</label>
                  <select className="select-adv" value={ctProject} onChange={e=>setCtProject(e.target.value)}>
                    <option value="all">None</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
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
                <div className="form-group" style={{minWidth:140}}>
                  <label>Important</label>
                  <input type="checkbox" checked={ctImportant} onChange={e=>setCtImportant(e.target.checked)} />
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
