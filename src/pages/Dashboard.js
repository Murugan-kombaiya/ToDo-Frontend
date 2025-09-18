import React, { useEffect, useMemo, useState } from 'react';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function Dashboard() {
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

  const fetchOverview = () => {
    setLoading(true);
    setError('');
    fetch('/dashboard/overview', { headers: { ...authHeaders() } })
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError('Failed to load'); setLoading(false); });
  };

  useEffect(() => { fetchOverview(); }, []);

  const addQuickTask = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    fetch('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ title: title.trim(), priority, type, due_date: dueDate || null, due_time: dueTime || null })
    })
      .then(res => res.json())
      .then(() => {
        setTitle('');
        setPriority('medium');
        setType('work');
        setDueDate('');
        setDueTime('');
        fetchOverview();
      })
      .catch(() => {});
  };

  const toggleTask = (task) => {
    const next = task.status === 'done' ? 'pending' : 'done';
    fetch(`/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ status: next })
    })
      .then(() => fetchOverview())
      .catch(() => {});
  };

  const [workHours, setWorkHours] = useState('');
  const [learnHours, setLearnHours] = useState('');
  const submitHours = (e) => {
    e.preventDefault();
    const todayISO = new Date().toISOString().slice(0,10);
    const reqs = [];
    if (workHours) reqs.push(fetch('/time-logs', { method:'POST', headers:{ 'Content-Type':'application/json', ...authHeaders() }, body: JSON.stringify({ day: todayISO, category:'work', minutes: Math.round(Number(workHours)*60) }) }));
    if (learnHours) reqs.push(fetch('/time-logs', { method:'POST', headers:{ 'Content-Type':'application/json', ...authHeaders() }, body: JSON.stringify({ day: todayISO, category:'learning', minutes: Math.round(Number(learnHours)*60) }) }));
    Promise.all(reqs).then(()=>{ setWorkHours(''); setLearnHours(''); fetchOverview(); }).catch(()=>{});
  };

  return (
    <div className="app-container dash">
      <div className="dash-header">
        <div>
          <h2 className="title" style={{textAlign:'left'}}>Task Dashboard</h2>
          <div className="muted">{todayStr}</div>
        </div>
        <a href="#quick-add" className="btn btn-primary">+ Quick Add</a>
      </div>

      <form id="quick-add" className="quick-add card" onSubmit={addQuickTask}>
        <div className="row">
          <input placeholder="Task title" value={title} onChange={e=>setTitle(e.target.value)} />
          <select value={priority} onChange={e=>setPriority(e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select value={type} onChange={e=>setType(e.target.value)}>
            <option value="work">Work</option>
            <option value="learning">Learning</option>
          </select>
          <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} />
          <input type="time" value={dueTime} onChange={e=>setDueTime(e.target.value)} />
          <button type="submit" className="btn btn-success">Add</button>
        </div>
      </form>

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-error">{error}</div>
      ) : data ? (
        <>
          <div className="stats-grid">
            <div className="stat card">
              <div className="stat-title">Today Tasks</div>
              <div className="stat-value">{data.tasksToday.total}</div>
              <div className="stat-sub">{data.tasksToday.done} done / {data.tasksToday.pending} pending</div>
              <div className="progress"><div className="bar" style={{width: `${data.tasksToday.goalPercent}%`}} /></div>
            </div>
            <div className="stat card">
              <div className="stat-title">Projects (Office)</div>
              <div className="stat-value">{data.projects.office}</div>
            </div>
            <div className="stat card">
              <div className="stat-title">Projects (Personal)</div>
              <div className="stat-value">{data.projects.personal}</div>
            </div>
            <div className="stat card">
              <div className="stat-title">Overdue</div>
              <div className="stat-value" style={{color:'#e11d48'}}>{data.overdue}</div>
            </div>
            <div className="stat card">
              <div className="stat-title">Hours (Work)</div>
              <div className="stat-value">{(data.time.workMinutes/60).toFixed(1)} h</div>
            </div>
            <div className="stat card">
              <div className="stat-title">Hours (Learning)</div>
              <div className="stat-value">{(data.time.learningMinutes/60).toFixed(1)} h</div>
            </div>
          </div>

          <form className="hours card" onSubmit={submitHours}>
            <div className="hours-title">Quick Log Hours (Today)</div>
            <div className="row">
              <div className="form-group" style={{minWidth:120}}>
                <label>Work (hrs)</label>
                <input type="number" step="0.5" min="0" value={workHours} onChange={e=>setWorkHours(e.target.value)} />
              </div>
              <div className="form-group" style={{minWidth:140}}>
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
                {data.lists.work.length === 0 ? (
                  <li className="muted">No tasks — add above</li>
                ) : data.lists.work.map(t => (
                  <li key={t.id} className="board-item">
                    <div className="row-between">
                      <div className="b-title">{t.title}</div>
                      <div className="b-meta">
                        <span className={`pill ${t.priority}`}>{t.priority}</span>
                        {t.due_date ? <span className="due">{new Date(t.due_date).toLocaleDateString()}</span> : null}
                        {t.due_time ? <span className="due">{t.due_time.slice(0,5)}</span> : null}
                        <button className={`btn ${t.status==='done'?'btn-success':'btn-outline'}`} onClick={()=>toggleTask(t)}>
                          {t.status==='done' ? 'Done' : 'Mark Done'}
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
                {data.lists.learning.length === 0 ? (
                  <li className="muted">No tasks — add above</li>
                ) : data.lists.learning.map(t => (
                  <li key={t.id} className="board-item">
                    <div className="row-between">
                      <div className="b-title">{t.title}</div>
                      <div className="b-meta">
                        <span className={`pill ${t.priority}`}>{t.priority}</span>
                        {t.due_date ? <span className="due">{new Date(t.due_date).toLocaleDateString()}</span> : null}
                        {t.due_time ? <span className="due">{t.due_time.slice(0,5)}</span> : null}
                        <button className={`btn ${t.status==='done'?'btn-success':'btn-outline'}`} onClick={()=>toggleTask(t)}>
                          {t.status==='done' ? 'Done' : 'Mark Done'}
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
