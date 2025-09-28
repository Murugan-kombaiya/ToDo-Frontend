import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { authenticatedFetch } from '../utils/authUtils';
import '../styles/dashboard.css';

export default function Dashboard() {
  const { toggleTheme, isDark } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [type, setType] = useState('work');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');

  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
  }, []);

  const fetchOverview = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authenticatedFetch('/dashboard/overview');
      if (response.ok) {
        const d = await response.json();
        setData(d);
      } else {
        setError('Failed to load');
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setError('Failed to load');
    }
    setLoading(false);
  };

  useEffect(() => { fetchOverview(); }, []);

  const addQuickTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const response = await authenticatedFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), priority, type, due_date: dueDate || null, due_time: dueTime || null })
      });
      if (response.ok) {
        setTitle('');
        setPriority('medium');
        setType('work');
        setDueDate('');
        setDueTime('');
        fetchOverview();
      }
    } catch (error) {
      console.error('Add task error:', error);
    }
  };

  const toggleTask = async (task) => {
    const next = task.status === 'completed' ? 'learning' : 'completed';
    try {
      const response = await authenticatedFetch(`/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: next })
      });
      if (response.ok) {
        fetchOverview();
      }
    } catch (error) {
      console.error('Toggle task error:', error);
    }
  };

  const [workHours, setWorkHours] = useState('');
  const [learnHours, setLearnHours] = useState('');
  const submitHours = async (e) => {
    e.preventDefault();
    const todayISO = new Date().toISOString().slice(0,10);
    const reqs = [];
    if (workHours) reqs.push(authenticatedFetch('/time-logs', { method:'POST', body: JSON.stringify({ day: todayISO, category:'work', minutes: Math.round(Number(workHours)*60) }) }));
    if (learnHours) reqs.push(authenticatedFetch('/time-logs', { method:'POST', body: JSON.stringify({ day: todayISO, category:'learning', minutes: Math.round(Number(learnHours)*60) }) }));
    try {
      await Promise.all(reqs);
      setWorkHours('');
      setLearnHours('');
      fetchOverview();
    } catch (error) {
      console.error('Submit hours error:', error);
    }
  };

  return (
    <div className="app-container dash">
      <div className="dash-header">
        <div>
          <h2 className="title title-left">Task Dashboard</h2>
          <div className="muted">{todayStr}</div>
        </div>
        <div className="dash-header-actions">
          <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle dark mode">
            <i className={`bi ${isDark ? 'bi-sun-fill' : 'bi-moon-fill'}`}></i>
          </button>
          <a href="#quick-add" className="btn btn-primary">+ Quick Add</a>
        </div>
      </div>

      <form id="quick-add" className="quick-add card hover-lift" onSubmit={addQuickTask}>
        <div className="row">
          <div className="form-control-enhanced with-icon form-input-min-200">
            <i className="input-icon bi bi-card-text" />
            <input placeholder=" " value={title} onChange={e=>setTitle(e.target.value)} />
            <label>Task title</label>
          </div>
          <div className="form-group form-input-min-140">
            <label>Priority</label>
            <select className="select-adv" value={priority} onChange={e=>setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="form-group form-input-min-140">
            <label>Type</label>
            <select className="select-adv" value={type} onChange={e=>setType(e.target.value)}>
              <option value="work">Work</option>
              <option value="learning">Learning</option>
            </select>
          </div>
          <div className="form-control-enhanced with-icon form-input-min-160">
            <i className="input-icon bi bi-calendar3" />
            <input type="date" placeholder=" " value={dueDate} onChange={e=>setDueDate(e.target.value)} />
            <label>Due date</label>
          </div>
          <div className="form-control-enhanced with-icon form-input-min-140">
            <i className="input-icon bi bi-clock" />
            <input type="time" placeholder=" " value={dueTime} onChange={e=>setDueTime(e.target.value)} />
            <label>Due time</label>
          </div>
          <button type="submit" className="btn btn-gradient-success ripple">
            <i className="bi bi-plus-lg me-1" /> Add
          </button>
        </div>
      </form>

      {loading ? (
        <>
          <div className="stats-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="stat card widget stat-card-pattern">
                <div className="skeleton skeleton-title skeleton-width-50" />
                <div className="skeleton skeleton-height-32" />
                <div className="skeleton skeleton-text skeleton-width-60" />
                <div className="skeleton skeleton-height-6" />
              </div>
            ))}
          </div>
          <div className="boards">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="board card hover-lift">
                <div className="skeleton skeleton-title skeleton-width-30" />
                <ul className="board-list">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <li key={j} className="board-item">
                      <div className="skeleton skeleton-text skeleton-width-70" />
                      <div className="skeleton skeleton-height-12" />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      ) : error ? (
        <div className="text-error">{error}</div>
      ) : data ? (
        <>
          <div className="stats-grid">
            <div className="stat card widget stat-card-pattern hover-lift">
              <div className="stat-title">Today Tasks</div>
              <div className="stat-value widget-value">{data.tasksToday?.total || 0}</div>
              <div className="stat-sub widget-label">{data.tasksToday?.completed || 0} completed / {(data.tasksToday?.total || 0) - (data.tasksToday?.completed || 0)} in progress</div>
              <div className="completion-progress">
                <div className="progress-label">Completion: {data.tasksToday?.goalPercent || 0}%</div>
                <div className="progress"><div className="bar" style={{width: `${data.tasksToday?.goalPercent || 0}%`}} /></div>
              </div>
              <i className="ti ti-checklist widget-icon"></i>
            </div>
            <div className="stat card widget hover-lift">
              <div className="stat-title">Learning</div>
              <div className="stat-value widget-value">{data.tasksToday?.learning || 0}</div>
              <div className="stat-sub widget-label">Tasks in learning phase</div>
              <i className="bi bi-book widget-icon"></i>
            </div>
            <div className="stat card widget hover-lift">
              <div className="stat-title">Working</div>
              <div className="stat-value widget-value">{data.tasksToday?.working || 0}</div>
              <div className="stat-sub widget-label">Tasks in progress</div>
              <i className="bi bi-gear widget-icon"></i>
            </div>
            <div className="stat card widget hover-lift">
              <div className="stat-title">Testing</div>
              <div className="stat-value widget-value">{data.tasksToday?.testing || 0}</div>
              <div className="stat-sub widget-label">Tasks under review</div>
              <i className="bi bi-bug widget-icon"></i>
            </div>
            <div className="stat card widget hover-lift">
              <div className="stat-title">Completed</div>
              <div className="stat-value widget-value" style={{color:'#22c55e'}}>{data.tasksToday?.completed || 0}</div>
              <div className="stat-sub widget-label">Finished tasks</div>
              <i className="bi bi-check-circle widget-icon"></i>
            </div>
            <div className="stat card widget hover-lift">
              <div className="stat-title">Overdue</div>
              <div className="stat-value widget-value" style={{color:'#e11d48'}}>{data.overdue || 0}</div>
              <div className="stat-sub widget-label">Tasks past due date</div>
              <i className="ti ti-alert-circle widget-icon"></i>
            </div>
          </div>

          <form className="hours card hover-lift" onSubmit={submitHours}>
            <div className="hours-title">Quick Log Hours (Today)</div>
            <div className="row">
              <div className="form-group form-input-min-120">
                <label>Work (hrs)</label>
                <input type="number" step="0.5" min="0" value={workHours} onChange={e=>setWorkHours(e.target.value)} />
              </div>
              <div className="form-group form-input-min-140">
                <label>Learning (hrs)</label>
                <input type="number" step="0.5" min="0" value={learnHours} onChange={e=>setLearnHours(e.target.value)} />
              </div>
              <div style={{alignSelf:'end'}}>
                <button className="btn btn-primary" type="submit">Save</button>
              </div>
            </div>
          </form>

          <div className="boards">
            <div className="board card">
              <div className="board-title">Work Tasks</div>
              <ul className="board-list">
                {!data.lists?.work || data.lists.work.length === 0 ? (
                  <li className="muted">No tasks — add above</li>
                ) : data.lists.work.map(t => (
                  <li key={t.id} className="board-item">
                    <div className="row-between">
                      <div className="b-title">{t.title}</div>
                      <div className="b-meta">
                        <span className={`pill ${t.priority}`}>{t.priority}</span>
                        {t.due_date ? <span className="due">{new Date(t.due_date).toLocaleDateString()}</span> : null}
                        {t.due_time ? <span className="due">{t.due_time.slice(0,5)}</span> : null}
                        <button className={`btn ${t.status==='completed'?'btn-success':'btn-outline'}`} onClick={()=>toggleTask(t)}>
                          {t.status==='completed' ? 'Completed' : 'Mark Complete'}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="board card">
              <div className="board-title">Learning Tasks</div>
              <ul className="board-list">
                {!data.lists?.learning || data.lists.learning.length === 0 ? (
                  <li className="muted">No tasks — add above</li>
                ) : data.lists.learning.map(t => (
                  <li key={t.id} className="board-item">
                    <div className="row-between">
                      <div className="b-title">{t.title}</div>
                      <div className="b-meta">
                        <span className={`pill ${t.priority}`}>{t.priority}</span>
                        {t.due_date ? <span className="due">{new Date(t.due_date).toLocaleDateString()}</span> : null}
                        {t.due_time ? <span className="due">{t.due_time.slice(0,5)}</span> : null}
                        <button className={`btn ${t.status==='completed'?'btn-success':'btn-outline'}`} onClick={()=>toggleTask(t)}>
                          {t.status==='completed' ? 'Completed' : 'Mark Complete'}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
