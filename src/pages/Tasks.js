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
        <button className="add-task-btn" onClick={() => document.getElementById('add-task-form').scrollIntoView({ behavior: 'smooth' })}>
          <i className="bi bi-plus-circle"></i> Add New Task
        </button>
      </div>
      <div className="card task-form-card">
        <div className="task-form-header">
          <h2 className="form-title">
            <i className="bi bi-plus-circle-fill"></i>
            Create New Task
          </h2>
          <p className="form-subtitle">Fill in the details below to add a new task to your list</p>
        </div>

        <form id="add-task-form" className="task-form" onSubmit={(e) => { e.preventDefault(); addTask(); }}>
          <div className="form-row">
            <div className="input-group">
              <div className="input-field">
                <i className="input-icon bi bi-card-text"></i>
                <input
                  type="text"
                  id="task-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder=" "
                  className="form-input"
                  required
                />
                <label htmlFor="task-title" className="form-label">Task Title</label>
              </div>
            </div>
            <div className="input-group">
              <div className="input-field">
                <i className="input-icon bi bi-text-paragraph"></i>
                <input
                  type="text"
                  id="task-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder=" "
                  className="form-input"
                />
                <label htmlFor="task-description" className="form-label">Description (Optional)</label>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label htmlFor="task-priority" className="select-label">Priority Level</label>
              <div className="select-wrapper">
                <i className="select-icon bi bi-flag-fill"></i>
                <select
                  id="task-priority"
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    minHeight: '48px',
                    padding: '0.75rem 2.5rem 0.75rem 3rem',
                    fontSize: '1rem',
                    borderRadius: '0.75rem',
                    border: '2px solid #e5e7eb',
                    background: '#ffffff',
                    boxSizing: 'border-box',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    appearance: 'none'
                  }}
                >
                  <option value="low">🟢 Low Priority</option>
                  <option value="medium">🟡 Medium Priority</option>
                  <option value="high">🔴 High Priority</option>
                </select>
              </div>
            </div>
            <div className="input-group">
              <label htmlFor="task-category" className="select-label">Category</label>
              <div className="select-wrapper">
                <i className="select-icon bi bi-tag-fill"></i>
                <select
                  id="task-category"
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    minHeight: '48px',
                    padding: '0.75rem 2.5rem 0.75rem 3rem',
                    fontSize: '1rem',
                    borderRadius: '0.75rem',
                    border: '2px solid #e5e7eb',
                    background: '#ffffff',
                    boxSizing: 'border-box',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    appearance: 'none'
                  }}
                >
                  <option value="own">👤 Personal</option>
                  <option value="office">🏢 Work/Office</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <div className="input-field">
                <i className="input-icon bi bi-calendar-event"></i>
                <input
                  type="date"
                  id="task-due-date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  placeholder=" "
                  className="form-input date-input"
                />
                <label htmlFor="task-due-date" className="form-label">Due Date (Optional)</label>
              </div>
            </div>
            <div className="input-group button-group">
              <button type="submit" className="submit-btn primary-btn" disabled={!title.trim()}>
                <i className="bi bi-check-circle-fill"></i>
                <span>Add Task</span>
              </button>
            </div>
          </div>
        </form>
      </div>
      <div className="card controls-card">
        <div className="controls-header">
          <h3 className="controls-title">
            <i className="bi bi-funnel-fill"></i>
            Filter & Search Tasks
          </h3>
        </div>

        <div className="controls-content">
          <div className="search-section">
            <div className="search-wrapper">
              <i className="search-icon bi bi-search"></i>
              <input
                type="text"
                className="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks by title or description..."
              />
              {search && (
                <button
                  className="clear-search"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <i className="bi bi-x-circle-fill"></i>
                </button>
              )}
            </div>
          </div>

          <div className="filters-section">
            <div className="filter-group">
              <label className="filter-label">Status</label>
              <div className="status-filters">
                <button
                  className={`filter-btn ${filter === "all" ? "active" : ""}`}
                  onClick={() => setFilter("all")}
                >
                  <i className="bi bi-list-ul"></i>
                  All Tasks
                </button>
                <button
                  className={`filter-btn ${filter === "pending" ? "active" : ""}`}
                  onClick={() => setFilter("pending")}
                >
                  <i className="bi bi-circle"></i>
                  Active
                </button>
                <button
                  className={`filter-btn ${filter === "done" ? "active" : ""}`}
                  onClick={() => setFilter("done")}
                >
                  <i className="bi bi-check-circle-fill"></i>
                  Completed
                </button>
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Priority</label>
              <div className="select-wrapper">
                <i className="select-icon bi bi-flag-fill"></i>
                <select
                  className="filter-select"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    minHeight: '44px',
                    padding: '0.75rem 2.5rem 0.75rem 3rem',
                    fontSize: '0.95rem',
                    borderRadius: '0.75rem',
                    border: '2px solid #e5e7eb',
                    background: '#ffffff',
                    boxSizing: 'border-box',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    appearance: 'none'
                  }}
                >
                  <option value="all">All Priorities</option>
                  <option value="high">🔴 High Priority</option>
                  <option value="medium">🟡 Medium Priority</option>
                  <option value="low">🟢 Low Priority</option>
                </select>
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Category</label>
              <div className="select-wrapper">
                <i className="select-icon bi bi-tag-fill"></i>
                <select
                  className="filter-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    minHeight: '44px',
                    padding: '0.75rem 2.5rem 0.75rem 3rem',
                    fontSize: '0.95rem',
                    borderRadius: '0.75rem',
                    border: '2px solid #e5e7eb',
                    background: '#ffffff',
                    boxSizing: 'border-box',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    appearance: 'none'
                  }}
                >
                  <option value="all">All Categories</option>
                  <option value="own">👤 Personal</option>
                  <option value="office">🏢 Work/Office</option>
                </select>
              </div>
            </div>

            {projects.length > 0 && (
              <div className="filter-group">
                <label className="filter-label">Project</label>
                <div className="select-wrapper">
                  <i className="select-icon bi bi-folder-fill"></i>
                  <select
                    className="filter-select"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    style={{
                      width: '100%',
                      maxWidth: '100%',
                      minHeight: '44px',
                      padding: '0.75rem 2.5rem 0.75rem 3rem',
                      fontSize: '0.95rem',
                      borderRadius: '0.75rem',
                      border: '2px solid #e5e7eb',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      appearance: 'none'
                    }}
                  >
                    <option value="all">All Projects</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="bulk-actions-section">
            <div className="bulk-actions">
              <button onClick={markAllDone} className="bulk-btn success-btn">
                <i className="bi bi-check2-all"></i>
                <span>Mark All Done</span>
              </button>
              <button onClick={clearCompleted} className="bulk-btn danger-btn">
                <i className="bi bi-trash3"></i>
                <span>Clear Completed</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="card task-list-card">
        <div className="task-list-header">
          <h3 className="list-title">
            <i className="bi bi-list-check"></i>
            Your Tasks ({tasks.length})
          </h3>
          {tasks.length > 0 && (
            <div className="list-stats">
              <span className="stat completed">
                <i className="bi bi-check-circle-fill"></i>
                {tasks.filter(t => t.status === 'done').length} Completed
              </span>
              <span className="stat pending">
                <i className="bi bi-circle"></i>
                {tasks.filter(t => t.status === 'pending').length} Pending
              </span>
            </div>
          )}
        </div>

        <div className="task-list-content">
          {loading ? (
            <div className="loading-tasks">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="task-skeleton">
                  <div className="skeleton-indicator"></div>
                  <div className="skeleton-content">
                    <div className="skeleton-title"></div>
                    <div className="skeleton-text"></div>
                    <div className="skeleton-meta"></div>
                  </div>
                  <div className="skeleton-actions">
                    <div className="skeleton-btn"></div>
                    <div className="skeleton-btn"></div>
                    <div className="skeleton-btn"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <i className="bi bi-list-check"></i>
              </div>
              <h4 className="empty-title">No tasks found</h4>
              <p className="empty-description">
                {search ?
                  `No tasks match "${search}". Try adjusting your search or filters.` :
                  "Start by creating your first task above!"
                }
              </p>
              {search && (
                <button className="empty-action" onClick={() => setSearch("")}>
                  <i className="bi bi-x-circle"></i>
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <ul className="task-list">
              {tasks.map(task => (
                <li key={task.id} className={`task-card ${task.status} priority-${task.priority || 'medium'}`}>
                  <div className="task-content">
                    {editingId === task.id ? (
                      <form className="task-edit-form" onSubmit={(e) => { e.preventDefault(); saveEditing(task); }}>
                        <div className="edit-row">
                          <div className="edit-field">
                            <input
                              type="text"
                              className="edit-input title-input"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              placeholder="Task title"
                              autoFocus
                              required
                            />
                          </div>
                          <div className="edit-field">
                            <input
                              type="text"
                              className="edit-input"
                              value={editingDescription}
                              onChange={(e) => setEditingDescription(e.target.value)}
                              placeholder="Description"
                            />
                          </div>
                        </div>
                        <div className="edit-row">
                          <div className="edit-field">
                            <select
                              className="edit-select"
                              value={editingPriority}
                              onChange={(e) => setEditingPriority(e.target.value)}
                            >
                              <option value="low">🟢 Low Priority</option>
                              <option value="medium">🟡 Medium Priority</option>
                              <option value="high">🔴 High Priority</option>
                            </select>
                          </div>
                          <div className="edit-field">
                            <select
                              className="edit-select"
                              value={editingCategory}
                              onChange={(e) => setEditingCategory(e.target.value)}
                            >
                              <option value="own">👤 Personal</option>
                              <option value="office">🏢 Work/Office</option>
                            </select>
                          </div>
                          <div className="edit-field">
                            <input
                              type="date"
                              className="edit-input"
                              value={editingDueDate}
                              onChange={(e) => setEditingDueDate(e.target.value)}
                            />
                          </div>
                        </div>
                      </form>
                    ) : (
                      <div
                        className="task-display"
                        onDoubleClick={() => startEditing(task)}
                        title="Double-click to edit"
                      >
                        <div className="task-header">
                          <div className="task-status">
                            <span className={`status-dot ${task.status}`}></span>
                          </div>
                          <div className="task-info">
                            <h4 className="task-title">{task.title}</h4>
                            {task.description && (
                              <p className="task-description">{task.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="task-meta">
                          <div className="task-badges">
                            {task.priority && (
                              <span className={`priority-badge ${task.priority}`}>
                                <i className="bi bi-flag-fill"></i>
                                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                              </span>
                            )}
                            {task.category && (
                              <span className={`category-badge ${task.category}`}>
                                <i className="bi bi-tag-fill"></i>
                                {task.category === 'own' ? 'Personal' : 'Work'}
                              </span>
                            )}
                            {task.due_date && (
                              <span className={`due-badge ${new Date(task.due_date) < new Date() && task.status !== 'done' ? 'overdue' : ''}`}>
                                <i className="bi bi-calendar-event"></i>
                                {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="task-actions">
                    {editingId === task.id ? (
                      <div className="edit-actions">
                        <button
                          type="button"
                          onClick={() => saveEditing(task)}
                          className="action-btn save-btn"
                          title="Save changes"
                        >
                          <i className="bi bi-check-lg"></i>
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="action-btn cancel-btn"
                          title="Cancel editing"
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </div>
                    ) : (
                      <div className="display-actions">
                        <button
                          onClick={() => toggleStatus(task)}
                          className={`action-btn ${task.status === 'done' ? 'undo-btn' : 'complete-btn'}`}
                          title={task.status === 'done' ? 'Mark as pending' : 'Mark as complete'}
                        >
                          <i className={`bi ${task.status === 'done' ? 'bi-arrow-counterclockwise' : 'bi-check-lg'}`}></i>
                        </button>
                        <button
                          onClick={() => startEditing(task)}
                          className="action-btn edit-btn"
                          title="Edit task"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="action-btn delete-btn"
                          title="Delete task"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
