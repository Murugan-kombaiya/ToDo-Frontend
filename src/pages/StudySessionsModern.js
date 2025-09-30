import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import '../styles/StudySessionsModern.css';

export default function StudySessionsModern() {
  const [sessions, setSessions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [showNewSubject, setShowNewSubject] = useState(false);
  const [newSubjectValue, setNewSubjectValue] = useState('');
  const [availableSubjects] = useState([
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
    'English', 'History', 'Geography', 'Economics', 'Psychology',
    'Philosophy', 'Art', 'Music', 'Literature', 'Languages',
    'Business', 'Finance', 'Marketing', 'Engineering', 'Medicine'
  ]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTimer, setActiveTimer] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const modalRef = useRef(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || 'demo-token';
      const response = await fetch(`http://10.0.2.2:3001/study-sessions?date=${filterDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const sessionsData = await response.json();
        setSessions(Array.isArray(sessionsData) ? sessionsData : []);
      } else {
        console.error('Failed to fetch sessions:', response.status);
        setSessions([]);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load study sessions');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [filterDate]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && showModal) {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  // Timer effect for active sessions
  useEffect(() => {
    let interval = null;
    if (activeTimer && !isPaused) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [activeTimer, isPaused]);


  const openModal = (session = null) => {
    if (session) {
      setEditingSession(session);

      // Extract date and time from start_time timestamp
      const startDate = session.start_time ? new Date(session.start_time) : new Date();

      setFormData({
        title: session.subject || '', // Use subject as title for display
        subject: session.subject || '',
        date: startDate.toISOString().split('T')[0],
        time: startDate.toTimeString().split(' ')[0].substring(0, 5),
        notes: session.notes || ''
      });
    } else {
      setEditingSession(null);
      setFormData({
        title: '',
        subject: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        notes: ''
      });
    }
    setShowNewSubject(false);
    setNewSubjectValue('');
    setShowModal(true);

    // Focus title input after modal opens
    setTimeout(() => {
      const titleInput = document.querySelector('.modal-form input[type="text"]');
      if (titleInput) titleInput.focus();
    }, 100);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSession(null);
    setFormData({
      title: '',
      subject: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      notes: ''
    });
    setShowNewSubject(false);
    setNewSubjectValue('');
  };

  const handleSubjectChange = (value) => {
    if (value === 'NEW_SUBJECT') {
      setShowNewSubject(true);
      setFormData(prev => ({ ...prev, subject: '' }));
    } else {
      setShowNewSubject(false);
      setFormData(prev => ({ ...prev, subject: value }));
    }
  };

  const handleNewSubjectSubmit = () => {
    if (newSubjectValue.trim()) {
      setFormData(prev => ({ ...prev, subject: newSubjectValue.trim() }));
      setShowNewSubject(false);
      setNewSubjectValue('');
    } else {
      toast.error('Please enter a subject name');
    }
  };

  const handleSaveSession = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Please enter a session title');
      return;
    }

    if (!formData.subject.trim()) {
      toast.error('Please select or enter a subject');
      return;
    }

    if (!formData.date) {
      toast.error('Please select a date');
      return;
    }

    if (!formData.time) {
      toast.error('Please select a start time');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token') || 'demo-token';
      const url = editingSession
        ? `http://10.0.2.2:3001/study-sessions/${editingSession.id}`
        : 'http://10.0.2.2:3001/study-sessions';
      const method = editingSession ? 'PUT' : 'POST';

      // Combine date and time into start_time timestamp
      const startTime = new Date(`${formData.date}T${formData.time}`);

      const sessionData = {
        subject: formData.subject.trim(),
        start_time: startTime.toISOString(),
        notes: formData.notes.trim(),
        focus_rating: 3
      };

      console.log('Sending session data:', sessionData);

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sessionData)
      });

      if (response.ok) {
        toast.success(editingSession ? 'Session updated successfully!' : 'Session created successfully!');
        closeModal();
        await fetchSessions(); // Refresh the sessions list
      } else {
        const errorData = await response.json();
        console.error('Server error response:', errorData);

        // Handle specific validation errors
        if (errorData.error && errorData.error.includes('subject') && errorData.error.includes('time')) {
          toast.error('Please fill in all required fields: Subject and Start Time');
        } else if (errorData.error && errorData.error.includes('subject')) {
          toast.error('Please select or enter a subject');
        } else if (errorData.error && errorData.error.includes('time')) {
          toast.error('Please select a start time');
        } else {
          toast.error(errorData.error || 'Failed to save session');
        }
        throw new Error(errorData.error || 'Failed to save session');
      }
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error(error.message || 'Failed to save session');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId, sessionTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${sessionTitle}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token') || 'demo-token';
      const response = await fetch(`http://10.0.2.2:3001/study-sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Session deleted successfully!');
        await fetchSessions(); // Refresh the sessions list
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error(error.message || 'Failed to delete session');
    }
  };

  const startTimer = (sessionId) => {
    if (activeTimer && activeTimer !== sessionId) {
      toast.warn('Please stop the current timer before starting a new one');
      return;
    }

    setActiveTimer(sessionId);
    setTimeElapsed(0);
    setIsPaused(false);
    toast.success('Study timer started!');
  };

  const pauseTimer = () => {
    setIsPaused(!isPaused);
    toast.info(isPaused ? 'Timer resumed!' : 'Timer paused!');
  };

  const stopTimer = () => {
    setActiveTimer(null);
    setTimeElapsed(0);
    setIsPaused(false);
    toast.success('Study timer stopped!');
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return '';
    }
  };

  const formatTimeFromDateTime = (dateTimeString) => {
    try {
      return new Date(dateTimeString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return '';
    }
  };


  const getSubjectIcon = (subject) => {
    const subjectIcons = {
      'Mathematics': '🔢',
      'Physics': '⚡',
      'Chemistry': '⚗️',
      'Biology': '🧬',
      'Computer Science': '💻',
      'English': '📚',
      'History': '🏛️',
      'Geography': '🌍',
      'Economics': '💰',
      'Psychology': '🧠',
      'Philosophy': '🤔',
      'Art': '🎨',
      'Music': '🎵',
      'Literature': '📖',
      'Languages': '🗣️',
      'Business': '💼',
      'Finance': '📈',
      'Marketing': '📢',
      'Engineering': '⚙️',
      'Medicine': '⚕️'
    };
    return subjectIcons[subject] || '📄';
  };

  return (
    <div className="study-sessions-modern-container">
      {/* Header */}
      <div className="sessions-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="page-title">
              <span className="title-icon">📚</span>
              Study Sessions
            </h1>
            <p className="page-subtitle">Plan and track your study sessions</p>
          </div>
          <button
            className="add-session-btn"
            onClick={() => openModal()}
            aria-label="Add new study session"
          >
            <span className="btn-icon">+</span>
            <span className="btn-text">Add Session</span>
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="date-filter">
        <label htmlFor="filter-date" className="filter-label">
          📅 Filter by Date:
        </label>
        <input
          id="filter-date"
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="date-input"
        />
      </div>

      {/* Compact Modern Active Timer */}
      {activeTimer && (
        <div className="active-timer-compact">
          <div className="timer-pulse-dot"></div>
          <div className="timer-info-row">
            <div className="timer-left">
              <span className="timer-icon-small">⏱️</span>
              <div className="timer-text-group">
                <span className="timer-title">Study {isPaused ? 'Paused' : 'Active'}</span>
                <span className="timer-subject">{sessions.find(s => s.id === activeTimer)?.subject || 'Focus'}</span>
              </div>
            </div>
            <div className="timer-center">
              <div className="timer-display-compact">{formatTime(timeElapsed)}</div>
              <div className="timer-progress-compact">
                <div className="progress-fill-compact" style={{width: `${(timeElapsed % 1800) / 18}%`}}></div>
              </div>
            </div>
            <div className="timer-right">
              <button
                className="timer-btn-compact pause-btn"
                onClick={pauseTimer}
                aria-label={isPaused ? 'Resume' : 'Pause'}
                title={isPaused ? 'Resume timer' : 'Pause timer'}
              >
                {isPaused ? '▶️' : '⏸️'}
              </button>
              <button
                className="timer-btn-compact stop-btn"
                onClick={stopTimer}
                aria-label="Stop"
                title="Stop timer"
              >
                ⏹️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sessions Content */}
      <div className="sessions-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your study sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>No study sessions for this date</h3>
            <p>Create your first study session to get started!</p>
            <button
              className="add-session-btn primary"
              onClick={() => openModal()}
            >
              <span className="btn-icon">+</span>
              <span className="btn-text">Add Your First Session</span>
            </button>
          </div>
        ) : (
          <div className="sessions-grid">
            {sessions.map(session => (
              <div key={session.id} className={`session-card ${activeTimer === session.id ? 'active-session' : ''}`}>
                <div className="session-header">
                  <div className="session-title-area">
                    <h3 className="session-title">{session.title}</h3>
                    <div className="session-subject">
                      {getSubjectIcon(session.subject)}
                      <span>{session.subject}</span>
                    </div>
                  </div>
                  <div className="session-actions">
                    <button
                      className="action-btn timer-btn"
                      onClick={() => activeTimer === session.id ? stopTimer() : startTimer(session.id)}
                      aria-label={activeTimer === session.id ? 'Stop timer' : 'Start timer'}
                      title={activeTimer === session.id ? 'Stop timer' : 'Start timer'}
                    >
                      {activeTimer === session.id ? '⏹️' : '▶️'}
                    </button>
                    <button
                      className="action-btn edit-btn"
                      onClick={() => openModal(session)}
                      aria-label={`Edit ${session.title}`}
                      title="Edit session"
                    >
                      ✏️
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDeleteSession(session.id, session.title)}
                      aria-label={`Delete ${session.title}`}
                      title="Delete session"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="session-datetime">
                  <div className="session-date">
                    📅 {formatDate(session.start_time)}
                  </div>
                  <div className="session-time">
                    🕐 {formatTimeFromDateTime(session.start_time)}
                  </div>
                </div>

                {session.notes && (
                  <div className="session-notes">
                    <strong>Notes:</strong>
                    <p>{session.notes.length > 100
                      ? `${session.notes.substring(0, 100)}...`
                      : session.notes}
                    </p>
                  </div>
                )}

                {activeTimer === session.id && (
                  <div className="session-timer">
                    <span className="timer-label">Active:</span>
                    <span className="timer-value">{formatTime(timeElapsed)}</span>
                  </div>
                )}

                <div className="session-footer">
                  <span className={`session-status ${session.status}`}>
                    {session.status || 'planned'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="sessions-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="sessions-modal" ref={modalRef}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingSession ? 'Edit Study Session' : 'Add New Study Session'}
              </h2>
              <button
                className="modal-close-btn"
                onClick={closeModal}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <form className="modal-form" onSubmit={handleSaveSession}>
              <div className="form-group">
                <label className="form-label" htmlFor="session-title">
                  Session Name *
                </label>
                <input
                  id="session-title"
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Linear Algebra Review, Essay Writing..."
                  required
                  autoComplete="off"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="session-subject">
                  Subject *
                </label>
                {showNewSubject ? (
                  <div className="new-subject-input">
                    <input
                      type="text"
                      className="form-input"
                      value={newSubjectValue}
                      onChange={(e) => setNewSubjectValue(e.target.value)}
                      placeholder="Enter new subject name..."
                      autoFocus
                    />
                    <div className="new-subject-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={handleNewSubjectSubmit}
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setShowNewSubject(false);
                          setNewSubjectValue('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <select
                    id="session-subject"
                    className="form-select"
                    value={formData.subject}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    required
                  >
                    <option value="">Select a subject...</option>
                    {availableSubjects.map(subject => (
                      <option key={subject} value={subject}>
                        {getSubjectIcon(subject)} {subject}
                      </option>
                    ))}
                    <option value="NEW_SUBJECT">+ Add New Subject</option>
                  </select>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="session-date">
                    Date *
                  </label>
                  <input
                    id="session-date"
                    type="date"
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="session-time">
                    Time *
                  </label>
                  <input
                    id="session-time"
                    type="time"
                    className="form-input"
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="session-notes">
                  Notes
                </label>
                <textarea
                  id="session-notes"
                  className="form-textarea"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add notes about this study session (topics to cover, goals, etc.)"
                  rows={4}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !formData.title.trim() || !formData.subject.trim() || !formData.date || !formData.time}
                >
                  {loading ? (
                    <>
                      <span className="btn-spinner"></span>
                      {editingSession ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">💾</span>
                      {editingSession ? 'Update Session' : 'Create Session'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        className="fab"
        onClick={() => openModal()}
        aria-label="Add new study session"
        title="Add new study session"
      >
        <span className="fab-icon">+</span>
      </button>
    </div>
  );
}