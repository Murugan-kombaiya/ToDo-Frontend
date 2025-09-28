import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import '../styles/LearningProgress.css';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function LearningProgress() {
  const [progress, setProgress] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalHours: 0,
    averageProgress: 0,
    expertLevel: 0
  });
  const [animatingProgress, setAnimatingProgress] = useState(new Set());
  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    skill_level: 'beginner',
    hours_spent: 0,
    progress_percentage: 0,
    notes: ''
  });

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const response = await fetch('/learning/progress', {
        headers: { ...authHeaders() }
      });

      if (response.ok) {
        const data = await response.json();
        const progressData = Array.isArray(data) ? data : [];
        setProgress(progressData);
        setSubjects([...new Set(progressData.map(item => item.subject))]);

        // Calculate statistics
        const totalSubjects = progressData.length;
        const totalHours = progressData.reduce((sum, item) => sum + (item.hours_spent || 0), 0);
        const averageProgress = totalSubjects > 0
          ? Math.round(progressData.reduce((sum, item) => sum + (item.progress_percentage || 0), 0) / totalSubjects)
          : 0;
        const expertLevel = progressData.filter(item => item.skill_level === 'expert').length;

        setStats({ totalSubjects, totalHours, averageProgress, expertLevel });
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to fetch learning progress');
      }
    } catch (error) {
      console.error('Learning progress fetch error:', error);
      toast.error('Failed to connect to server. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.subject.trim()) {
      toast.error('Subject is required');
      return;
    }

    try {
      const url = editingSubject
        ? `/learning/progress/${editingSubject}`
        : '/learning/progress';

      const method = editingSubject ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(`Learning progress ${editingSubject ? 'updated' : 'saved'}!`);

        // Add animation effect for progress update
        if (editingSubject) {
          setAnimatingProgress(prev => new Set([...prev, editingSubject]));
          setTimeout(() => {
            setAnimatingProgress(prev => {
              const newSet = new Set(prev);
              newSet.delete(editingSubject);
              return newSet;
            });
          }, 1500);
        }

        setShowForm(false);
        setEditingSubject(null);
        resetForm();
        fetchProgress();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to save progress');
      }
    } catch (error) {
      console.error('Learning progress save error:', error);
      toast.error('Failed to connect to server. Please check if the server is running.');
    }
  };

  const resetForm = () => {
    setFormData({
      subject: '',
      topic: '',
      skill_level: 'beginner',
      hours_spent: 0,
      progress_percentage: 0,
      notes: ''
    });
  };

  const handleEdit = (e, subject) => {
    e.preventDefault();
    e.stopPropagation();

    const subjectData = progress.find(p => p.subject === subject);

    if (subjectData) {
      setFormData({
        subject: subjectData.subject,
        topic: subjectData.topic || '',
        skill_level: subjectData.skill_level || 'beginner',
        hours_spent: subjectData.hours_spent || 0,
        progress_percentage: subjectData.progress_percentage || 0,
        notes: subjectData.notes || ''
      });
      setEditingSubject(subjectData.id);
      setShowForm(true);
    } else {
      console.error('Subject data not found for:', subject);
      toast.error('Subject data not found. Please refresh the page and try again.');
    }
  };

  const handleDelete = async (e, subject) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm(`Are you sure you want to delete "${subject}" progress?`)) {
      return;
    }

    try {
      const progressItem = progress.find(p => p.subject === subject);

      if (!progressItem) {
        console.error('Progress item not found for subject:', subject);
        toast.error('Progress item not found. Please refresh the page and try again.');
        return;
      }


      const response = await fetch(`/learning/progress/${progressItem.id}`, {
        method: 'DELETE',
        headers: { ...authHeaders() }
      });


      if (response.ok) {
        toast.success(`Learning progress for "${subject}" deleted successfully!`);
        fetchProgress();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Delete failed with error:', errorData);
        toast.error(errorData.error || 'Failed to delete progress');
      }
    } catch (error) {
      console.error('Learning progress delete error:', error);
      toast.error('Failed to connect to server. Please check if the server is running.');
    }
  };

  const getSkillLevelColor = (level) => {
    const colors = {
      beginner: '#ef4444',
      intermediate: '#f59e0b',
      advanced: '#10b981',
      expert: '#8b5cf6'
    };
    return colors[level] || '#6b7280';
  };

  const getProgressColor = (percentage) => {
    if (percentage < 25) return '#ef4444';
    if (percentage < 50) return '#f59e0b';
    if (percentage < 75) return '#f97316';
    if (percentage < 100) return '#10b981';
    return '#8b5cf6';
  };

  const getSkillLevelIcon = (level) => {
    const icons = {
      beginner: '🌱',
      intermediate: '🌿',
      advanced: '🌳',
      expert: '🏆'
    };
    return icons[level] || '📚';
  };

  if (loading) {
    return (
      <div className="learning-progress">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your learning journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="learning-progress">
      {/* Header Section */}
      <div className="learning-header">
        <div className="header-content">
          <h1 className="title">
            <i className="bi bi-mortarboard me-2"></i>
            Learning Progress Hub
          </h1>
          <p className="subtitle">Track your knowledge journey and skill development milestones</p>
        </div>

        <button
          className="btn btn-primary add-subject-btn"
          onClick={() => setShowForm(true)}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Add Subject
        </button>
      </div>

      {/* Statistics Dashboard */}
      <div className="learning-stats">
        <div className="stat-card subjects">
          <div className="stat-icon">
            <i className="bi bi-book"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalSubjects}</h3>
            <p>Active Subjects</p>
          </div>
        </div>

        <div className="stat-card hours">
          <div className="stat-icon">
            <i className="bi bi-clock"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalHours}h</h3>
            <p>Study Hours</p>
          </div>
        </div>

        <div className="stat-card progress">
          <div className="stat-icon">
            <i className="bi bi-graph-up"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.averageProgress}%</h3>
            <p>Average Progress</p>
          </div>
        </div>

        <div className="stat-card expert">
          <div className="stat-icon">
            <i className="bi bi-trophy"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.expertLevel}</h3>
            <p>Expert Level</p>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => {
          setShowForm(false);
          setEditingSubject(null);
          resetForm();
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSubject ? 'Edit Subject Progress' : 'Add New Subject'}</h3>
              <button
                className="btn btn-close"
                onClick={() => {
                  setShowForm(false);
                  setEditingSubject(null);
                  resetForm();
                }}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Subject Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    placeholder="e.g., JavaScript, Python, Data Science"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Current Topic</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.topic}
                    onChange={(e) => setFormData({...formData, topic: e.target.value})}
                    placeholder="What are you currently studying?"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Skill Level</label>
                    <select
                      className="form-select"
                      value={formData.skill_level}
                      onChange={(e) => setFormData({...formData, skill_level: e.target.value})}
                    >
                      <option value="beginner">🌱 Beginner</option>
                      <option value="intermediate">🌿 Intermediate</option>
                      <option value="advanced">🌳 Advanced</option>
                      <option value="expert">🏆 Expert</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Hours Spent</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.hours_spent}
                      onChange={(e) => setFormData({...formData, hours_spent: parseInt(e.target.value) || 0})}
                      min="0"
                      step="0.5"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Progress Percentage: {formData.progress_percentage}%</label>
                  <div className="range-container">
                    <input
                      type="range"
                      className="form-range"
                      min="0"
                      max="100"
                      value={formData.progress_percentage}
                      onChange={(e) => setFormData({...formData, progress_percentage: parseInt(e.target.value)})}
                    />
                    <div className="range-labels">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Learning Notes</label>
                  <textarea
                    className="form-control"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Key concepts, challenges, achievements, or next steps..."
                    rows="4"
                  />
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingSubject(null);
                  resetForm();
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                onClick={handleSubmit}
              >
                {editingSubject ? 'Update Progress' : 'Save Progress'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Cards */}
      <div className="learning-content">
        {subjects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="bi bi-mortarboard"></i>
            </div>
            <h3>Start Your Learning Journey</h3>
            <p>Track your progress across different subjects and watch your skills grow!</p>
            <button
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Add Your First Subject
            </button>
          </div>
        ) : (
          <div className="progress-grid">
            {subjects.map(subject => {
              const subjectProgress = progress.find(p => p.subject === subject);
              const isAnimating = animatingProgress.has(subjectProgress?.id);
              return (
                <div
                  key={subject}
                  className={`progress-card ${isAnimating ? 'updating' : ''}`}
                >
                  <div className="card-header">
                    <div className="subject-info">
                      <div className="skill-icon">
                        {getSkillLevelIcon(subjectProgress?.skill_level)}
                      </div>
                      <div>
                        <h3 className="subject-name">{subject}</h3>
                        {subjectProgress?.topic && (
                          <p className="current-topic">{subjectProgress.topic}</p>
                        )}
                      </div>
                    </div>

                    <div className="card-actions">
                      <button
                        className="btn btn-sm btn-outline-primary edit-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEdit(e, subject);
                        }}
                        title="Edit Progress"
                        type="button"
                        style={{
                          pointerEvents: 'auto',
                          zIndex: 10,
                          position: 'relative'
                        }}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger delete-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(e, subject);
                        }}
                        title="Delete Subject"
                        type="button"
                        style={{
                          pointerEvents: 'auto',
                          zIndex: 10,
                          position: 'relative'
                        }}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>

                  <div className="progress-info">
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Skill Level</span>
                        <span
                          className="skill-badge"
                          style={{ backgroundColor: getSkillLevelColor(subjectProgress?.skill_level) }}
                        >
                          {subjectProgress?.skill_level || 'beginner'}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Study Time</span>
                        <span className="info-value">{subjectProgress?.hours_spent || 0} hours</span>
                      </div>
                    </div>
                  </div>

                  <div className="progress-section">
                    <div className="progress-header">
                      <span className="progress-text">Progress</span>
                      <span
                        className={`progress-percentage ${
                          (subjectProgress?.progress_percentage || 0) === 100 ? 'completed' : ''
                        }`}
                      >
                        {(subjectProgress?.progress_percentage || 0) === 100
                          ? '✅ Completed'
                          : `${subjectProgress?.progress_percentage || 0}%`
                        }
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${subjectProgress?.progress_percentage || 0}%`,
                          backgroundColor: getProgressColor(subjectProgress?.progress_percentage || 0)
                        }}
                      ></div>
                    </div>
                  </div>

                  {subjectProgress?.notes && (
                    <div className="notes-section">
                      <h4 className="notes-title">
                        <i className="bi bi-sticky me-1"></i>
                        Notes
                      </h4>
                      <p className="notes-content">{subjectProgress.notes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default LearningProgress;