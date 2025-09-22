import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
// import editingHabit from './editingHabit';
import '../styles/HabitTracker.css';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function HabitTracker() {
  const [habits, setHabits] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  // const [editingHabit, setEditingHabit] = useState(null);
  const [newHabit, setNewHabit] = useState({
    title: '',
    description: '',
    category: 'health',
    frequency: 'daily',
    targetCount: 1,
    color: '#667eea'
  });
  const [todayProgress, setTodayProgress] = useState({});

  // Fetch habits
  const fetchHabits = useCallback(() => {
    fetch('/habits', {
      headers: { ...authHeaders() }
    })
      .then(response => response.json())
      .then(data => {
        const habitsArray = Array.isArray(data) ? data : [];
        setHabits(habitsArray);

        // Initialize today's progress
        const today = new Date().toISOString().split('T')[0];
        const progress = {};
        habitsArray.forEach(habit => {
          progress[habit.id] = habit.progress?.[today] || 0;
        });
        setTodayProgress(progress);
      })
      .catch(() => {
        toast.error('Failed to fetch habits');
      });
  }, []);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  // Add new habit
  const handleAddHabit = () => {
    if (!newHabit.title.trim()) {
      toast.warning('Please enter a habit title');
      return;
    }

    const habitData = {
      ...newHabit,
      progress: {},
      streak: 0,
      createdAt: new Date().toISOString()
    };

    fetch('/habits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      },
      body: JSON.stringify(habitData)
    })
      .then(() => {
        fetchHabits();
        setShowAddModal(false);
        setNewHabit({
          title: '',
          description: '',
          category: 'health',
          frequency: 'daily',
          targetCount: 1,
          color: '#667eea'
        });
        toast.success('Habit added successfully!');
      })
      .catch(() => {
        toast.error('Failed to add habit');
      });
  };

  // Update habit progress
  const updateHabitProgress = (habitId, increment = 1) => {
    const today = new Date().toISOString().split('T')[0];
    const currentProgress = todayProgress[habitId] || 0;
    const newProgress = Math.max(0, Math.min(currentProgress + increment, newHabit.targetCount));

    setTodayProgress(prev => ({
      ...prev,
      [habitId]: newProgress
    }));

    // Save to backend
    fetch(`/habits/${habitId}/progress`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      },
      body: JSON.stringify({
        date: today,
        progress: newProgress
      })
    })
      .then(() => {
        fetchHabits(); // Refresh to get updated streak
        if (newProgress >= newHabit.targetCount) {
          toast.success('🎉 Habit completed for today!');
        }
      })
      .catch(() => {
        toast.error('Failed to update progress');
      });
  };

  // Delete habit
  const handleDeleteHabit = (habitId) => {
    if (!window.confirm('Are you sure you want to delete this habit?')) return;

    fetch(`/habits/${habitId}`, {
      method: 'DELETE',
      headers: { ...authHeaders() }
    })
      .then(() => {
        fetchHabits();
        toast.success('Habit deleted successfully!');
      })
      .catch(() => {
        toast.error('Failed to delete habit');
      });
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'health': return '💪';
      case 'productivity': return '⚡';
      case 'learning': return '📚';
      case 'mindfulness': return '🧘';
      case 'social': return '👥';
      case 'creative': return '🎨';
      default: return '📝';
    }
  };

  // Calculate streak
  const calculateStreak = (habit) => {
    // This would be calculated on the backend
    return habit.streak || 0;
  };

  // Get today's date
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="app-container habit-tracker-page">
      <div className="habit-tracker-header">
        <h1 className="title">
          <i className="bi bi-calendar-check me-2"></i>
          Habit Tracker
        </h1>
        <p className="subtitle">Build lasting habits, one day at a time</p>
        <p className="today-date">{today}</p>

        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Add New Habit
        </button>
      </div>

      <div className="habit-tracker-content">
        {habits.length === 0 ? (
          <div className="empty-habits">
            <i className="bi bi-calendar-check"></i>
            <h3>No habits yet</h3>
            <p>Start building positive habits by adding your first one</p>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              Create Your First Habit
            </button>
          </div>
        ) : (
          <div className="habits-grid">
            {habits.map(habit => {
              const progress = todayProgress[habit.id] || 0;
              const target = habit.targetCount || 1;
              const percentage = Math.min((progress / target) * 100, 100);
              const streak = calculateStreak(habit);

              return (
                <div key={habit.id} className="habit-card">
                  <div className="habit-header">
                    <div className="habit-icon">
                      {getCategoryIcon(habit.category)}
                    </div>

                    <div className="habit-actions">
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteHabit(habit.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>

                  <div className="habit-body">
                    <h3 className="habit-title">{habit.title}</h3>
                    <p className="habit-description">{habit.description}</p>

                    <div className="habit-meta">
                      <span
                        className="habit-category"
                        style={{ backgroundColor: habit.color + '20' }}
                      >
                        <span className="category-icon">{getCategoryIcon(habit.category)}</span>
                        {habit.category}
                      </span>

                      <span className="habit-frequency">
                        {habit.frequency}
                      </span>

                      {streak > 0 && (
                        <span className="habit-streak">
                          🔥 {streak} day streak
                        </span>
                      )}
                    </div>

                    <div className="habit-progress">
                      <div className="progress-info">
                        <span className="progress-text">
                          {progress} / {target}
                        </span>
                        <span className="progress-percentage">
                          {Math.round(percentage)}%
                        </span>
                      </div>

                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: habit.color
                          }}
                        ></div>
                      </div>

                      <div className="progress-controls">
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => updateHabitProgress(habit.id, 1)}
                          disabled={progress >= target}
                        >
                          <i className="bi bi-check2"></i>
                          Complete
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => updateHabitProgress(habit.id, -1)}
                          disabled={progress <= 0}
                        >
                          <i className="bi bi-arrow-counterclockwise"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Habit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Habit</h3>
              <button
                className="btn btn-close"
                onClick={() => setShowAddModal(false)}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Habit Title *</label>
                <input
                  type="text"
                  className="form-control"
                  value={newHabit.title}
                  onChange={(e) => setNewHabit({...newHabit, title: e.target.value})}
                  placeholder="e.g., Drink 8 glasses of water"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={newHabit.description}
                  onChange={(e) => setNewHabit({...newHabit, description: e.target.value})}
                  placeholder="Describe your habit"
                />
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      className="form-select"
                      value={newHabit.category}
                      onChange={(e) => setNewHabit({...newHabit, category: e.target.value})}
                    >
                      <option value="health">💪 Health</option>
                      <option value="productivity">⚡ Productivity</option>
                      <option value="learning">📚 Learning</option>
                      <option value="mindfulness">🧘 Mindfulness</option>
                      <option value="social">👥 Social</option>
                      <option value="creative">🎨 Creative</option>
                    </select>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group">
                    <label>Frequency</label>
                    <select
                      className="form-select"
                      value={newHabit.frequency}
                      onChange={(e) => setNewHabit({...newHabit, frequency: e.target.value})}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Daily Target</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max="10"
                  value={newHabit.targetCount}
                  onChange={(e) => setNewHabit({...newHabit, targetCount: parseInt(e.target.value) || 1})}
                />
              </div>

              <div className="form-group">
                <label>Color Theme</label>
                <div className="color-picker">
                  {[
                    '#667eea', '#764ba2', '#f093fb', '#f5576c',
                    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
                    '#fa709a', '#fee140', '#ff6b6b', '#4ecdc4'
                  ].map(color => (
                    <button
                      key={color}
                      className={`color-option ${newHabit.color === color ? 'active' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewHabit({...newHabit, color})}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddHabit}
              >
                Add Habit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
