import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import '../styles/TimeTracker.css';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function TimeTracker() {
  const [sessions, setSessions] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionType, setSessionType] = useState('work');
  const [sessionDescription, setSessionDescription] = useState('');
  const [filter, setFilter] = useState('today');

  // Timer effect
  useEffect(() => {
    let interval;
    if (isTracking && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  // Fetch sessions
  const fetchSessions = useCallback(() => {
    fetch('/time-sessions', {
      headers: { ...authHeaders() }
    })
      .then(response => response.json())
      .then(data => {
        setSessions(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        toast.error('Failed to fetch time sessions');
      });
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Start tracking
  const startTracking = () => {
    if (!sessionDescription.trim()) {
      toast.warning('Please enter a description');
      return;
    }

    const now = new Date();
    setStartTime(now.getTime());
    setCurrentSession({
      id: Date.now(),
      type: sessionType,
      description: sessionDescription.trim(),
      startTime: now.toISOString(),
      isActive: true
    });
    setIsTracking(true);
    toast.success('Started tracking time!');
  };

  // Stop tracking
  const stopTracking = () => {
    if (!currentSession || !startTime) return;

    const endTime = new Date();
    const totalTime = Math.floor((endTime.getTime() - startTime) / 1000);

    const completedSession = {
      ...currentSession,
      endTime: endTime.toISOString(),
      duration: totalTime,
      isActive: false
    };

    // Save to backend
    fetch('/time-sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      },
      body: JSON.stringify({
        type: sessionType,
        description: sessionDescription.trim(),
        startTime: currentSession.startTime,
        endTime: completedSession.endTime,
        duration: totalTime
      })
    })
      .then(() => {
        fetchSessions();
        setIsTracking(false);
        setCurrentSession(null);
        setStartTime(null);
        setElapsedTime(0);
        setSessionDescription('');
        toast.success('Time session saved!');
      })
      .catch(() => {
        toast.error('Failed to save time session');
      });
  };

  // Format time
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter sessions
  const getFilteredSessions = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return sessions.filter(session => {
      const sessionDate = new Date(session.startTime);

      switch (filter) {
        case 'today':
          return sessionDate >= today;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return sessionDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
          return sessionDate >= monthAgo;
        default:
          return true;
      }
    });
  };

  // Calculate statistics
  const calculateStats = () => {
    const filteredSessions = getFilteredSessions();
    const totalSeconds = filteredSessions.reduce((sum, session) => sum + (session.duration || 0), 0);

    const typeStats = filteredSessions.reduce((stats, session) => {
      const type = session.type || 'work';
      if (!stats[type]) stats[type] = 0;
      stats[type] += session.duration || 0;
      return stats;
    }, {});

    return {
      totalSessions: filteredSessions.length,
      totalTime: totalSeconds,
      averageSession: filteredSessions.length > 0 ? totalSeconds / filteredSessions.length : 0,
      typeBreakdown: typeStats
    };
  };

  const stats = calculateStats();

  return (
    <div className="app-container time-tracker-page">
      <div className="time-tracker-header">
        <h1 className="title">
          <i className="bi bi-clock-history me-2"></i>
          Time Tracker
        </h1>
        <p className="subtitle">Track your work, study, and productivity time</p>
      </div>

      <div className="time-tracker-content">
        {/* Current Session Tracker */}
        <div className="tracker-section">
          <div className="card">
            <div className="card-body">
              <h3 className="section-title">
                <i className="bi bi-play-circle me-2"></i>
                Current Session
              </h3>

              <div className="session-form">
                <div className="row g-3">
                  <div className="col-md-4">
                    <select
                      className="form-select"
                      value={sessionType}
                      onChange={(e) => setSessionType(e.target.value)}
                      disabled={isTracking}
                    >
                      <option value="work">💼 Work</option>
                      <option value="study">📚 Study</option>
                      <option value="exercise">🏃 Exercise</option>
                      <option value="break">☕ Break</option>
                      <option value="meeting">📅 Meeting</option>
                      <option value="personal">👤 Personal</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="What are you working on?"
                      value={sessionDescription}
                      onChange={(e) => setSessionDescription(e.target.value)}
                      disabled={isTracking}
                    />
                  </div>

                  <div className="col-md-2">
                    {!isTracking ? (
                      <button
                        className="btn btn-success w-100"
                        onClick={startTracking}
                        disabled={!sessionDescription.trim()}
                      >
                        <i className="bi bi-play-fill me-2"></i>
                        Start
                      </button>
                    ) : (
                      <button
                        className="btn btn-danger w-100"
                        onClick={stopTracking}
                      >
                        <i className="bi bi-stop-fill me-2"></i>
                        Stop
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {isTracking && (
                <div className="active-session">
                  <div className="timer-display">
                    <div className="timer-value">
                      {formatTime(Math.floor(elapsedTime / 1000))}
                    </div>
                    <div className="timer-label">
                      {sessionType.charAt(0).toUpperCase() + sessionType.slice(1)} Session
                    </div>
                  </div>
                  <div className="session-info">
                    <span className="session-type">
                      {sessionType === 'work' && '💼'}
                      {sessionType === 'study' && '📚'}
                      {sessionType === 'exercise' && '🏃'}
                      {sessionType === 'break' && '☕'}
                      {sessionType === 'meeting' && '📅'}
                      {sessionType === 'personal' && '👤'}
                      {sessionType.charAt(0).toUpperCase() + sessionType.slice(1)}
                    </span>
                    <span className="session-desc">{sessionDescription}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="stats-section">
          <div className="row">
            <div className="col-md-3">
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="bi bi-clock"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{formatTime(stats.totalTime)}</div>
                  <div className="stat-label">Total Time</div>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="bi bi-list-ul"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalSessions}</div>
                  <div className="stat-label">Sessions</div>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="bi bi-bar-chart"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-value">
                    {stats.totalSessions > 0 ? formatTime(Math.floor(stats.averageSession)) : '00:00'}
                  </div>
                  <div className="stat-label">Average</div>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="bi bi-fire"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-value">
                    {Object.keys(stats.typeBreakdown).length}
                  </div>
                  <div className="stat-label">Categories</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Session History */}
        <div className="history-section">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="section-title mb-0">
                  <i className="bi bi-journal me-2"></i>
                  Session History
                </h3>

                <div className="btn-group">
                  {[
                    { key: 'today', label: 'Today' },
                    { key: 'week', label: 'Week' },
                    { key: 'month', label: 'Month' },
                    { key: 'all', label: 'All' }
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      className={`btn ${filter === key ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setFilter(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="session-list">
                {getFilteredSessions().length === 0 ? (
                  <div className="no-sessions">
                    <i className="bi bi-clock-history"></i>
                    <p>No sessions found for {filter}</p>
                  </div>
                ) : (
                  getFilteredSessions().map(session => (
                    <div key={session.id} className="session-item">
                      <div className="session-icon">
                        {session.type === 'work' && '💼'}
                        {session.type === 'study' && '📚'}
                        {session.type === 'exercise' && '🏃'}
                        {session.type === 'break' && '☕'}
                        {session.type === 'meeting' && '📅'}
                        {session.type === 'personal' && '👤'}
                      </div>

                      <div className="session-details">
                        <div className="session-description">{session.description}</div>
                        <div className="session-meta">
                          <span className="session-type">
                            {session.type.charAt(0).toUpperCase() + session.type.slice(1)}
                          </span>
                          <span className="session-date">
                            {new Date(session.startTime).toLocaleDateString()}
                          </span>
                          <span className="session-time">
                            {new Date(session.startTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="session-duration">
                        {formatTime(session.duration || 0)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
