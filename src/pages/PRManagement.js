import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import '../styles/PRManagement.css';

export default function PRManagement() {
  const [prs, setPrs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'frontend',
    status: 'pending',
    frontend_link: '',
    backend_link: ''
  });

  useEffect(() => {
    fetchPRs();
  }, []);

  const fetchPRs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/prs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPrs(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch PRs');
        setPrs([]);
      }
    } catch (error) {
      console.error('PR fetch error:', error);
      setPrs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPR = () => {
    console.log('Add PR button clicked!');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ title: '', type: 'frontend', status: 'pending', frontend_link: '', backend_link: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.warning('Please enter a PR title');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/prs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          type: formData.type,
          status: formData.status,
          frontend_status: formData.type === 'frontend' ? formData.status : 'none',
          backend_status: formData.type === 'backend' ? formData.status : 'none',
          frontend_link: formData.frontend_link.trim(),
          backend_link: formData.backend_link.trim()
        })
      });

      if (response.ok) {
        toast.success('PR created successfully!');
        handleCloseModal();
        fetchPRs(); // Refresh the list
      } else {
        toast.error('Failed to create PR. Please try again.');
      }
    } catch (error) {
      console.error('PR creation error:', error);
      toast.error(`Network error. Failed to create PR: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (prId) => {
    if (pendingDeleteId === prId) {
      // Second click - actually delete
      setPendingDeleteId(null);
      try {
        const response = await fetch(`/prs/${prId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
          }
        });

        if (response.ok) {
          toast.success('PR deleted successfully!');
          fetchPRs();
        } else {
          toast.error('Failed to delete PR. Please try again.');
        }
      } catch (error) {
        console.error('PR deletion error:', error);
        toast.error('Network error. Failed to delete PR.');
      }
    } else {
      // First click - show warning and set pending
      setPendingDeleteId(prId);
      toast.warning('Click delete again to confirm deletion', {
        toastId: `delete-warning-${prId}`,
      });

      // Auto-reset after 5 seconds
      setTimeout(() => {
        setPendingDeleteId(null);
      }, 5000);
    }
  };

  // Enhanced download functionality with multiple formats and dynamic column sizing
  const handleDownload = (format = 'csv') => {
    if (prs.length < 10) {
      toast.info(`You need at least 10 PRs to download. You currently have ${prs.length} PRs.`);
      return;
    }

    console.log('Generating download for', prs.length, 'PRs in', format, 'format...');

    // Calculate optimal column widths based on actual link lengths
    const calculateColumnWidths = () => {
      let maxTitleLength = 'Title'.length;
      let maxFrontendLength = 'Frontend PR'.length;
      let maxBackendLength = 'Backend PR'.length;

      prs.forEach(pr => {
        maxTitleLength = Math.max(maxTitleLength, (pr.title || '').length);

        // Only consider actual link lengths, not status text
        if (pr.frontend_link) {
          maxFrontendLength = Math.max(maxFrontendLength, pr.frontend_link.length);
        }

        if (pr.backend_link) {
          maxBackendLength = Math.max(maxBackendLength, pr.backend_link.length);
        }
      });

      // Dynamic sizing - longer links get more space
      const totalLength = maxTitleLength + maxFrontendLength + maxBackendLength;
      const minColumnSize = 15; // minimum percentage for any column

      let titlePercent = Math.max(minColumnSize, (maxTitleLength / totalLength) * 100);
      let frontendPercent = Math.max(minColumnSize, (maxFrontendLength / totalLength) * 100);
      let backendPercent = Math.max(minColumnSize, (maxBackendLength / totalLength) * 100);

      // Ensure total doesn't exceed 100%
      const total = titlePercent + frontendPercent + backendPercent;
      if (total > 100) {
        const scale = 100 / total;
        titlePercent *= scale;
        frontendPercent *= scale;
        backendPercent *= scale;
      }

      return {
        title: Math.round(titlePercent),
        frontend: Math.round(frontendPercent),
        backend: Math.round(backendPercent)
      };
    };

    const columnWidths = calculateColumnWidths();

    if (format === 'csv') {
      // Enhanced CSV with better formatting
      let csvContent = '\ufeff'; // BOM for proper UTF-8 encoding
      csvContent += 'Title,Frontend PR,Backend PR\n';

      prs.forEach(pr => {
        // Clean and escape data
        const title = `"${(pr.title || '').replace(/"/g, '""').trim()}"`;

        // Only show actual links, not status - empty if no link
        const frontendPR = pr.frontend_link
          ? `"${pr.frontend_link.replace(/"/g, '""').trim()}"`
          : '""';

        const backendPR = pr.backend_link
          ? `"${pr.backend_link.replace(/"/g, '""').trim()}"`
          : '""';

        csvContent += `${title},${frontendPR},${backendPR}\n`;
      });

      // Create and download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      downloadFile(blob, 'csv', columnWidths);

    } else if (format === 'html') {
      // HTML table with responsive design and proper column sizing
      let htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>PR Management Export - ${new Date().toLocaleDateString()}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 20px;
              background-color: #f8fafc;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding: 20px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header h1 {
              color: #1e293b;
              margin: 0 0 10px 0;
              font-size: 2rem;
            }
            .header p {
              color: #64748b;
              margin: 0;
              font-size: 1.1rem;
            }
            .table-container {
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 14px;
            }
            th {
              background-color: #f8fafc;
              color: #374151;
              font-weight: 600;
              padding: 15px;
              text-align: left;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              font-size: 0.9rem;
              border-bottom: 2px solid #e5e7eb;
            }
            td {
              padding: 15px;
              border-bottom: 1px solid #e5e7eb;
              vertical-align: top;
              word-wrap: break-word;
            }
            tr:hover {
              background-color: #f8fafc;
            }
            .title-column {
              width: ${columnWidths.title}%;
              font-weight: 500;
              color: #1e293b;
            }
            .frontend-column {
              width: ${columnWidths.frontend}%;
              max-width: 300px;
            }
            .backend-column {
              width: ${columnWidths.backend}%;
              max-width: 300px;
            }
            .pr-link {
              color: #3b82f6;
              text-decoration: none;
              word-break: break-all;
              display: inline-block;
              max-width: 100%;
            }
            .pr-link:hover {
              text-decoration: underline;
            }
            .frontend-link {
              color: #8b5cf6;
            }
            .backend-link {
              color: #06b6d4;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 0.8rem;
              font-weight: 500;
              color: white;
              margin-top: 5px;
            }
            .status-pending { background-color: #f59e0b; }
            .status-in_progress { background-color: #3b82f6; }
            .status-completed { background-color: #10b981; }
            .status-blocked { background-color: #ef4444; }
            .empty-cell {
              color: #9ca3af;
              font-style: italic;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding: 20px;
              background: white;
              border-radius: 8px;
              color: #64748b;
              font-size: 0.9rem;
            }
            @media (max-width: 768px) {
              body { margin: 10px; }
              table { font-size: 12px; }
              th, td { padding: 10px; }
              .header h1 { font-size: 1.5rem; }
            }
            @media print {
              body { background: white; margin: 0; }
              .table-container, .header, .footer { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔄 PR Management Export</h1>
            <p>Generated on ${new Date().toLocaleDateString()} • ${prs.length} Pull Requests</p>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th class="title-column">Title</th>
                  <th class="frontend-column">Frontend PR</th>
                  <th class="backend-column">Backend PR</th>
                </tr>
              </thead>
              <tbody>`;

      prs.forEach(pr => {
        htmlContent += '<tr>';

        // Title column
        htmlContent += `<td class="title-column">${pr.title || 'Untitled'}</td>`;

        // Frontend PR column - only show actual links
        htmlContent += '<td class="frontend-column">';
        if (pr.frontend_link) {
          htmlContent += `<a href="${pr.frontend_link}" class="pr-link frontend-link" target="_blank" title="${pr.frontend_link}">🔗 Frontend PR</a>`;
          htmlContent += `<div style="font-size: 0.75rem; color: #6b7280; margin-top: 3px; word-break: break-all;">${pr.frontend_link}</div>`;
        } else {
          htmlContent += '<span class="empty-cell">No Link</span>';
        }
        htmlContent += '</td>';

        // Backend PR column - only show actual links
        htmlContent += '<td class="backend-column">';
        if (pr.backend_link) {
          htmlContent += `<a href="${pr.backend_link}" class="pr-link backend-link" target="_blank" title="${pr.backend_link}">🔗 Backend PR</a>`;
          htmlContent += `<div style="font-size: 0.75rem; color: #6b7280; margin-top: 3px; word-break: break-all;">${pr.backend_link}</div>`;
        } else {
          htmlContent += '<span class="empty-cell">No Link</span>';
        }
        htmlContent += '</td>';

        htmlContent += '</tr>';
      });

      htmlContent += `
              </tbody>
            </table>
          </div>
          <div class="footer">
            <p>This table is responsive and optimized for viewing on all devices. Print-friendly styling included.</p>
          </div>
        </body>
        </html>`;

      // Create and download HTML
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      downloadFile(blob, 'html');
    }
  };

  // Helper function to handle file download
  const downloadFile = (blob, format) => {
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `PRs-Export-${timestamp}.${format}`;

      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 100);

      // Enhanced success message with format-specific info
      const frontendCount = prs.filter(pr => pr.frontend_link || pr.type === 'frontend').length;
      const backendCount = prs.filter(pr => pr.backend_link || pr.type === 'backend').length;

      let formatInfo = '';
      if (format === 'csv') {
        formatInfo = 'Optimized for Excel, Google Sheets, and other spreadsheet applications.';
      } else if (format === 'html') {
        formatInfo = 'Responsive HTML table with clickable links, perfect for sharing and printing.';
      }

      toast.success(`Download Complete! ${filename} - ${prs.length} PRs downloaded`);
    } else {
      toast.error('Your browser does not support file downloads.');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="pr-page-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '2rem', color: '#1e293b' }}>
            🔄 PR Management
          </h1>
          <p style={{ margin: '0', color: '#64748b', fontSize: '1.1rem' }}>
            Track your Frontend and Backend Pull Request progress
          </p>
        </div>
        <div className="pr-header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {prs.length >= 10 && (
            <div className="pr-header-btn-group">
              <button
                onClick={() => handleDownload('csv')}
                disabled={loading}
                className={`pr-header-btn pr-header-btn-success pr-header-btn-compact ${loading ? 'pr-header-btn-loading' : ''}`}
                title="Download as CSV"
                aria-label={`Download ${prs.length} PRs as CSV file`}
              >
                <span className="pr-header-btn-icon">📊</span>
                <span className="pr-header-btn-text">CSV ({prs.length})</span>
              </button>
              <button
                onClick={() => handleDownload('html')}
                disabled={loading}
                className={`pr-header-btn pr-header-btn-info pr-header-btn-compact ${loading ? 'pr-header-btn-loading' : ''}`}
                title="Download as responsive HTML table"
                aria-label="Download PRs as HTML table"
              >
                <span className="pr-header-btn-icon">🌐</span>
                <span className="pr-header-btn-text">HTML</span>
              </button>
            </div>
          )}

          <button
            onClick={handleAddPR}
            disabled={submitting}
            className={`pr-header-btn pr-header-btn-primary ${submitting ? 'pr-header-btn-loading' : ''}`}
            title="Create a new pull request"
            aria-label="Add new pull request"
          >
            <span className="pr-header-btn-icon">➕</span>
            <span className="pr-header-btn-text">{submitting ? 'Processing...' : 'Add PR'}</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6', marginBottom: '8px' }}>
            {prs.length}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>
            Total PRs
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>
            {prs.filter(pr => pr.status === 'completed' || pr.frontend_status === 'completed' || pr.backend_status === 'completed').length}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>
            Completed
          </div>
        </div>

        <div style={{
          backgroundColor: prs.length >= 10 ? '#f0fdf4' : '#fef2f2',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center',
          border: `2px solid ${prs.length >= 10 ? '#22c55e' : '#ef4444'}`,
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: prs.length >= 10 ? '#22c55e' : '#ef4444', marginBottom: '8px' }}>
            {prs.length >= 10 ? '✅' : '⏳'}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>
            {prs.length >= 10 ? 'Download Ready' : `${10 - prs.length} more for download`}
          </div>
        </div>
      </div>

      {/* PR List */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div>Loading PRs...</div>
            </div>
          ) : prs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📋</div>
              <h3 style={{ marginBottom: '10px', color: '#1e293b' }}>No PRs yet</h3>
              <p style={{ color: '#64748b', marginBottom: '30px' }}>
                Create your first PR to start tracking your development progress!
              </p>
              <button
                onClick={handleAddPR}
                className="pr-header-btn pr-header-btn-primary pr-header-btn-large"
                aria-label="Add your first pull request"
              >
                <span className="pr-header-btn-icon">➕</span>
                <span className="pr-header-btn-text">Add Your First PR</span>
              </button>
            </div>
          ) : (
            <div className="pr-table-container">
              {/* Desktop/Tablet Table View */}
              <div className="pr-table-desktop">
                <table className="pr-table">
                  <thead>
                    <tr>
                      <th className="pr-th title-col">Title</th>
                      <th className="pr-th frontend-col">Frontend PR</th>
                      <th className="pr-th backend-col">Backend PR</th>
                      <th className="pr-th action-col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prs.map((pr, index) => (
                      <tr key={pr.id || index} className="pr-row">
                        <td className="pr-td title-cell">
                          <div className="pr-title">{pr.title}</div>
                        </td>
                        <td className="pr-td frontend-cell">
                          {pr.frontend_link ? (
                            <a
                              href={pr.frontend_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="pr-link frontend-link"
                              title={pr.frontend_link}
                            >
                              <span className="pr-link-icon">🔗</span>
                              <span className="pr-link-text">Frontend PR</span>
                            </a>
                          ) : (
                            <span className="pr-no-link">No Link</span>
                          )}
                        </td>
                        <td className="pr-td backend-cell">
                          {pr.backend_link ? (
                            <a
                              href={pr.backend_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="pr-link backend-link"
                              title={pr.backend_link}
                            >
                              <span className="pr-link-icon">🔗</span>
                              <span className="pr-link-text">Backend PR</span>
                            </a>
                          ) : (
                            <span className="pr-no-link">No Link</span>
                          )}
                        </td>
                        <td className="pr-td action-cell">
                          <button
                            onClick={() => handleDelete(pr.id)}
                            className={`pr-action-btn delete-btn ${pendingDeleteId === pr.id ? 'pending-delete' : ''}`}
                            title={pendingDeleteId === pr.id ? 'Click again to confirm delete' : 'Delete PR'}
                            aria-label={`Delete ${pr.title}`}
                          >
                            <span className="pr-action-icon">🗑️</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="pr-table-mobile">
                {prs.map((pr, index) => (
                  <div key={pr.id || index} className="pr-card">
                    <div className="pr-card-header">
                      <h3 className="pr-card-title">{pr.title}</h3>
                      <button
                        onClick={() => handleDelete(pr.id)}
                        className={`pr-action-btn delete-btn mobile-action ${pendingDeleteId === pr.id ? 'pending-delete' : ''}`}
                        title={pendingDeleteId === pr.id ? 'Click again to confirm delete' : 'Delete PR'}
                        aria-label={`Delete ${pr.title}`}
                      >
                        <span className="pr-action-icon">🗑️</span>
                      </button>
                    </div>
                    <div className="pr-card-content">
                      <div className="pr-card-row">
                        <span className="pr-card-label">Frontend PR:</span>
                        <div className="pr-card-value">
                          {pr.frontend_link ? (
                            <a
                              href={pr.frontend_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="pr-link frontend-link mobile-link"
                              title={pr.frontend_link}
                            >
                              <span className="pr-link-icon">🔗</span>
                              <span className="pr-link-text">View Frontend PR</span>
                            </a>
                          ) : (
                            <span className="pr-no-link">No Link</span>
                          )}
                        </div>
                      </div>
                      <div className="pr-card-row">
                        <span className="pr-card-label">Backend PR:</span>
                        <div className="pr-card-value">
                          {pr.backend_link ? (
                            <a
                              href={pr.backend_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="pr-link backend-link mobile-link"
                              title={pr.backend_link}
                            >
                              <span className="pr-link-icon">🔗</span>
                              <span className="pr-link-text">View Backend PR</span>
                            </a>
                          ) : (
                            <span className="pr-no-link">No Link</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="pr-modal-overlay" onClick={() => handleCloseModal()}>
          <div className="pr-modal-content" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="pr-modal-header">
              <h2>Create New Pull Request</h2>
              <button
                className="pr-modal-close-btn"
                onClick={handleCloseModal}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form className="pr-modal-form" onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  PR Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter PR title (e.g., 'Add user authentication')"
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '12px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  PR Type *
                </label>
                <div style={{
                  display: 'flex',
                  gap: '20px',
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb'
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    <input
                      type="radio"
                      name="type"
                      value="frontend"
                      checked={formData.type === 'frontend'}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      required
                      style={{
                        marginRight: '8px',
                        transform: 'scale(1.2)',
                        accentColor: '#8b5cf6'
                      }}
                    />
                    🎨 Frontend
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    <input
                      type="radio"
                      name="type"
                      value="backend"
                      checked={formData.type === 'backend'}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      required
                      style={{
                        marginRight: '8px',
                        transform: 'scale(1.2)',
                        accentColor: '#06b6d4'
                      }}
                    />
                    ⚙️ Backend
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="pending">⏳ Pending</option>
                  <option value="in_progress">⚡ In Progress</option>
                  <option value="completed">✅ Completed</option>
                  <option value="blocked">🚫 Blocked</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  🎨 Frontend PR Link <span style={{ color: '#9ca3af', fontWeight: '400' }}>(Optional)</span>
                </label>
                <input
                  type="url"
                  value={formData.frontend_link}
                  onChange={(e) => setFormData(prev => ({ ...prev, frontend_link: e.target.value }))}
                  placeholder="https://github.com/user/repo/pull/123"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#8b5cf6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  ⚙️ Backend PR Link <span style={{ color: '#9ca3af', fontWeight: '400' }}>(Optional)</span>
                </label>
                <input
                  type="url"
                  value={formData.backend_link}
                  onChange={(e) => setFormData(prev => ({ ...prev, backend_link: e.target.value }))}
                  placeholder="https://github.com/user/repo/pull/456"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#06b6d4';
                    e.target.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>


              {/* Modal Footer */}
              <div className="pr-modal-footer">
                <button
                  type="button"
                  className="pr-btn-secondary"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pr-btn-primary"
                  disabled={submitting || !formData.title.trim()}
                >
                  {submitting ? '⏳ Creating...' : '✅ Create PR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}