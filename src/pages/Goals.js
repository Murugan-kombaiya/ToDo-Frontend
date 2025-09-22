import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import '../styles/Goals.css';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'personal',
    priority: 'medium',
    targetDate: '',
    milestones: []
  });

  // Fetch goals
  const fetchGoals = useCallback(() => {
    fetch('/goals', {
      headers: { ...authHeaders() }
    })
      .then(response => response.json())
      .then(data => {
        setGoals(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        toast.error('Failed to fetch goals');
      });
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Add new goal
  const handleAddGoal = () => {
    if (!newGoal.title.trim()) {
      toast.warning('Please enter a goal title');
      return;
    }

    const goalData = {
      ...newGoal,
      targetDate: newGoal.targetDate || null
    };

    fetch('/goals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      },
      body: JSON.stringify(goalData)
    })
      .then(() => {
        fetchGoals();
        setShowAddModal(false);
        setNewGoal({
          title: '',
          description: '',
          category: 'personal',
          priority: 'medium',
          targetDate: '',
          milestones: []
        });
        toast.success('Goal added successfully!');
      })
      .catch(() => {
        toast.error('Failed to add goal');
      });
  };

  // Update goal
  const handleUpdateGoal = () => {
    if (!editingGoal) return;

    fetch(`/goals/${editingGoal.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      },
      body: JSON.stringify(editingGoal)
    })
      .then(() => {
        fetchGoals();
        setEditingGoal(null);
        toast.success('Goal updated successfully!');
      })
      .catch(() => {
        toast.error('Failed to update goal');
      });
  };

  // Delete goal
  const handleDeleteGoal = (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;

    fetch(`/goals/${goalId}`, {
      method: 'DELETE',
      headers: { ...authHeaders() }
    })
      .then(() => {
        fetchGoals();
        toast.success('Goal deleted successfully!');
      })
      .catch(() => {
        toast.error('Failed to delete goal');
      });
  };

  // Update goal progress
  const updateGoalProgress = (goalId, progress) => {
    fetch(`/goals/${goalId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      },
      body: JSON.stringify({ progress })
    })
      .then(() => {
        fetchGoals();
      })
      .catch(() => {
        toast.error('Failed to update progress');
      });
  };

  // Get progress color
  const getProgressColor = (progress) => {
    if (progress < 25) return '#dc3545';
    if (progress < 50) return '#fd7e14';
    if (progress < 75) return '#ffc107';
    return '#28a745';
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'career': return '💼';
      case 'health': return '❤️';
      case 'finance': return '💰';
      case 'education': return '🎓';
      case 'personal': return '👤';
      case 'travel': return '✈️';
      default: return '🎯';
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  return (
    <div className="app-container goals-page">
      <div className="goals-header">
        <h1 className="title">
          <i className="bi bi-bullseye me-2"></i>
          Goals & Objectives
        </h1>
        <p className="subtitle">Track your long-term goals and milestones</p>

        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Add New Goal
        </button>
      </div>

      <div className="goals-content">
        {goals.length === 0 ? (
          <div className="empty-goals">
            <i className="bi bi-bullseye"></i>
            <h3>No goals yet</h3>
            <p>Start by adding your first goal to track your progress</p>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              Create Your First Goal
            </button>
          </div>
        ) : (
          <div className="goals-grid">
            {goals.map(goal => (
              <div key={goal.id} className="goal-card">
                <div className="goal-header">
                  <div className="goal-icon">
                    {getCategoryIcon(goal.category)}
                  </div>

                  <div className="goal-actions">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setEditingGoal(goal)}
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteGoal(goal.id)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>

                <div className="goal-body">
                  <h3 className="goal-title">{goal.title}</h3>
                  <p className="goal-description">{goal.description}</p>

                  <div className="goal-meta">
                    <span
                      className="goal-category"
                      style={{ backgroundColor: getPriorityColor(goal.priority) + '20' }}
                    >
                      <span className="category-icon">{getCategoryIcon(goal.category)}</span>
                      {goal.category}
                    </span>

                    <span
                      className="goal-priority"
                      style={{ color: getPriorityColor(goal.priority) }}
                    >
                      {goal.priority} priority
                    </span>

                    {goal.targetDate && (
                      <span className="goal-deadline">
                        <i className="bi bi-calendar me-1"></i>
                        {new Date(goal.targetDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="goal-progress">
                    <div className="progress-info">
                      <span className="progress-text">
                        {goal.progress || 0}% Complete
                      </span>
                      <span className="progress-value">
                        {goal.progress || 0}%
                      </span>
                    </div>

                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${goal.progress || 0}%`,
                          backgroundColor: getProgressColor(goal.progress || 0)
                        }}
                      ></div>
                    </div>

                    <div className="progress-controls">
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() => updateGoalProgress(goal.id, Math.min((goal.progress || 0) + 10, 100))}
                        disabled={(goal.progress || 0) >= 100}
                      >
                        <i className="bi bi-plus"></i> 10%
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => updateGoalProgress(goal.id, Math.max((goal.progress || 0) - 10, 0))}
                        disabled={(goal.progress || 0) <= 0}
                      >
                        <i className="bi bi-dash"></i> 10%
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Goal Modal */}
      {(showAddModal || editingGoal) && (
        <div className="modal-overlay" onClick={() => {
          setShowAddModal(false);
          setEditingGoal(null);
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingGoal ? 'Edit Goal' : 'Add New Goal'}</h3>
              <button
                className="btn btn-close"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingGoal(null);
                }}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Goal Title *</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingGoal ? editingGoal.title : newGoal.title}
                  onChange={(e) => {
                    if (editingGoal) {
                      setEditingGoal({...editingGoal, title: e.target.value});
                    } else {
                      setNewGoal({...newGoal, title: e.target.value});
                    }
                  }}
                  placeholder="Enter your goal title"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={editingGoal ? editingGoal.description : newGoal.description}
                  onChange={(e) => {
                    if (editingGoal) {
                      setEditingGoal({...editingGoal, description: e.target.value});
                    } else {
                      setNewGoal({...newGoal, description: e.target.value});
                    }
                  }}
                  placeholder="Describe your goal in detail"
                />
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      className="form-select"
                      value={editingGoal ? editingGoal.category : newGoal.category}
                      onChange={(e) => {
                        if (editingGoal) {
                          setEditingGoal({...editingGoal, category: e.target.value});
                        } else {
                          setNewGoal({...newGoal, category: e.target.value});
                        }
                      }}
                    >
                      <option value="personal">👤 Personal</option>
                      <option value="career">💼 Career</option>
                      <option value="health">❤️ Health</option>
                      <option value="finance">💰 Finance</option>
                      <option value="education">🎓 Education</option>
                      <option value="travel">✈️ Travel</option>
                    </select>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      className="form-select"
                      value={editingGoal ? editingGoal.priority : newGoal.priority}
                      onChange={(e) => {
                        if (editingGoal) {
                          setEditingGoal({...editingGoal, priority: e.target.value});
                        } else {
                          setNewGoal({...newGoal, priority: e.target.value});
                        }
                      }}
                    >
                      <option value="high">🔴 High</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="low">🟢 Low</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Target Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={editingGoal ? editingGoal.targetDate : newGoal.targetDate}
                  onChange={(e) => {
                    if (editingGoal) {
                      setEditingGoal({...editingGoal, targetDate: e.target.value});
                    } else {
                      setNewGoal({...newGoal, targetDate: e.target.value});
                    }
                  }}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingGoal(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={editingGoal ? handleUpdateGoal : handleAddGoal}
              >
                {editingGoal ? 'Update Goal' : 'Add Goal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
