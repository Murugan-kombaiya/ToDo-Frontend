import React from 'react';
import ThemeToggle from './ThemeToggle';
import './ThemeExample.css';

const ThemeExample = () => {
  return (
    <div className="theme-example">
      <div className="theme-example-header">
        <h1 className="text-primary">Modern ToDo Theme System</h1>
        <ThemeToggle className="header" />
      </div>

      <div className="theme-example-content">
        {/* Cards Example */}
        <section className="theme-section">
          <h2 className="text-secondary">Card Examples</h2>
          <div className="cards-grid">
            <div className="card example-card">
              <h3 className="text-primary">Todo Item</h3>
              <p className="text-secondary">Complete project documentation</p>
              <div className="card-footer">
                <span className="priority-high">High Priority</span>
                <span className="status-in-progress">In Progress</span>
              </div>
            </div>

            <div className="card example-card active">
              <h3 className="text-primary">Active Card</h3>
              <p className="text-secondary">This card is selected/active</p>
              <div className="card-footer">
                <span className="priority-medium">Medium Priority</span>
                <span className="status-completed">Completed</span>
              </div>
            </div>

            <div className="card example-card">
              <h3 className="text-primary">Another Task</h3>
              <p className="text-secondary">Review design mockups</p>
              <div className="card-footer">
                <span className="priority-low">Low Priority</span>
                <span className="status-pending">Pending</span>
              </div>
            </div>
          </div>
        </section>

        {/* Buttons Example */}
        <section className="theme-section">
          <h2 className="text-secondary">Button Examples</h2>
          <div className="buttons-grid">
            <button className="btn btn-primary">Primary Action</button>
            <button className="btn btn-secondary">Secondary</button>
            <button className="btn btn-success">Success</button>
            <button className="btn btn-warning">Warning</button>
            <button className="btn btn-danger">Danger</button>
          </div>
        </section>

        {/* Form Example */}
        <section className="theme-section">
          <h2 className="text-secondary">Form Examples</h2>
          <div className="form-example">
            <div className="form-group">
              <label className="text-primary">Task Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter task title..."
              />
            </div>

            <div className="form-group">
              <label className="text-primary">Description</label>
              <textarea
                className="form-textarea"
                placeholder="Enter task description..."
                rows="3"
              ></textarea>
            </div>

            <div className="form-group">
              <label className="text-primary">Priority</label>
              <select className="form-select">
                <option>Select priority...</option>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </div>
          </div>
        </section>

        {/* Status Indicators */}
        <section className="theme-section">
          <h2 className="text-secondary">Status & Priority Indicators</h2>
          <div className="indicators-grid">
            <div className="indicator-group">
              <h4 className="text-primary">Status</h4>
              <div className="status-list">
                <span className="status-badge status-pending">Pending</span>
                <span className="status-badge status-in-progress">In Progress</span>
                <span className="status-badge status-completed">Completed</span>
                <span className="status-badge status-overdue">Overdue</span>
              </div>
            </div>

            <div className="indicator-group">
              <h4 className="text-primary">Priority</h4>
              <div className="priority-list">
                <span className="priority-badge priority-low">Low</span>
                <span className="priority-badge priority-medium">Medium</span>
                <span className="priority-badge priority-high">High</span>
                <span className="priority-badge priority-critical">Critical</span>
              </div>
            </div>
          </div>
        </section>

        {/* Glass Effect Example */}
        <section className="theme-section">
          <h2 className="text-secondary">Glass Morphism Effect</h2>
          <div className="glass-container">
            <div className="glass glass-card">
              <h3 className="text-primary">Glass Card</h3>
              <p className="text-secondary">This card uses the glass morphism effect with backdrop blur</p>
              <button className="btn btn-primary">Glass Action</button>
            </div>
          </div>
        </section>
      </div>

      {/* Floating Theme Toggle */}
      <ThemeToggle className="floating glow" />
    </div>
  );
};

export default ThemeExample;