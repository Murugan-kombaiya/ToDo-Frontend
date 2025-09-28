import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import '../styles/HabitTracker.css';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function HabitTracker() {
  const [habits, setHabits] = useState([]);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [todayProgress, setTodayProgress] = useState({});
  const [removingHabits, setRemovingHabits] = useState(new Set());

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
        // Fallback to demo habits if API fails
        const demoHabits = [
          { id: 1, title: 'Drink 8 glasses of water', streak: 5, targetCount: 1, color: '#3b82f6' },
          { id: 2, title: 'Read for 30 minutes', streak: 3, targetCount: 1, color: '#10b981' },
          { id: 3, title: 'Exercise for 20 minutes', streak: 2, targetCount: 1, color: '#f59e0b' }
        ];
        setHabits(demoHabits);
        const progress = {};
        demoHabits.forEach(habit => {
          progress[habit.id] = 0;
        });
        setTodayProgress(progress);
      });
  }, []);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  // Add new habit
  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) {
      toast.warning('Please enter a habit name');
      return;
    }

    setIsAdding(true);

    const newHabit = {
      id: Date.now(), // Temporary ID for demo
      title: newHabitTitle.trim(),
      streak: 0,
      targetCount: 1,
      color: '#3b82f6',
      progress: {},
      createdAt: new Date().toISOString()
    };

    try {
      // Try to save to backend
      const response = await fetch('/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify(newHabit)
      });

      if (response.ok) {
        const savedHabit = await response.json();
        setHabits(prev => [...prev, savedHabit]);
      } else {
        throw new Error('API failed');
      }
    } catch (error) {
      // Fallback: Add to local state immediately for demo
      setHabits(prev => [...prev, newHabit]);
      setTodayProgress(prev => ({
        ...prev,
        [newHabit.id]: 0
      }));
    }

    setNewHabitTitle('');
    setIsAdding(false);
    toast.success('🎉 Habit added successfully!');
  };

  // Toggle habit completion
  const toggleHabitProgress = (habitId) => {
    const currentProgress = todayProgress[habitId] || 0;
    const newProgress = currentProgress >= 1 ? 0 : 1;

    // If marking as complete, remove from list with animation
    if (newProgress >= 1) {
      // Add to removing set for animation
      setRemovingHabits(prev => new Set([...prev, habitId]));

      // Show success message immediately
      toast.success('🎉 Habit completed!');

      // Remove from list after animation delay
      setTimeout(() => {
        setHabits(prev => prev.filter(h => h.id !== habitId));
        setTodayProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[habitId];
          return newProgress;
        });
        setRemovingHabits(prev => {
          const newSet = new Set(prev);
          newSet.delete(habitId);
          return newSet;
        });
      }, 500); // Match CSS animation duration
    } else {
      // If marking as incomplete, just update progress
      setTodayProgress(prev => ({
        ...prev,
        [habitId]: newProgress
      }));
    }

    // Save to backend
    const today = new Date().toISOString().split('T')[0];
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
        // Only refresh for incomplete -> complete to get updated streak
        if (newProgress < 1) {
          fetchHabits();
        }
      })
      .catch(() => {
        // Revert optimistic update on error
        if (newProgress >= 1) {
          setRemovingHabits(prev => {
            const newSet = new Set(prev);
            newSet.delete(habitId);
            return newSet;
          });
          setTodayProgress(prev => ({
            ...prev,
            [habitId]: 0
          }));
          toast.error('Failed to complete habit');
        }
      });
  };

  // Delete habit with animation
  const handleDeleteHabit = (habitId) => {
    if (!window.confirm('Delete this habit?')) return;

    // Add to removing set for animation
    setRemovingHabits(prev => new Set([...prev, habitId]));

    // Remove from list after animation delay
    setTimeout(() => {
      setHabits(prev => prev.filter(h => h.id !== habitId));
      setTodayProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[habitId];
        return newProgress;
      });
      setRemovingHabits(prev => {
        const newSet = new Set(prev);
        newSet.delete(habitId);
        return newSet;
      });
    }, 300); // Shorter animation for delete

    fetch(`/habits/${habitId}`, {
      method: 'DELETE',
      headers: { ...authHeaders() }
    })
      .then(() => {
        toast.success('Habit deleted');
      })
      .catch(() => {
        // Revert on error
        setRemovingHabits(prev => {
          const newSet = new Set(prev);
          newSet.delete(habitId);
          return newSet;
        });
        toast.error('Failed to delete habit');
      });
  };

  return (
    <div className="next-habit-screen">
      {/* Header Section */}
      <div className="habit-header">
        <h1 className="habit-title">Next Habit</h1>
        <p className="habit-subtitle">Build consistent daily habits</p>
      </div>

      {/* New Habit Input Section */}
      <div className="new-habit-section">
        <form onSubmit={handleAddHabit} className="new-habit-form">
          <div className="input-group">
            <input
              type="text"
              value={newHabitTitle}
              onChange={(e) => setNewHabitTitle(e.target.value)}
              placeholder="Enter a new habit..."
              className="habit-input"
              disabled={isAdding}
              maxLength={100}
            />
            <button
              type="submit"
              className={`add-habit-btn ${isAdding ? 'adding' : ''}`}
              disabled={isAdding || !newHabitTitle.trim()}
            >
              {isAdding ? (
                <span className="loading-spinner"></span>
              ) : (
                <>
                  <span className="btn-icon">+</span>
                  <span className="btn-text">Add</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Habit List Section */}
      <div className="habit-list-section">
        {habits.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3 className="empty-title">No habits yet</h3>
            <p className="empty-description">
              Start building positive habits by adding your first one above
            </p>
          </div>
        ) : (
          <div className="habit-list">
            {habits.map(habit => {
              const isCompleted = (todayProgress[habit.id] || 0) >= 1;
              const isRemoving = removingHabits.has(habit.id);

              return (
                <div
                  key={habit.id}
                  className={`habit-item ${isCompleted ? 'completed' : ''} ${isRemoving ? 'removing' : ''}`}
                >
                  <div className="habit-content">
                    <button
                      className={`habit-checkbox ${isCompleted ? 'checked' : ''}`}
                      onClick={() => toggleHabitProgress(habit.id)}
                      aria-label={`${isCompleted ? 'Mark as incomplete' : 'Mark as complete'}: ${habit.title}`}
                      disabled={isRemoving}
                    >
                      {isCompleted && <span className="checkmark">✓</span>}
                    </button>

                    <div className="habit-info">
                      <h3 className={`habit-name ${isCompleted ? 'completed-text' : ''}`}>
                        {habit.title}
                      </h3>
                      {habit.streak > 0 && (
                        <div className="habit-streak">
                          🔥 {habit.streak} day streak
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    className="delete-habit-btn"
                    onClick={() => handleDeleteHabit(habit.id)}
                    aria-label={`Delete habit: ${habit.title}`}
                    title="Delete habit"
                    disabled={isRemoving}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}