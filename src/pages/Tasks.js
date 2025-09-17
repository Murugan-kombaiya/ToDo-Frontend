import React, { useState, useEffect } from "react";
import "../App.css";

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");

  const [filter, setFilter] = useState("all"); // all | pending | done
  const [priorityFilter, setPriorityFilter] = useState("all"); // all | low | medium | high
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("id");
  const [order, setOrder] = useState("asc");

  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingPriority, setEditingPriority] = useState("medium");
  const [editingDueDate, setEditingDueDate] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("status", filter === "done" ? "done" : "pending");
    if (priorityFilter !== "all") params.set("priority", priorityFilter);
    if (search.trim()) params.set("q", search.trim());
    params.set("sort", sort);
    params.set("order", order);

    fetch(`/tasks?${params.toString()}`, { headers: { ...authHeaders() } })
      .then(res => res.json())
      .then(data => setTasks(data))
      .catch(() => {/* noop */});
  }, [filter, priorityFilter, search, sort, order]);

  const addTask = () => {
    if (!title.trim()) return;
    fetch("/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ title, description, priority, due_date: dueDate || null }),
    })
      .then(res => res.json())
      .then(newTask => {
        setTasks([newTask, ...tasks]);
        setTitle("");
        setDescription("");
        setPriority("medium");
        setDueDate("");
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
      due_date: editingDueDate || null,
    });
    setEditingId(null);
    setEditingTitle("");
    setEditingDescription("");
    setEditingPriority("medium");
    setEditingDueDate("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle("");
    setEditingDescription("");
    setEditingPriority("medium");
    setEditingDueDate("");
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
    <div className="app-container">
      <h2 className="title">📝 Todo App</h2>
      <div className="input-section">
        <input 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="Enter new task..." 
        />
        <input 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <button onClick={addTask} className="add-btn">Add</button>
      </div>
      <div className="controls">
        <input
          className="search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks..."
        />
        <div className="filters">
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All</button>
          <button className={filter === "pending" ? "active" : ""} onClick={() => setFilter("pending")}>Active</button>
          <button className={filter === "done" ? "active" : ""} onClick={() => setFilter("done")}>Done</button>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="all">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="id">Sort: Created</option>
            <option value="title">Title</option>
            <option value="status">Status</option>
            <option value="priority">Priority</option>
            <option value="due_date">Due date</option>
            <option value="updated_at">Updated</option>
          </select>
          <select value={order} onChange={(e) => setOrder(e.target.value)}>
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
        </div>
        <div className="bulk-actions">
          <button onClick={markAllDone} className="done-btn">Mark all done</button>
          <button onClick={clearCompleted} className="delete-btn">Clear completed</button>
        </div>
      </div>
      <ul className="task-list">
        {tasks.map(task => (
          <li key={task.id} className="task-item">
            <div className="task-main">
              {editingId === task.id ? (
                <div className="edit-form">
                  <input
                    className="edit-input"
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
                    className="edit-input"
                    value={editingDescription}
                    onChange={(e) => setEditingDescription(e.target.value)}
                    placeholder="Description"
                  />
                  <select value={editingPriority} onChange={(e) => setEditingPriority(e.target.value)}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <input type="date" value={editingDueDate} onChange={(e) => setEditingDueDate(e.target.value)} />
                </div>
              ) : (
                <div
                  className={`task-text ${task.status === "done" ? "task-done" : ""}`}
                  onDoubleClick={() => startEditing(task)}
                  title="Double-click to edit"
                >
                  <div className="task-title">
                    {task.title}
                    {task.priority ? <span className={`pill ${task.priority}`}>{task.priority}</span> : null}
                    {task.due_date ? <span className={`due ${new Date(task.due_date) < new Date() && task.status !== 'done' ? 'overdue' : ''}`}>Due: {new Date(task.due_date).toLocaleDateString()}</span> : null}
                  </div>
                  {task.description ? <div className="task-desc">{task.description}</div> : null}
                </div>
              )}
            </div>
            <div className="actions">
              {editingId === task.id ? (
                <>
                  <button onClick={() => saveEditing(task)} className="done-btn">Save</button>
                  <button onClick={cancelEditing} className="delete-btn">Cancel</button>
                </>
              ) : (
                <>
                  <button onClick={() => toggleStatus(task)} className="done-btn">✔</button>
                  <button onClick={() => startEditing(task)} className="edit-btn">Edit</button>
                  <button onClick={() => deleteTask(task.id)} className="delete-btn">✖</button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
