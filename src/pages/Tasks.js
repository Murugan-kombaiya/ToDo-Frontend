import React, { useState, useEffect } from "react";
import "../App.css";

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState("own");

  const [filter, setFilter] = useState("all"); // all | pending | done
  const [priorityFilter, setPriorityFilter] = useState("all"); // all | low | medium | high
  const [categoryFilter, setCategoryFilter] = useState("all"); // all | office | own
  const [projectId, setProjectId] = useState('all'); // all | <projectId>
  const [search, setSearch] = useState("");
  // removed sort/order controls as per request

  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingPriority, setEditingPriority] = useState("medium");
  const [editingDueDate, setEditingDueDate] = useState("");
  const [editingCategory, setEditingCategory] = useState("own");

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("status", filter === "done" ? "done" : "pending");
    if (priorityFilter !== "all") params.set("priority", priorityFilter);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (projectId !== 'all') params.set('project_id', String(projectId));
    if (search.trim()) params.set("q", search.trim());
    // removed sort/order params to simplify filters

    setLoading(true);
    fetch(`/tasks?${params.toString()}`, { headers: { ...authHeaders() } })
      .then(res => res.json())
      .then(data => { setTasks(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [filter, priorityFilter, categoryFilter, projectId, search]);

  // Fetch projects for the Projects filter
  useEffect(() => {
    fetch('/projects', { headers: { ...authHeaders() } })
      .then(r => r.json())
      .then(d => setProjects(Array.isArray(d) ? d : []))
      .catch(() => setProjects([]));
  }, []);

  const addTask = () => {
    if (!title.trim()) return;
    fetch("/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ title, description, priority, category, due_date: dueDate || null }),
    })
      .then(res => res.json())
      .then(newTask => {
        setTasks([newTask, ...tasks]);
        setTitle("");
        setDescription("");
        setPriority("medium");
        setDueDate("");
        setCategory("own");
      })
      .catch(() => {/* noop */});
  };

  const updateTask = (id, updates) => {
    fetch(`/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(updates),
    })
      .then(res => res.json())
      .then((updated) => {
        setTasks(tasks.map(t => (t.id === id ? { ...t, ...updates, ...updated } : t)));
      })
      .catch(() => {/* noop */});
  };

  const deleteTask = (id) => {
    if (!window.confirm("Delete this task?")) return;
    fetch(`/tasks/${id}`, { method: "DELETE", headers: { ...authHeaders() } })
      .then(() => setTasks(tasks.filter(t => t.id !== id)))
      .catch(() => {/* noop */});
  };

  const startEditing = (task) => {
    setEditingId(task.id);
    setEditingTitle(task.title);
    setEditingDescription(task.description || "");
    setEditingPriority(task.priority || "medium");
    setEditingDueDate(task.due_date ? task.due_date.slice(0,10) : "");
    setEditingCategory(task.category || "own");
  };

  const saveEditing = (task) => {
    const newTitle = editingTitle.trim();
    if (!newTitle) {
      setEditingId(null);
      setEditingTitle("");
      return;
    }
    updateTask(task.id, { 
      title: newTitle,
      description: editingDescription,
      priority: editingPriority,
      category: editingCategory,
      due_date: editingDueDate || null,
    });
    setEditingId(null);
    setEditingTitle("");
    setEditingDescription("");
    setEditingPriority("medium");
    setEditingDueDate("");
    setEditingCategory("own");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle("");
    setEditingDescription("");
    setEditingPriority("medium");
    setEditingDueDate("");
    setEditingCategory("own");
  };

  const toggleStatus = (task) => {
    const next = task.status === "done" ? "pending" : "done";
    updateTask(task.id, { status: next });
  };

  const clearCompleted = () => {
    if (!window.confirm("Clear all completed tasks?")) return;
    fetch('/tasks/clear-completed', { method: 'POST', headers: { ...authHeaders() } })
      .then(() => setTasks(tasks.filter(t => t.status !== 'done')))
      .catch(() => {/* noop */});
  };

  const markAllDone = () => {
    if (!window.confirm("Mark all tasks as done?")) return;
    fetch('/tasks/mark-all-done', { method: 'POST', headers: { ...authHeaders() } })
      .then(() => setTasks(tasks.map(t => ({ ...t, status: 'done' }))))
      .catch(() => {/* noop */});
  };

  return (
    <div className="app-container task-page">
      <div className="task-header">
        <h1 className="title">Task List</h1>
        <button className="btn btn-primary add-task-btn" onClick={() => document.getElementById('add-task-form').scrollIntoView({ behavior: 'smooth' })}>
          <i className="bi bi-plus-circle"></i> Add New Task
        </button>
      </div>
      <div className="card" style={{padding:12}}>
        <div id="add-task-form" className="input-section add-task-section">
          <div className="form-control-enhanced with-icon">
            <i className="input-icon bi bi-card-text" />
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder=" " />
            <label>Task title</label>
          </div>
          <div className="form-control-enhanced with-icon">
            <i className="input-icon bi bi-text-left" />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder=" " />
            <label>Description (optional)</label>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select className="select-adv" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="form-group">
            <label>Category</label>
            <select className="select-adv" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="own">Own</option>
              <option value="office">Office</option>
            </select>
          </div>
          <div className="form-control-enhanced with-icon">
            <i className="input-icon bi bi-calendar3" />
            <input className="form-control" type="date" placeholder=" " value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <label>Due date</label>
          </div>
          <button className="add-btn" onClick={addTask}>
            <i className="bi bi-plus-lg"></i> Add Task
          </button>
        </div>
      </div>
      <div className="card controls">
        <input
          className="search-input form-control"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks..."
        />
        <div className="filters">
          <div className="btn-group" role="group" aria-label="Status filters">
            <button className={`btn ${filter === "all" ? "btn-primary" : "btn-outline"}`} onClick={() => setFilter("all")}>All Statuses</button>
            <button className={`btn ${filter === "pending" ? "btn-primary" : "btn-outline"}`} onClick={() => setFilter("pending")}>Active</button>
            <button className={`btn ${filter === "done" ? "btn-primary" : "btn-outline"}`} onClick={() => setFilter("done")}>Done</button>
          </div>
          <select className="select-adv" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} title="Priorities">
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select className="select-adv" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} title="Categories">
            <option value="all">All Categories</option>
            <option value="office">Office</option>
            <option value="own">Own</option>
          </select>
          <select className="select-adv" value={projectId} onChange={(e) => setProjectId(e.target.value)} title="Projects">
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="bulk-actions">
          <button onClick={markAllDone} className="btn btn-success"><i className="bi bi-check2-all me-1"></i>Mark all done</button>
          <button onClick={clearCompleted} className="btn btn-danger"><i className="bi bi-trash3 me-1"></i>Clear completed</button>
        </div>
      </div>
      <div className="card task-list-wrap">
        <ul className="task-list">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="task-item task-card-enhanced">
                <div className="skeleton skeleton-title" style={{width:'40%'}} />
                <div className="skeleton skeleton-text" style={{width:'70%'}} />
                <div className="skeleton" style={{height:6, borderRadius:999, width:'60%'}} />
              </li>
            ))
          ) : tasks.map(task => (
            <li key={task.id} className={`task-item task-card-enhanced hover-lift ${task.priority ? 'priority-' + task.priority : ''}`}>
              <div className="task-main">
                {editingId === task.id ? (
                  <div className="edit-form">
                    <input
                      className="edit-input form-control"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEditing(task);
                        if (e.key === 'Escape') cancelEditing();
                      }}
                      autoFocus
                      placeholder="Title"
                    />
                    <input
                      className="edit-input form-control"
                      value={editingDescription}
                      onChange={(e) => setEditingDescription(e.target.value)}
                      placeholder="Description"
                    />
                    <select className="select-adv" value={editingPriority} onChange={(e) => setEditingPriority(e.target.value)}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <select className="select-adv" value={editingCategory} onChange={(e) => setEditingCategory(e.target.value)}>
                      <option value="own">Own</option>
                      <option value="office">Office</option>
                    </select>
                    <input className="form-control" type="date" value={editingDueDate} onChange={(e) => setEditingDueDate(e.target.value)} />
                  </div>
                ) : (
                  <div
                    className={`task-text ${task.status === "done" ? "task-done" : ""}`}
                    onDoubleClick={() => startEditing(task)}
                    title="Double-click to edit"
                  >
                    <div className="task-title">
                      <span className={`status-indicator ${task.status === 'done' ? 'done' : 'todo'}`} />
                      {task.title}
                      {task.priority ? <span className={`pill ${task.priority}`}>{task.priority}</span> : null}
                      {task.category ? <span className={`pill ${task.category}`}>{task.category}</span> : null}
                      {task.due_date ? <span className={`due ${new Date(task.due_date) < new Date() && task.status !== 'done' ? 'overdue' : ''}`}><i className="bi bi-clock me-1"></i>Due: {new Date(task.due_date).toLocaleDateString()}</span> : null}
                    </div>
                    {task.description ? <div className="task-desc">{task.description}</div> : null}
                  </div>
                )}
              </div>
              <div className="actions">
                {editingId === task.id ? (
                  <>
                    <button onClick={() => saveEditing(task)} className="btn btn-success"><i className="bi bi-save me-1"></i>Save</button>
                    <button onClick={cancelEditing} className="btn btn-outline"><i className="bi bi-x-circle me-1"></i>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => toggleStatus(task)} className="btn btn-success" title="Mark Done"><i className="bi bi-check2-circle"></i></button>
                    <button onClick={() => startEditing(task)} className="btn btn-outline" title="Edit"><i className="bi bi-pencil"></i></button>
                    <button onClick={() => deleteTask(task.id)} className="btn btn-danger" title="Delete"><i className="bi bi-trash"></i></button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
