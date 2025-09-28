import React, { useState } from 'react';
import ResponsiveDropdown from './ResponsiveDropdown';

/**
 * Example component showing how to use ResponsiveDropdown
 * This demonstrates all the features and use cases
 */
const ResponsiveDropdownExample = () => {
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [sessionType, setSessionType] = useState('');
  const [project, setProject] = useState('');

  // Example options for different dropdown types
  const categoryOptions = [
    { value: 'work', label: '💼 Work', icon: '💼' },
    { value: 'study', label: '📚 Study', icon: '📚' },
    { value: 'exercise', label: '🏃 Exercise', icon: '🏃' },
    { value: 'personal', label: '👤 Personal', icon: '👤' },
    { value: 'meeting', label: '📅 Meeting', icon: '📅' },
    { value: 'break', label: '☕ Break', icon: '☕' },
  ];

  const priorityOptions = [
    { value: 'high', label: '🔴 High Priority', icon: '🔴' },
    { value: 'medium', label: '🟡 Medium Priority', icon: '🟡' },
    { value: 'low', label: '🟢 Low Priority', icon: '🟢' },
  ];

  const sessionTypeOptions = [
    { value: 'work', label: 'Work Session' },
    { value: 'study', label: 'Study Session' },
    { value: 'exercise', label: 'Exercise Session' },
    { value: 'break', label: 'Break Time' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'personal', label: 'Personal Time' },
  ];

  const projectOptions = [
    { value: 'project1', label: 'Todo App Development' },
    { value: 'project2', label: 'Website Redesign' },
    { value: 'project3', label: 'Mobile App' },
    { value: 'project4', label: 'API Documentation' },
    { value: 'project5', label: 'Database Migration' },
    { value: 'project6', label: 'Testing Framework' },
    { value: 'project7', label: 'Security Audit' },
    { value: 'project8', label: 'Performance Optimization' },
  ];

  return (
    <div className="responsive-dropdown-examples" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Responsive Dropdown Examples</h2>
      <p>These dropdowns are fully responsive and prevent overflow on all screen sizes.</p>

      <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>

        {/* Basic Category Dropdown */}
        <ResponsiveDropdown
          label="Task Category"
          value={category}
          onChange={setCategory}
          options={categoryOptions}
          placeholder="Select a category..."
          required
        />

        {/* Priority Dropdown with Icons */}
        <ResponsiveDropdown
          label="Priority Level"
          value={priority}
          onChange={setPriority}
          options={priorityOptions}
          placeholder="Choose priority..."
          size="lg"
        />

        {/* Searchable Session Type */}
        <ResponsiveDropdown
          label="Session Type"
          value={sessionType}
          onChange={setSessionType}
          options={sessionTypeOptions}
          placeholder="Select session type..."
          searchable
          helperText="Start typing to filter options"
        />

        {/* Long List with Scrolling */}
        <ResponsiveDropdown
          label="Project"
          value={project}
          onChange={setProject}
          options={projectOptions}
          placeholder="Choose a project..."
          searchable
          maxHeight={150}
          helperText="Scrollable list with search"
        />

        {/* Small Size Example */}
        <ResponsiveDropdown
          label="Small Dropdown"
          value={category}
          onChange={setCategory}
          options={categoryOptions.slice(0, 3)}
          placeholder="Small size..."
          size="sm"
        />

        {/* Disabled Example */}
        <ResponsiveDropdown
          label="Disabled Dropdown"
          value=""
          onChange={() => {}}
          options={categoryOptions}
          placeholder="This is disabled"
          disabled
          helperText="This dropdown is disabled"
        />

      </div>

      {/* Current Values Display */}
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
        <h3>Current Values:</h3>
        <ul>
          <li>Category: {category || 'None selected'}</li>
          <li>Priority: {priority || 'None selected'}</li>
          <li>Session Type: {sessionType || 'None selected'}</li>
          <li>Project: {project || 'None selected'}</li>
        </ul>
      </div>

      {/* Usage Instructions */}
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#eff6ff', borderRadius: '8px' }}>
        <h3>How to Use ResponsiveDropdown:</h3>
        <pre style={{ background: '#1f2937', color: '#e5e7eb', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
{`// Basic usage
<ResponsiveDropdown
  label="Category"
  value={category}
  onChange={setCategory}
  options={[
    { value: 'work', label: 'Work', icon: '💼' },
    { value: 'study', label: 'Study', icon: '📚' }
  ]}
  placeholder="Select category..."
  required
/>

// With search and custom height
<ResponsiveDropdown
  label="Project"
  value={project}
  onChange={setProject}
  options={projectOptions}
  searchable
  maxHeight={200}
  helperText="Start typing to search"
/>`}
        </pre>
      </div>
    </div>
  );
};

export default ResponsiveDropdownExample;