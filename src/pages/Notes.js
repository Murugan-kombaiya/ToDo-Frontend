import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { authenticatedFetch } from '../utils/authUtils';
import '../styles/NotesModernV3.css';

export default function Notes() {
  const [activeTab, setActiveTab] = useState('all');
  const [notes, setNotes] = useState({ learning: [], working: [] });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: [],
    attachments: []
  });
  const [loading, setLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [attachmentPreviews, setAttachmentPreviews] = useState([]);
  const fileInputRef = useRef(null);
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [viewingAttachment, setViewingAttachment] = useState(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);

  useEffect(() => {
    fetchNotes();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleThemeChange);

    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, []);

  // Apply theme class to body
  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
    return () => document.body.classList.remove('dark-mode');
  }, [isDarkMode]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to view notes');
        setLoading(false);
        return;
      }

      const response = await authenticatedFetch('/notes');

      if (response.ok) {
        const allNotes = await response.json();
        console.log('Fetched notes:', allNotes);
        console.log('Notes with attachments:', allNotes.filter(note => note.attachments && note.attachments.length > 0));
        setNotes({
          learning: allNotes.filter(note => note.type === 'learning'),
          working: allNotes.filter(note => note.type === 'working')
        });
      } else if (response.status === 401) {
        toast.error('Please login to access notes');
        localStorage.removeItem('token');
      } else {
        throw new Error(`Failed to fetch notes: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to fetch notes. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = (e) => {
    e?.preventDefault();
    e?.stopPropagation();

    setEditingNote(null);
    setFormData({ title: '', content: '', tags: [], attachments: [] });
    setAttachmentPreviews([]);
    setShowCreateModal(true);
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      tags: note.tags || [],
      attachments: note.attachments || []
    });
    setAttachmentPreviews(note.attachments || []);
    setShowCreateModal(true);
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to save notes');
        return;
      }

      const url = editingNote
        ? `/notes/${editingNote.id}`
        : '/notes';
      const method = editingNote ? 'PUT' : 'POST';

      // Map activeTab to type as expected by backend
      const type = activeTab === 'all' ? 'learning' : activeTab;

      const body = {
        title: formData.title,
        content: formData.content,
        type: type,
        tags: formData.tags || [],
        attachments: attachmentPreviews || []
      };

      const response = await authenticatedFetch(url, {
        method,
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast.success(editingNote ? 'Note updated!' : 'Note created!');
        setShowCreateModal(false);
        setFormData({ title: '', content: '', tags: [], attachments: [] });
        setAttachmentPreviews([]);
        fetchNotes();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save note');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error(error.message || 'Failed to save note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to delete notes');
        return;
      }

      const response = await authenticatedFetch(`/notes/${noteId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Note deleted!');
        fetchNotes();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error(error.message || 'Failed to delete note');
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Enhanced attachment handling
  const processAttachmentFile = (file) => {
    return new Promise((resolve, reject) => {
      // File size validation (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
        reject(new Error('File too large'));
        return;
      }

      const reader = new FileReader();
      const attachment = {
        id: Date.now() + Math.random(),
        name: file.name,
        type: file.type,
        size: file.size,
        uploadDate: new Date().toISOString()
      };

      reader.onload = (e) => {
        if (file.type && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
          attachment.data = e.target.result;
          attachment.isPreviewable = true;
        }
        resolve(attachment);
      };

      reader.onerror = reject;

      if (file.type && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
        reader.readAsDataURL(file);
      } else {
        resolve(attachment);
      }
    });
  };

  const handleAttachmentSelect = async (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      // File type validation
      const allowedTypes = [
        'image/', 'video/', 'audio/', 'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument',
        'text/', 'application/vnd.ms-powerpoint', 'application/vnd.ms-excel'
      ];

      const isValidType = allowedTypes.some(type => file.type.startsWith(type));
      if (!isValidType) {
        toast.error(`File type ${file.type} is not supported`);
        return false;
      }

      return true;
    });

    for (const file of validFiles) {
      try {
        const attachment = await processAttachmentFile(file);
        setFormData(prev => ({
          ...prev,
          attachments: [...prev.attachments, attachment]
        }));
        setAttachmentPreviews(prev => [...prev, attachment]);
        toast.success(`${file.name} added successfully`);
      } catch (error) {
        console.error('Error processing file:', error);
        if (error.message !== 'File too large') {
          toast.error(`Could not process file: ${file.name}`);
        }
      }
    }

    e.target.value = '';
  };

  const removeAttachment = (attachmentId) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(att => att.id !== attachmentId)
    }));
    setAttachmentPreviews(prev => prev.filter(att => att.id !== attachmentId));
  };

  const getAttachmentIcon = (type) => {
    if (!type) return '📎';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('video')) return '🎥';
    if (type.includes('audio')) return '🎵';
    if (type.includes('image')) return '🖼️';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📊';
    if (type.includes('excel') || type.includes('sheet')) return '📈';
    if (type.includes('text')) return '📄';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleViewAttachment = (attachment) => {
    setViewingAttachment(attachment);
    setShowAttachmentModal(true);
  };

  const closeAttachmentModal = () => {
    setShowAttachmentModal(false);
    setViewingAttachment(null);
  };

  const downloadAttachment = (attachment) => {
    if (attachment.data) {
      const link = document.createElement('a');
      link.href = attachment.data;
      link.download = attachment.name || 'attachment';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getFilteredNotes = () => {
    if (activeTab === 'all') {
      return [...notes.learning, ...notes.working];
    }
    return notes[activeTab] || [];
  };

  return (
    <div className={`notes-container ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="title-section">
            <h1 className="page-title">📝 Notes</h1>
            <p className="page-subtitle">Organize your learning and working notes</p>
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
            <button className="create-btn primary" onClick={handleCreateNote}>
              <i className="icon">+</i>
              <span>Create Note</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <div className="tab-buttons">
          <button
            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <i className="icon">📚</i>
            <span className="tab-text">All Notes</span>
            <span className="tab-count">{notes.learning.length + notes.working.length}</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'learning' ? 'active' : ''}`}
            onClick={() => setActiveTab('learning')}
          >
            <i className="icon">🎓</i>
            <span className="tab-text">Learning</span>
            <span className="tab-count">{notes.learning.length}</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'working' ? 'active' : ''}`}
            onClick={() => setActiveTab('working')}
          >
            <i className="icon">💼</i>
            <span className="tab-text">Working</span>
            <span className="tab-count">{notes.working.length}</span>
          </button>
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading notes...</p>
        </div>
      ) : (
        <div className="notes-grid">
          {getFilteredNotes().length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No {activeTab === 'all' ? '' : activeTab} notes yet</h3>
              <p>Create your first note to get started organizing your thoughts!</p>
              <button className="create-btn primary" onClick={handleCreateNote}>
                <i className="icon">+</i>
                <span>Create Note</span>
              </button>
            </div>
          ) : (
            getFilteredNotes().map(note => (
              <div key={note.id} className="note-card">
                <div className="note-header">
                  <div className="note-title-section">
                    <h3 className="note-title">{note.title}</h3>
                    <div className={`note-category ${note.type}`}>
                      {note.type === 'learning' ? '🎓' : '💼'}
                      <span>{note.type === 'learning' ? 'Learning' : 'Working'}</span>
                    </div>
                  </div>
                  <div className="note-actions">
                    <button
                      className="action-btn secondary"
                      onClick={() => handleEditNote(note)}
                      title="Edit note"
                    >
                      ✏️
                    </button>
                    <button
                      className="action-btn danger"
                      onClick={() => handleDeleteNote(note.id)}
                      title="Delete note"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {note.content && (
                  <div className="note-content">
                    {note.content.length > 200
                      ? `${note.content.substring(0, 200)}...`
                      : note.content}
                  </div>
                )}

                {/* Show attachment previews */}
                {(() => {
                  if (note.attachments && note.attachments.length > 0) {
                    console.log('Rendering attachments for note:', note.title, 'attachments:', note.attachments);
                  }
                  return null;
                })()}
                {note.attachments && note.attachments.length > 0 && (
                  <div className="note-attachments">
                    <div className="attachment-header">
                      <span className="attachment-count">📎 {note.attachments.length} attachment{note.attachments.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="attachment-previews">
                      {note.attachments.slice(0, 4).map(attachment => (
                        <div
                          key={attachment.id}
                          className="attachment-preview clickable"
                          onClick={() => handleViewAttachment(attachment)}
                          title={`Click to view ${attachment.name}`}
                        >
                          {attachment.isPreviewable && attachment.data ? (
                            <img
                              src={attachment.data}
                              alt={attachment.name}
                              className="attachment-thumbnail"
                              loading="lazy"
                            />
                          ) : (
                            <div className="attachment-file">
                              <span className="file-icon">{getAttachmentIcon(attachment.type)}</span>
                              <span className="file-ext">
                                {attachment.name ? attachment.name.split('.').pop().toUpperCase() : 'FILE'}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                      {note.attachments.length > 4 && (
                        <div className="attachment-more">+{note.attachments.length - 4}</div>
                      )}
                    </div>
                  </div>
                )}

                {note.tags && note.tags.length > 0 && (
                  <div className="note-tags">
                    {note.tags.slice(0, 5).map(tag => (
                      <span key={tag} className="tag">#{tag}</span>
                    ))}
                    {note.tags.length > 5 && (
                      <span className="tag-more">+{note.tags.length - 5}</span>
                    )}
                  </div>
                )}

                <div className="note-footer">
                  <span className="note-date">
                    {new Date(note.updated_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: note.updated_at.includes(new Date().getFullYear()) ? undefined : 'numeric'
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create/Edit Note Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingNote ? 'Edit Note' : `Create ${activeTab === 'learning' ? 'Learning' : activeTab === 'working' ? 'Working' : 'New'} Note`}
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <form className="modal-form" onSubmit={handleSaveNote}>
              <div className="form-group">
                <label className="form-label required">Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter a descriptive title..."
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Content</label>
                <textarea
                  className="form-textarea"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your note content here..."
                  rows={6}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tags</label>
                <div className="tag-input-container">
                  <input
                    type="text"
                    className="form-input tag-input"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag and press Enter"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <button type="button" className="add-tag-btn" onClick={addTag}>
                    Add
                  </button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="tags-list">
                    {formData.tags.map(tag => (
                      <span key={tag} className="tag editable">
                        #{tag}
                        <button
                          type="button"
                          className="tag-remove"
                          onClick={() => removeTag(tag)}
                          aria-label={`Remove ${tag} tag`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Attachments</label>
                <div className="attachment-upload">
                  <input
                    type="file"
                    className="file-input-hidden"
                    id="attachment-input"
                    onChange={handleAttachmentSelect}
                    multiple
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx"
                  />
                  <label htmlFor="attachment-input" className="file-input-label">
                    <div className="file-input-content">
                      <span className="file-input-icon">📎</span>
                      <span className="file-input-text">Click to add attachments</span>
                      <span className="file-input-hint">Images, videos, documents (max 10MB each)</span>
                    </div>
                  </label>
                </div>

                {attachmentPreviews.length > 0 && (
                  <div className="attachment-previews">
                    <div className="preview-header">
                      <span className="preview-count">{attachmentPreviews.length} attachment{attachmentPreviews.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="preview-grid">
                      {attachmentPreviews.map(attachment => (
                        <div key={attachment.id} className="preview-item">
                          <div className="preview-content">
                            {attachment.isPreviewable && attachment.data ? (
                              <img
                                src={attachment.data}
                                alt={attachment.name}
                                className="preview-thumbnail"
                                loading="lazy"
                              />
                            ) : (
                              <div className="preview-file">
                                <span className="file-icon">{getAttachmentIcon(attachment.type)}</span>
                                <span className="file-name">
                                  {attachment.name ? attachment.name.substring(0, 20) + (attachment.name.length > 20 ? '...' : '') : 'Unknown file'}
                                </span>
                                <span className="file-size">{formatFileSize(attachment.size)}</span>
                              </div>
                            )}
                            <button
                              type="button"
                              className="preview-remove"
                              onClick={() => removeAttachment(attachment.id)}
                              aria-label={`Remove ${attachment.name}`}
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
                  className="cancel-btn secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn primary"
                  disabled={!formData.title.trim()}
                >
                  <span>{editingNote ? 'Update Note' : 'Create Note'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attachment Viewer Modal */}
      {showAttachmentModal && viewingAttachment && (
        <div className="modal-overlay attachment-modal-overlay" onClick={closeAttachmentModal}>
          <div className="attachment-modal" onClick={e => e.stopPropagation()}>
            <div className="attachment-modal-header">
              <div className="attachment-info">
                <h3 className="attachment-title">{viewingAttachment.name || 'Attachment'}</h3>
                <span className="attachment-size">{formatFileSize(viewingAttachment.size)}</span>
              </div>
              <div className="attachment-modal-actions">
                <button
                  className="modal-action-btn download-btn"
                  onClick={() => downloadAttachment(viewingAttachment)}
                  title="Download"
                >
                  📥
                </button>
                <button
                  className="modal-action-btn close-btn"
                  onClick={closeAttachmentModal}
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="attachment-modal-content">
              {viewingAttachment.isPreviewable && viewingAttachment.data ? (
                viewingAttachment.type.startsWith('image/') ? (
                  <img
                    src={viewingAttachment.data}
                    alt={viewingAttachment.name}
                    className="attachment-full-image"
                  />
                ) : viewingAttachment.type.startsWith('video/') ? (
                  <video
                    src={viewingAttachment.data}
                    controls
                    className="attachment-full-video"
                  />
                ) : (
                  <div className="attachment-full-file">
                    <div className="file-preview">
                      <span className="file-icon-large">{getAttachmentIcon(viewingAttachment.type)}</span>
                      <h4>{viewingAttachment.name}</h4>
                      <p>Click download to view this file</p>
                    </div>
                  </div>
                )
              ) : (
                <div className="attachment-full-file">
                  <div className="file-preview">
                    <span className="file-icon-large">{getAttachmentIcon(viewingAttachment.type)}</span>
                    <h4>{viewingAttachment.name}</h4>
                    <p>Click download to view this file</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        className="floating-action-btn"
        onClick={handleCreateNote}
        aria-label="Create new note"
        title="Create new note"
      >
        <span className="fab-icon">+</span>
      </button>
    </div>
  );
}