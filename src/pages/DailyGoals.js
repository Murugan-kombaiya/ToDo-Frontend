import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import './DailyGoals.css';

function DailyGoals() {
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'personal',
    priority: 'medium',
    date: new Date().toISOString().split('T')[0]
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const token = localStorage.getItem('token') || 'test-token-123';

  const fetchGoals = useCallback(async () => {
    try {
      const response = await fetch(`/daily-goals?date=${selectedDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setGoals(data);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to fetch daily goals');
      }
    } catch (error) {
      console.error('Daily goals fetch error:', error);
      toast.error('Failed to connect to server. Please check if the server is running.');
    }
  }, [selectedDate, token]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/daily-goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Daily goal created!');
        setShowForm(false);
        resetForm();
        fetchGoals();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create goal');
      }
    } catch (error) {
      toast.error('Error creating goal');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'personal',
      priority: 'medium',
      date: selectedDate
    });
  };

  const updateGoalStatus = async (goalId, newStatus) => {
    try {
      const response = await fetch(`/daily-goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast.success(`Goal ${newStatus}!`);
        fetchGoals();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update goal');
      }
    } catch (error) {
      toast.error('Error updating goal');
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      urgent: '#dc2626'
    };
    return colors[priority] || '#6b7280';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🔄';
      case 'cancelled': return '❌';
      default: return '⏳';
    }
  };

  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const totalGoals = goals.length;
  const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  const categories = ['personal', 'work', 'health', 'learning', 'social', 'other'];
  const priorities = ['low', 'medium', 'high', 'urgent'];

  return (
    <div className="daily-goals-modern">
      <div className="goals-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="page-title">
              <span className="title-icon">🎯</span>
              Daily Goals
            </h1>
            <p className="page-subtitle">Set and track your daily objectives to achieve greatness</p>
          </div>
          <button
            className="add-goal-btn"
            onClick={() => setShowForm(true)}
          >
            <span className="btn-icon">+</span>
            <span className="btn-text">Add Goal</span>
          </button>
        </div>
      </div>

      <div className="goals-stats">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <div className="stat-value">{totalGoals}</div>
            <div className="stat-label">Total Goals</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-value">{completedGoals}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <div className="stat-value">{completionRate}%</div>
            <div className="stat-label">Completion Rate</div>
          </div>
        </div>
      </div>

      <div className="goals-controls">
        <div className="date-selector">
          <label className="date-label">📅 Select Date:</label>
          <input
            type="date"
            className="date-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {showForm && (
        <div className="goals-modal-overlay">
          <div className="goals-modal">
            <div className="modal-header">
              <h2 className="modal-title">✨ Add Daily Goal</h2>
              <button
                className="modal-close-btn"
                onClick={() => setShowForm(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="goal-title">
                  Goal Title *
                </label>
                <input
                  id="goal-title"
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  placeholder="What do you want to achieve today?"
                  autoComplete="off"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="goal-description">
                  Description
                </label>
                <textarea
                  id="goal-description"
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Add more details about your goal..."
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="goal-category">
                    Category
                  </label>
                  <select
                    id="goal-category"
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="goal-priority">
                    Priority
                  </label>
                  <select
                    id="goal-priority"
                    className="form-select"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  >
                    {priorities.map(priority => (
                      <option key={priority} value={priority}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="goal-date">
                  Date
                </label>
                <input
                  id="goal-date"
                  type="date"
                  className="form-input"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <span className="btn-icon">✨</span>
                  <span className="btn-text">Create Goal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="goals-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>
        <div className="progress-text">
          {completedGoals} of {totalGoals} goals completed
        </div>
      </div>

      <div className="goals-grid">
        {goals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h3>No goals for this day</h3>
            <p>Set your first daily goal to get started!</p>
          </div>
        ) : (
          goals.map(goal => (
            <div key={goal.id} className={`goal-card ${goal.status}`}>
              <div className="goal-header">
                <div className="goal-status">
                  <button
                    className="status-btn"
                    onClick={() => updateGoalStatus(goal.id,
                      goal.status === 'completed' ? 'pending' : 'completed'
                    )}
                  >
                    {getStatusIcon(goal.status)}
                  </button>
                </div>

                <div className="goal-content">
                  <h4>{goal.title}</h4>
                  {goal.description && <p>{goal.description}</p>}
                </div>

                <div className="goal-actions">
                  <div className="goal-meta">
                    <span
                      className="category-badge"
                      style={{ backgroundColor: getPriorityColor(goal.priority) }}
                    >
                      {goal.category}
                    </span>
                    <span
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(goal.priority) }}
                    >
                      {goal.priority}
                    </span>
                  </div>
                </div>
              </div>

              {goal.completed_at && (
                <div className="completion-time">
                  Completed at: {new Date(goal.completed_at).toLocaleTimeString()}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Quick Goal Templates */}
      <div className="quick-templates">
        <h3>Quick Templates</h3>
        <div className="template-grid">
          <button
            className="template-btn"
            onClick={() => {
              setFormData({
                ...formData,
                title: 'Exercise for 30 minutes',
                description: 'Stay healthy and active',
                category: 'health',
                priority: 'medium'
              });
              setShowForm(true);
            }}
          >
            🏃‍♂️ Exercise
          </button>

          <button
            className="template-btn"
            onClick={() => {
              setFormData({
                ...formData,
                title: 'Read for 1 hour',
                description: 'Continue learning and growing',
                category: 'learning',
                priority: 'medium'
              });
              setShowForm(true);
            }}
          >
            📚 Read
          </button>

          <button
            className="template-btn"
            onClick={() => {
              setFormData({
                ...formData,
                title: 'Complete work tasks',
                description: 'Focus on productivity',
                category: 'work',
                priority: 'high'
              });
              setShowForm(true);
            }}
          >
            💼 Work
          </button>

          <button
            className="template-btn"
            onClick={() => {
              setFormData({
                ...formData,
                title: 'Call family/friends',
                description: 'Stay connected with loved ones',
                category: 'social',
                priority: 'low'
              });
              setShowForm(true);
            }}
          >
            📞 Social
          </button>
        </div>
      </div>
    </div>
  );
}

export default DailyGoals;
