import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import '../styles/Analytics.css';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState({
    overview: {
      total: 0,
      completed: 0,
      pending: 0,
      overdue: 0
    },
    categoryBreakdown: [],
    priorityBreakdown: [],
    completionTrend: [],
    upcomingDeadlines: [],
    prInsights: { frontend: 0, backend: 0 },
    notesInsights: { learning: 0, working: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('week');

  // Chart refs
  const completionChartRef = useRef(null);
  const categoryChartRef = useRef(null);
  const priorityChartRef = useRef(null);
  const trendChartRef = useRef(null);

  // Chart instances
  const completionChart = useRef(null);
  const categoryChart = useRef(null);
  const priorityChart = useRef(null);
  const trendChart = useRef(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeframe]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch tasks
      const tasksResponse = await fetch('/tasks', { headers: { ...authHeaders() } });
      const tasks = await tasksResponse.json();

      // Fetch PRs and Notes data
      const [prsResponse, notesResponse] = await Promise.all([
        fetch('/prs', { headers: { ...authHeaders() } }).catch(() => ({ json: () => [] })),
        fetch('/notes', { headers: { ...authHeaders() } }).catch(() => ({ json: () => [] }))
      ]);

      const prs = await prsResponse.json();
      const notes = await notesResponse.json();

      const processedData = processAnalyticsData(tasks, prs, notes);
      setAnalytics(processedData);

      setTimeout(() => {
        createCharts(processedData);
      }, 100);

    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (tasks, prs, notes) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Overview calculations
    const completed = tasks.filter(t => t.status === 'done').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const overdue = tasks.filter(t => {
      if (t.status === 'done' || !t.due_date) return false;
      const dueDate = new Date(t.due_date);
      return dueDate < today;
    }).length;

    // Category breakdown
    const categoryMap = {};
    tasks.forEach(task => {
      const category = task.category || 'other';
      categoryMap[category] = (categoryMap[category] || 0) + 1;
    });

    const categoryBreakdown = Object.entries(categoryMap).map(([category, count]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      count
    }));

    // Priority breakdown
    const priorityMap = {};
    tasks.forEach(task => {
      const priority = task.priority || 'medium';
      priorityMap[priority] = (priorityMap[priority] || 0) + 1;
    });

    const priorityBreakdown = Object.entries(priorityMap).map(([priority, count]) => ({
      priority: priority.charAt(0).toUpperCase() + priority.slice(1),
      count
    }));

    // Completion trend (last 7 days)
    const completionTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const completedTasks = tasks.filter(task => {
        if (task.status !== 'done') return false;
        const updatedDate = task.updated_at ? task.updated_at.split('T')[0] : task.created_at.split('T')[0];
        return updatedDate === dateStr;
      }).length;

      completionTrend.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        completed: completedTasks
      });
    }

    // Upcoming deadlines (next 7 days)
    const upcoming = [];
    for (let i = 0; i <= 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() + i);
      const checkDateStr = checkDate.toISOString().split('T')[0];

      tasks.forEach(task => {
        if (task.status === 'done' || !task.due_date) return;
        if (task.due_date === checkDateStr) {
          upcoming.push({
            ...task,
            daysUntilDue: i,
            isOverdue: i === 0 && new Date(task.due_date) < today
          });
        }
      });
    }

    upcoming.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

    // PR insights
    const prInsights = {
      frontend: prs.filter(pr => pr.frontend_status && pr.frontend_status !== 'none').length,
      backend: prs.filter(pr => pr.backend_status && pr.backend_status !== 'none').length
    };

    // Notes insights
    const notesInsights = {
      learning: notes.filter(note => note.type === 'learning').length,
      working: notes.filter(note => note.type === 'working').length
    };

    return {
      overview: {
        total: tasks.length,
        completed,
        pending,
        overdue
      },
      categoryBreakdown,
      priorityBreakdown,
      completionTrend,
      upcomingDeadlines: upcoming.slice(0, 10),
      prInsights,
      notesInsights
    };
  };

  const createCharts = (data) => {
    // Destroy existing charts
    [completionChart, categoryChart, priorityChart, trendChart].forEach(chart => {
      if (chart.current) {
        chart.current.destroy();
      }
    });

    // Completion Chart (Doughnut)
    if (completionChartRef.current) {
      const ctx = completionChartRef.current.getContext('2d');
      completionChart.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Completed', 'Pending', 'Overdue'],
          datasets: [{
            data: [data.overview.completed, data.overview.pending, data.overview.overdue],
            backgroundColor: [
              '#10b981', // Green for completed
              '#3b82f6', // Blue for pending
              '#ef4444'  // Red for overdue
            ],
            borderWidth: 0,
            hoverOffset: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                color: '#6b7280',
                font: { size: 12, weight: '600' },
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          },
          animation: {
            animateRotate: true,
            duration: 1000
          }
        }
      });
    }

    // Category Chart (Bar)
    if (categoryChartRef.current && data.categoryBreakdown.length > 0) {
      const ctx = categoryChartRef.current.getContext('2d');
      categoryChart.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.categoryBreakdown.map(item => item.category),
          datasets: [{
            label: 'Tasks by Category',
            data: data.categoryBreakdown.map(item => item.count),
            backgroundColor: '#3b82f6',
            borderRadius: 6,
            borderSkipped: false,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.label}: ${context.parsed.y} tasks`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
                color: '#6b7280',
                font: { size: 11 }
              },
              grid: { color: 'rgba(107, 114, 128, 0.1)' }
            },
            x: {
              ticks: {
                color: '#6b7280',
                font: { size: 11 }
              },
              grid: { display: false }
            }
          },
          animation: {
            duration: 1000,
            easing: 'easeOutQuart'
          }
        }
      });
    }

    // Priority Chart (Bar)
    if (priorityChartRef.current && data.priorityBreakdown.length > 0) {
      const ctx = priorityChartRef.current.getContext('2d');
      const priorityColors = {
        High: '#ef4444',
        Medium: '#f59e0b',
        Low: '#10b981'
      };

      priorityChart.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.priorityBreakdown.map(item => item.priority),
          datasets: [{
            label: 'Tasks by Priority',
            data: data.priorityBreakdown.map(item => item.count),
            backgroundColor: data.priorityBreakdown.map(item => priorityColors[item.priority] || '#6b7280'),
            borderRadius: 6,
            borderSkipped: false,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.label}: ${context.parsed.y} tasks`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
                color: '#6b7280',
                font: { size: 11 }
              },
              grid: { color: 'rgba(107, 114, 128, 0.1)' }
            },
            x: {
              ticks: {
                color: '#6b7280',
                font: { size: 11 }
              },
              grid: { display: false }
            }
          },
          animation: {
            duration: 1000,
            easing: 'easeOutQuart'
          }
        }
      });
    }

    // Trend Chart (Line/Area)
    if (trendChartRef.current && data.completionTrend.length > 0) {
      const ctx = trendChartRef.current.getContext('2d');
      trendChart.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.completionTrend.map(item => item.date),
          datasets: [{
            label: 'Tasks Completed',
            data: data.completionTrend.map(item => item.completed),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.parsed.y} tasks completed`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
                color: '#6b7280',
                font: { size: 11 }
              },
              grid: { color: 'rgba(107, 114, 128, 0.1)' }
            },
            x: {
              ticks: {
                color: '#6b7280',
                font: { size: 11 }
              },
              grid: { color: 'rgba(107, 114, 128, 0.05)' }
            }
          },
          animation: {
            duration: 1500,
            easing: 'easeOutQuart'
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        }
      });
    }
  };

  const getDeadlineColor = (task) => {
    if (task.isOverdue) return 'overdue';
    if (task.daysUntilDue <= 1) return 'urgent';
    if (task.daysUntilDue <= 3) return 'warning';
    return 'normal';
  };

  const formatDeadlineText = (task) => {
    if (task.isOverdue) return 'Overdue';
    if (task.daysUntilDue === 0) return 'Today';
    if (task.daysUntilDue === 1) return 'Tomorrow';
    return `${task.daysUntilDue} days`;
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-header">
          <h1 className="page-title">
            <i className="bi bi-graph-up"></i>
            Analytics Dashboard
          </h1>
          <p className="page-subtitle">Track your productivity and task insights</p>
        </div>

        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div className="header-content">
          <h1 className="page-title">
            <i className="bi bi-graph-up"></i>
            Analytics Dashboard
          </h1>
          <p className="page-subtitle">Track your productivity and task insights</p>
        </div>

        <div className="header-controls">
          <div className="timeframe-selector">
            <button
              className={`timeframe-btn ${timeframe === 'week' ? 'active' : ''}`}
              onClick={() => setTimeframe('week')}
            >
              Week
            </button>
            <button
              className={`timeframe-btn ${timeframe === 'month' ? 'active' : ''}`}
              onClick={() => setTimeframe('month')}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {/* Task Overview Cards */}
      <div className="overview-section">
        <div className="overview-cards">
          <div className="stat-card total">
            <div className="stat-icon">
              <i className="bi bi-list-task"></i>
            </div>
            <div className="stat-content">
              <div className="stat-number">{analytics.overview.total}</div>
              <div className="stat-label">Total Tasks</div>
              <div className="stat-change">All time</div>
            </div>
          </div>

          <div className="stat-card completed">
            <div className="stat-icon">
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <div className="stat-content">
              <div className="stat-number">{analytics.overview.completed}</div>
              <div className="stat-label">Completed</div>
              <div className="stat-change">
                {analytics.overview.total > 0
                  ? `${Math.round((analytics.overview.completed / analytics.overview.total) * 100)}% completion rate`
                  : '0% completion rate'
                }
              </div>
            </div>
          </div>

          <div className="stat-card pending">
            <div className="stat-icon">
              <i className="bi bi-clock"></i>
            </div>
            <div className="stat-content">
              <div className="stat-number">{analytics.overview.pending}</div>
              <div className="stat-label">Pending</div>
              <div className="stat-change">In progress</div>
            </div>
          </div>

          <div className="stat-card overdue">
            <div className="stat-icon">
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
            <div className="stat-content">
              <div className="stat-number">{analytics.overview.overdue}</div>
              <div className="stat-label">Overdue</div>
              <div className="stat-change">Needs attention</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="charts-grid">
          {/* Completion Chart */}
          <div className="chart-card completion-chart">
            <div className="chart-header">
              <h3 className="chart-title">Task Completion Overview</h3>
              <div className="chart-subtitle">Distribution of task statuses</div>
            </div>
            <div className="chart-container">
              <canvas ref={completionChartRef}></canvas>
            </div>
          </div>

          {/* Daily Trend Chart */}
          <div className="chart-card trend-chart">
            <div className="chart-header">
              <h3 className="chart-title">Daily Completion Trend</h3>
              <div className="chart-subtitle">Tasks completed over the last 7 days</div>
            </div>
            <div className="chart-container">
              <canvas ref={trendChartRef}></canvas>
            </div>
          </div>

          {/* Category Chart */}
          <div className="chart-card category-chart">
            <div className="chart-header">
              <h3 className="chart-title">Tasks by Category</h3>
              <div className="chart-subtitle">Distribution across different categories</div>
            </div>
            <div className="chart-container">
              <canvas ref={categoryChartRef}></canvas>
            </div>
          </div>

          {/* Priority Chart */}
          <div className="chart-card priority-chart">
            <div className="chart-header">
              <h3 className="chart-title">Tasks by Priority</h3>
              <div className="chart-subtitle">Priority level distribution</div>
            </div>
            <div className="chart-container">
              <canvas ref={priorityChartRef}></canvas>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="bottom-section">
        {/* Upcoming Deadlines */}
        <div className="deadlines-section">
          <div className="section-header">
            <h3 className="section-title">
              <i className="bi bi-calendar-week"></i>
              Upcoming Deadlines
            </h3>
            <div className="section-subtitle">Tasks due in the next 7 days</div>
          </div>

          {analytics.upcomingDeadlines.length > 0 ? (
            <div className="deadlines-table">
              <div className="table-header">
                <div className="col-task">Task</div>
                <div className="col-category">Category</div>
                <div className="col-priority">Priority</div>
                <div className="col-due">Due</div>
              </div>
              <div className="table-body">
                {analytics.upcomingDeadlines.map(task => (
                  <div key={task.id} className={`table-row ${getDeadlineColor(task)}`}>
                    <div className="col-task">
                      <div className="task-title">{task.title}</div>
                      {task.description && (
                        <div className="task-description">{task.description}</div>
                      )}
                    </div>
                    <div className="col-category">
                      <span className="category-badge">
                        {task.category || 'Other'}
                      </span>
                    </div>
                    <div className="col-priority">
                      <span className={`priority-badge ${task.priority || 'medium'}`}>
                        {task.priority || 'Medium'}
                      </span>
                    </div>
                    <div className="col-due">
                      <span className={`due-badge ${getDeadlineColor(task)}`}>
                        {formatDeadlineText(task)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <i className="bi bi-calendar-check"></i>
              <p>No upcoming deadlines</p>
              <span>All caught up!</span>
            </div>
          )}
        </div>

        {/* Insights Cards */}
        <div className="insights-section">
          <div className="section-header">
            <h3 className="section-title">
              <i className="bi bi-lightbulb"></i>
              Additional Insights
            </h3>
          </div>

          <div className="insights-cards">
            <div className="insight-card pr-insights">
              <div className="insight-header">
                <i className="bi bi-git"></i>
                <h4>PR Management</h4>
              </div>
              <div className="insight-stats">
                <div className="insight-stat">
                  <span className="stat-number">{analytics.prInsights.frontend}</span>
                  <span className="stat-label">Frontend PRs</span>
                </div>
                <div className="insight-stat">
                  <span className="stat-number">{analytics.prInsights.backend}</span>
                  <span className="stat-label">Backend PRs</span>
                </div>
              </div>
            </div>

            <div className="insight-card notes-insights">
              <div className="insight-header">
                <i className="bi bi-journal-text"></i>
                <h4>Notes</h4>
              </div>
              <div className="insight-stats">
                <div className="insight-stat">
                  <span className="stat-number">{analytics.notesInsights.learning}</span>
                  <span className="stat-label">Learning Notes</span>
                </div>
                <div className="insight-stat">
                  <span className="stat-number">{analytics.notesInsights.working}</span>
                  <span className="stat-label">Working Notes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}