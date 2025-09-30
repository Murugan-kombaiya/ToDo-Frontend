import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import '../styles/StudySessionsV3.css';

function StudySessions() {
  const [sessions, setSessions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    notes: '',
    attachments: []
  });
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTimer, setActiveTimer] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showNewSubject, setShowNewSubject] = useState(false);
  const [newSubjectValue, setNewSubjectValue] = useState('');
  const [availableSubjects] = useState([
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
    'English', 'History', 'Geography', 'Economics', 'Psychology',
    'Philosophy', 'Art', 'Music', 'Literature', 'Languages',
    'Business', 'Finance', 'Marketing', 'Engineering', 'Medicine'
  ]);
  const [attachmentPreviews, setAttachmentPreviews] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('');

  const fileInputRef = useRef(null);
  const newSubjectInputRef = useRef(null);
  const modalRef = useRef(null);

  const token = localStorage.getItem('token') || 'test-token-123';

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://192.168.1.2:3001/study-sessions?date=${filterDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSessions(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch sessions');
        setSessions([]);
      }
    } catch (error) {
      console.error('Study sessions fetch error:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [filterDate, token]);

  useEffect(() => {
    fetchSessions();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, [fetchSessions]);

  // Apply theme class to body
  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode);
    return () => document.body.classList.remove('dark');
  }, [isDarkMode]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (activeTimer) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes) => {
    if (!minutes || minutes < 60) return `${minutes || 0}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatTimeOnly = (dateString) => {
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'Invalid Time';
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleCreateSession = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditSession = (session) => {
    try {
      const sessionDate = new Date(session.start_time);
      setFormData({
        title: session.title || session.subject || '',
        subject: session.subject || '',
        date: sessionDate.toISOString().split('T')[0],
        time: sessionDate.toTimeString().split(' ')[0].substring(0, 5),
        notes: session.notes || '',
        attachments: session.attachments || []
      });
      setEditingSession(session);
      setAttachmentPreviews(session.attachments || []);
      setShowModal(true);
    } catch (error) {
      toast.error('Error editing session');
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session?')) {
      return;
    }

    try {
      const response = await fetch(`http://192.168.1.2:3001/study-sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Session deleted successfully!');
        fetchSessions();
      } else {
        toast.error('Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Error deleting session');
    }
  };

  const startQuickSession = () => {
    if (!formData.subject.trim()) {
      toast.error('Please select a subject first');
      return;
    }

    const now = new Date();
    setActiveTimer({
      startTime: now,
      subject: formData.subject,
      title: `Quick ${formData.subject} Session`
    });
    setTimeElapsed(0);
    toast.success(`Started studying ${formData.subject}!`);
  };

  const stopQuickSession = async () => {
    if (!activeTimer) return;

    const endTime = new Date();
    const duration = Math.round((endTime - activeTimer.startTime) / (1000 * 60));

    const sessionData = {
      title: activeTimer.title,
      subject: activeTimer.subject,
      start_time: activeTimer.startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration_minutes: duration,
      notes: `Quick session - studied for ${formatDuration(duration)}`
    };

    try {
      const response = await fetch('http://192.168.1.2:3001/study-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sessionData)
      });

      if (response.ok) {
        toast.success(`${activeTimer.subject} session saved! Duration: ${formatDuration(duration)}`);
        setActiveTimer(null);
        setTimeElapsed(0);
        fetchSessions();
      } else {
        toast.error('Failed to save session');
      }
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Error saving session');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.subject.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const sessionData = {
      title: formData.title.trim(),
      subject: formData.subject.trim(),
      start_time: `${formData.date}T${formData.time}:00.000Z`,
      duration_minutes: 60, // Default 1 hour
      notes: formData.notes.trim(),
      attachments: attachmentPreviews || []
    };

    try {
      const url = editingSession
        ? `http://192.168.1.2:3001/study-sessions/${editingSession.id}`
        : 'http://192.168.1.2:3001/study-sessions';
      const method = editingSession ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sessionData)
      });

      if (response.ok) {
        toast.success(editingSession ? 'Session updated successfully!' : 'Session created successfully!');
        handleCloseModal();
        fetchSessions();
      } else {
        toast.error('Failed to save session');
      }
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Error saving session');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setTimeout(resetForm, 300);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subject: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      notes: '',
      attachments: []
    });
    setEditingSession(null);
    setAttachmentPreviews([]);
    setShowNewSubject(false);
    setNewSubjectValue('');
  };

  const handleSubjectChange = (value) => {
    if (value === 'new') {
      setShowNewSubject(true);
      setNewSubjectValue('');
      setFormData({...formData, subject: ''});
      setTimeout(() => {
        if (newSubjectInputRef.current) {
          newSubjectInputRef.current.focus();
        }
      }, 100);
    } else {
      setShowNewSubject(false);
      setFormData({...formData, subject: value});
    }
  };

  const handleNewSubjectSave = () => {
    if (newSubjectValue.trim()) {
      const trimmedSubject = newSubjectValue.trim();
      toast.success(`Subject "${trimmedSubject}" added!`);
      setFormData({...formData, subject: trimmedSubject});
      setShowNewSubject(false);
      setNewSubjectValue('');
    }
  };

  const handleAttachmentSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const allowedTypes = ['image/', 'application/pdf', 'application/msword', 'text/'];
      const isValidType = allowedTypes.some(type => file.type.startsWith(type));
      if (!isValidType) {
        toast.error(`File type ${file.type} is not supported`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    for (const file of validFiles) {
      try {
        const attachment = {
          id: Date.now() + Math.random(),
          name: file.name,
          type: file.type,
          size: file.size,
          uploadDate: new Date().toISOString()
        };
        setAttachmentPreviews(prev => [...prev, attachment]);
        toast.success(`${file.name} added`);
      } catch (error) {
        toast.error(`Could not process file: ${file.name}`);
      }
    }

    if (e.target) e.target.value = '';
  };

  const removeAttachment = (attachmentId) => {
    setAttachmentPreviews(prev => prev.filter(att => att.id !== attachmentId));
    toast.info('Attachment removed');
  };

  const getAttachmentIcon = (type) => {
    if (!type) return '📎';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('image')) return '🖼️';
    if (type.includes('text')) return '📄';
    return '📎';
  };

  // Enhanced filtering and sorting with error handling
  const filteredSessions = sessions.filter(session => {
    if (!session) return false;
    try {
      const matchesSearch = !searchTerm ||
        (session.title && session.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (session.subject && session.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (session.notes && session.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSubject = !selectedSubjectFilter || session.subject === selectedSubjectFilter;

      return matchesSearch && matchesSubject;
    } catch (error) {
      return false;
    }
  });

  const sortedSessions = [...filteredSessions].sort((a, b) => {
    try {
      let aVal, bVal;

      switch (sortBy) {
        case 'date':
          aVal = new Date(a.start_time || 0);
          bVal = new Date(b.start_time || 0);
          break;
        case 'subject':
          aVal = (a.subject || '').toLowerCase();
          bVal = (b.subject || '').toLowerCase();
          break;
        case 'duration':
          aVal = a.duration_minutes || 0;
          bVal = b.duration_minutes || 0;
          break;
        default:
          aVal = new Date(a.start_time || 0);
          bVal = new Date(b.start_time || 0);
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    } catch (error) {
      return 0;
    }
  });

  // Statistics calculations with error handling
  const totalTime = sessions.reduce((sum, s) => sum + (s?.duration_minutes || 0), 0);
  const avgDuration = sessions.length > 0 ? Math.round(totalTime / sessions.length) : 0;
  const todaySessions = sessions.filter(s => {
    try {
      const sessionDate = new Date(s.start_time).toDateString();
      const filterDateObj = new Date(filterDate + 'T00:00:00').toDateString();
      return sessionDate === filterDateObj;
    } catch (error) {
      return false;
    }
  });

  const uniqueSubjects = [...new Set(sessions.map(s => s?.subject).filter(Boolean))];

  return (
    <div className={`study-sessions ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Enhanced Page Header */}
      <div className="page-header">
        <div>
          <h1>⏰ Study Sessions</h1>
          <p>Track your focused study time and boost productivity</p>
        </div>
        <div className="header-actions">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Enhanced Session Stats */}
      <div className="session-stats">
        <div className="stat-card" onClick={() => setSortBy('duration')}>
          <div className="stat-icon">⏱️</div>
          <div className="stat-info">
            <div className="stat-value">{formatDuration(totalTime)}</div>
            <div className="stat-label">Total Study Time</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => setSortBy('subject')}>
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <div className="stat-value">{formatDuration(avgDuration)}</div>
            <div className="stat-label">Average Duration</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => setFilterDate(new Date().toISOString().split('T')[0])}>
          <div className="stat-icon">📈</div>
          <div className="stat-info">
            <div className="stat-value">{todaySessions.length}</div>
            <div className="stat-label">Sessions Today</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-info">
            <div className="stat-value">{uniqueSubjects.length}</div>
            <div className="stat-label">Subjects Studied</div>
          </div>
        </div>
      </div>

      {/* Enhanced Session Controls */}
      <div className="session-controls">
        <div className="control-group">
          <div className="date-filter">
            <label>📅 Filter by Date:</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>

          <div className="search-filter" style={{ marginLeft: '1rem' }}>
            <input
              type="text"
              placeholder="🔍 Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'var(--study-bg, #ffffff)',
                border: '2px solid var(--study-border, #e2e8f0)',
                borderRadius: 'var(--study-radius, 0.75rem)',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                color: 'var(--study-text, #1e293b)',
                minWidth: '200px'
              }}
            />
          </div>

          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            style={{
              background: 'var(--study-bg, #ffffff)',
              border: '2px solid var(--study-border, #e2e8f0)',
              borderRadius: 'var(--study-radius, 0.75rem)',
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              color: 'var(--study-text, #1e293b)',
              marginLeft: '0.5rem'
            }}
          >
            <option value="">All Subjects</option>
            {uniqueSubjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>

        <button
          className="create-btn primary"
          onClick={handleCreateSession}
          title="Create new session"
        >
          <span>📝</span>
          <span>Add Session</span>
        </button>
      </div>

      {/* Enhanced Active Timer */}
      {activeTimer && (
        <div className="active-timer">
          <div className="timer-display">
            <h3>🎯 Active Study Session</h3>
            <div className="timer-clock">{formatTime(timeElapsed)}</div>
            <div className="timer-subject">📚 Subject: {activeTimer?.subject}</div>
          </div>
          <div className="timer-controls">
            <button onClick={stopQuickSession} className="create-btn secondary">
              ⏹️ Stop & Save Session
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Quick Start */}
      {!activeTimer && (
        <div className="quick-start">
          <h3>🚀 Quick Start Session</h3>
          <div className="quick-form">
            <select
              className="form-select"
              value={showNewSubject ? 'new' : formData.subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
            >
              <option value="">Select Subject</option>
              {availableSubjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
              <option value="new">➕ New Subject</option>
            </select>

            {showNewSubject && (
              <div className="subject-input-container">
                <input
                  ref={newSubjectInputRef}
                  type="text"
                  className="form-input"
                  placeholder="Enter new subject"
                  value={newSubjectValue}
                  onChange={(e) => setNewSubjectValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleNewSubjectSave();
                    } else if (e.key === 'Escape') {
                      setShowNewSubject(false);
                      setNewSubjectValue('');
                      setFormData({...formData, subject: ''});
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleNewSubjectSave}
                  disabled={!newSubjectValue.trim()}
                  className="subject-btn save"
                  title="Save new subject"
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewSubject(false);
                    setNewSubjectValue('');
                    setFormData({...formData, subject: ''});
                  }}
                  className="subject-btn cancel"
                  title="Cancel"
                >
                  ✕
                </button>
              </div>
            )}

            <button
              onClick={startQuickSession}
              className="create-btn primary"
              disabled={!formData.subject || showNewSubject}
            >
              🎯 Start Session
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Add Session Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} ref={modalRef}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingSession ? '✏️ Edit Study Session' : '📝 Create Study Session'}
              </h2>
              <button
                className="modal-close"
                onClick={handleCloseModal}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label required">📋 Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter session title..."
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label required">📚 Subject</label>
                <select
                  className="form-select"
                  value={showNewSubject ? 'new' : formData.subject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  required={!showNewSubject}
                >
                  <option value="">Select Subject</option>
                  {availableSubjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                  <option value="new">➕ New Subject</option>
                </select>

                {showNewSubject && (
                  <div className="subject-input-container">
                    <input
                      ref={newSubjectInputRef}
                      type="text"
                      className="form-input"
                      placeholder="Enter new subject"
                      value={newSubjectValue}
                      onChange={(e) => setNewSubjectValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleNewSubjectSave();
                        } else if (e.key === 'Escape') {
                          setShowNewSubject(false);
                          setNewSubjectValue('');
                        }
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={handleNewSubjectSave}
                      disabled={!newSubjectValue.trim()}
                      className="subject-btn save"
                      title="Save new subject"
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewSubject(false);
                        setNewSubjectValue('');
                      }}
                      className="subject-btn cancel"
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">📅 Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">🕐 Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">📝 Notes</label>
                <textarea
                  className="form-textarea"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Session notes, goals, or reflections..."
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label className="form-label">📎 Attachments</label>
                <div className="attachment-upload">
                  <input
                    type="file"
                    className="file-input-hidden"
                    id="attachment-input"
                    onChange={handleAttachmentSelect}
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.pptx"
                    ref={fileInputRef}
                  />
                  <label htmlFor="attachment-input" className="file-input-label">
                    <div className="file-input-content">
                      <span className="file-input-icon">📎</span>
                      <span className="file-input-text">Click to add attachments</span>
                      <span className="file-input-hint">Images, documents, PDFs (max 10MB each)</span>
                    </div>
                  </label>
                </div>

                {attachmentPreviews.length > 0 && (
                  <div className="attachment-previews">
                    <div className="preview-grid">
                      {attachmentPreviews.map(attachment => (
                        <div key={attachment.id} className="preview-item">
                          <div className="preview-content">
                            <div className="preview-file">
                              <span className="file-icon">{getAttachmentIcon(attachment.type)}</span>
                              <span className="file-name">
                                {attachment.name ?
                                  (attachment.name.length > 15 ?
                                    attachment.name.substring(0, 15) + '...' :
                                    attachment.name
                                  ) : 'Unknown file'}
                              </span>
                            </div>
                            <button
                              type="button"
                              className="preview-remove"
                              onClick={() => removeAttachment(attachment.id)}
                              title="Remove attachment"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="create-btn secondary"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="create-btn primary"
                  disabled={!formData.title.trim() || (!formData.subject.trim() && !showNewSubject)}
                >
                  {editingSession ? '✅ Update Session' : '✅ Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Sessions List */}
      <div className="sessions-list">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3>
            {filterDate === new Date().toISOString().split('T')[0]
              ? "📅 Today's Sessions"
              : `📅 Sessions for ${formatDate(filterDate + 'T00:00:00')}`
            }
            {loading && <span className="loading-spinner"> ⏳</span>}
            {sortedSessions.length > 0 && !loading && (
              <span style={{ marginLeft: '1rem', fontSize: '0.875rem', color: 'var(--study-text-secondary, #64748b)' }}>
                ({sortedSessions.length} session{sortedSessions.length !== 1 ? 's' : ''})
              </span>
            )}
          </h3>

          {sortedSessions.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--study-text-secondary, #64748b)' }}>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  background: 'var(--study-bg, #ffffff)',
                  border: '2px solid var(--study-border, #e2e8f0)',
                  borderRadius: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  color: 'var(--study-text, #1e293b)'
                }}
              >
                <option value="date">Date</option>
                <option value="subject">Subject</option>
                <option value="duration">Duration</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--study-text-secondary, #64748b)',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
                title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          )}
        </div>

        {sortedSessions.length === 0 && !loading ? (
          <div className="empty-state">
            <div className="empty-icon">⏰</div>
            <h4>No sessions found</h4>
            <p>
              {searchTerm || selectedSubjectFilter ?
                'Try adjusting your search or filter criteria.' :
                'Create your first study session to track your productivity!'
              }
            </p>
            <button className="create-btn primary" onClick={handleCreateSession} style={{ marginTop: '1rem' }}>
              <span>📝</span>
              <span>Add Session</span>
            </button>
          </div>
        ) : (
          <div className="sessions-grid">
            {sortedSessions.map(session => (
              <div key={session.id} className="session-card">
                <div className="session-card-header">
                  <div className="session-info">
                    <h4 className="session-subject">
                      📚 {session.subject || 'Unknown Subject'}
                    </h4>
                    <h5 className="session-title">{session.title || 'Untitled Session'}</h5>
                    <div className="session-datetime">
                      <span>📅 {formatDate(session.start_time)}</span>
                      <span>🕐 {formatTimeOnly(session.start_time)}</span>
                    </div>
                  </div>
                  <div className="session-actions">
                    <button
                      className="action-btn edit"
                      onClick={() => handleEditSession(session)}
                      title="Edit session"
                    >
                      ✏️
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDeleteSession(session.id)}
                      title="Delete session"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="session-stats">
                  <div className="session-stat">
                    <span className="stat-icon">⏱️</span>
                    <span>{formatDuration(session.duration_minutes || 0)}</span>
                  </div>
                  {session.attachments && session.attachments.length > 0 && (
                    <div className="session-stat">
                      <span className="stat-icon">📎</span>
                      <span>{session.attachments.length} attachment{session.attachments.length > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>

                {session.notes && (
                  <div className="session-notes">
                    {session.notes.length > 150
                      ? `${session.notes.substring(0, 150)}...`
                      : session.notes}
                  </div>
                )}

                {session.attachments && session.attachments.length > 0 && (
                  <div className="session-attachments">
                    <div className="attachment-list">
                      {session.attachments.slice(0, 3).map((attachment, index) => (
                        <div key={attachment.id || index} className="attachment-item">
                          <span>{getAttachmentIcon(attachment.type)}</span>
                          <span>{attachment.name || 'File'}</span>
                        </div>
                      ))}
                      {session.attachments.length > 3 && (
                        <div className="attachment-item">
                          +{session.attachments.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Floating Action Button */}
      <button
        className="floating-action-btn"
        onClick={handleCreateSession}
        aria-label="Create new session"
        title="Create new session"
      >
        <span className="fab-icon">+</span>
      </button>
    </div>
  );
}

export default StudySessions;