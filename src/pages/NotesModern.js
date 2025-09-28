import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import '../styles/NotesModern.css';

export default function NotesModern() {
  const [notes, setNotes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    attachments: []
  });
  const [loading, setLoading] = useState(false);
  const [attachmentPreviews, setAttachmentPreviews] = useState([]);
  const fileInputRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && showModal) {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || 'demo-token';
      const response = await fetch('http://localhost:3001/notes', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const notesData = await response.json();
        setNotes(Array.isArray(notesData) ? notesData : []);
      } else {
        console.error('Failed to fetch notes:', response.status);
        setNotes([]);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load notes');
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (note = null) => {
    if (note) {
      setEditingNote(note);
      setFormData({
        title: note.title || '',
        content: note.content || '',
        attachments: note.attachments || []
      });
      setAttachmentPreviews(note.attachments || []);
    } else {
      setEditingNote(null);
      setFormData({
        title: '',
        content: '',
        attachments: []
      });
      setAttachmentPreviews([]);
    }
    setShowModal(true);

    // Focus title input after modal opens
    setTimeout(() => {
      const titleInput = document.querySelector('.notes-modal input[type="text"]');
      if (titleInput) titleInput.focus();
    }, 100);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingNote(null);
    setFormData({
      title: '',
      content: '',
      attachments: []
    });
    setAttachmentPreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Please enter a note title');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token') || 'demo-token';
      const url = editingNote
        ? `http://localhost:3001/notes/${editingNote.id}`
        : 'http://localhost:3001/notes';
      const method = editingNote ? 'PUT' : 'POST';

      const noteData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        type: 'learning',
        tags: [],
        attachments: attachmentPreviews
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(noteData)
      });

      if (response.ok) {
        toast.success(editingNote ? 'Note updated successfully!' : 'Note created successfully!');
        closeModal();
        await fetchNotes();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save note');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error(error.message || 'Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId, noteTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${noteTitle}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token') || 'demo-token';
      const response = await fetch(`http://localhost:3001/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Note deleted successfully!');
        await fetchNotes();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error(error.message || 'Failed to delete note');
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);

    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`File "${file.name}" is too large. Maximum size is 50MB.`);
        continue;
      }

      const attachment = {
        id: Date.now() + Math.random(),
        name: file.name,
        type: file.type,
        size: file.size,
        uploadDate: new Date().toISOString()
      };

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          attachment.preview = e.target.result;
          attachment.isImage = true;
          setAttachmentPreviews(prev => [...prev, attachment]);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          attachment.preview = e.target.result;
          attachment.isVideo = file.type.startsWith('video/');
          attachment.isAudio = file.type.startsWith('audio/');
          setAttachmentPreviews(prev => [...prev, attachment]);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachmentPreviews(prev => [...prev, attachment]);
      }
    }

    e.target.value = '';
  };

  const removeAttachment = (attachmentId) => {
    setAttachmentPreviews(prev => prev.filter(att => att.id !== attachmentId));
  };

  const handleViewAttachment = (attachment) => {
    try {
      if (attachment.preview && attachment.isImage) {
        // Open image preview in a new window/tab
        const newWindow = window.open('', '_blank');
        newWindow.document.write(`
          <html>
            <head>
              <title>${attachment.name}</title>
              <style>
                body {
                  margin: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background: #000;
                  font-family: Arial, sans-serif;
                }
                img {
                  max-width: 100%;
                  max-height: 100vh;
                  object-fit: contain;
                  border-radius: 8px;
                }
                .header {
                  position: fixed;
                  top: 0;
                  left: 0;
                  right: 0;
                  background: rgba(0,0,0,0.8);
                  color: white;
                  padding: 10px 20px;
                  font-size: 14px;
                  z-index: 1000;
                }
              </style>
            </head>
            <body>
              <div class="header">${attachment.name} (${formatFileSize(attachment.size)})</div>
              <img src="${attachment.preview}" alt="${attachment.name}" />
            </body>
          </html>
        `);
        newWindow.document.close();
      } else if (attachment.type && attachment.type.startsWith('video/')) {
        // For video files, open with video player
        if (attachment.preview) {
          const newWindow = window.open('', '_blank');
          newWindow.document.write(`
            <html>
              <head>
                <title>${attachment.name}</title>
                <style>
                  body {
                    margin: 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background: #000;
                    font-family: Arial, sans-serif;
                  }
                  video {
                    max-width: 100%;
                    max-height: 80vh;
                    border-radius: 8px;
                  }
                  .info {
                    color: white;
                    padding: 20px;
                    text-align: center;
                  }
                </style>
              </head>
              <body>
                <div class="info">
                  <h3>${attachment.name}</h3>
                  <p>Size: ${formatFileSize(attachment.size)} | Type: ${attachment.type}</p>
                </div>
                <video controls autoplay>
                  <source src="${attachment.preview}" type="${attachment.type}">
                  Your browser does not support the video tag.
                </video>
              </body>
            </html>
          `);
          newWindow.document.close();
        } else {
          toast.info(`Video file: ${attachment.name} (${formatFileSize(attachment.size)})`);
        }
      } else if (attachment.type && attachment.type.startsWith('audio/')) {
        // For audio files, open with audio player
        if (attachment.preview) {
          const newWindow = window.open('', '_blank');
          newWindow.document.write(`
            <html>
              <head>
                <title>${attachment.name}</title>
                <style>
                  body {
                    margin: 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    font-family: Arial, sans-serif;
                    color: white;
                  }
                  .container {
                    text-align: center;
                    background: rgba(0,0,0,0.3);
                    padding: 40px;
                    border-radius: 20px;
                    backdrop-filter: blur(10px);
                  }
                  audio {
                    width: 300px;
                    margin: 20px 0;
                  }
                  .icon {
                    font-size: 4em;
                    margin-bottom: 20px;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="icon">🎵</div>
                  <h2>${attachment.name}</h2>
                  <p>Size: ${formatFileSize(attachment.size)}</p>
                  <audio controls autoplay>
                    <source src="${attachment.preview}" type="${attachment.type}">
                    Your browser does not support the audio tag.
                  </audio>
                </div>
              </body>
            </html>
          `);
          newWindow.document.close();
        } else {
          toast.info(`Audio file: ${attachment.name} (${formatFileSize(attachment.size)})`);
        }
      } else if (attachment.type && attachment.type.includes('pdf')) {
        // For PDF files, try to open in browser
        if (attachment.preview) {
          const newWindow = window.open('', '_blank');
          newWindow.document.write(`
            <html>
              <head>
                <title>${attachment.name}</title>
                <style>
                  body { margin: 0; }
                  iframe { width: 100%; height: 100vh; border: none; }
                  .fallback {
                    padding: 40px;
                    text-align: center;
                    font-family: Arial, sans-serif;
                  }
                </style>
              </head>
              <body>
                <iframe src="${attachment.preview}" type="application/pdf">
                  <div class="fallback">
                    <h2>📄 ${attachment.name}</h2>
                    <p>Your browser doesn't support inline PDF viewing.</p>
                    <p>Size: ${formatFileSize(attachment.size)}</p>
                    <a href="${attachment.preview}" download="${attachment.name}">Download PDF</a>
                  </div>
                </iframe>
              </body>
            </html>
          `);
          newWindow.document.close();
        } else {
          toast.info(`PDF file: ${attachment.name} (${formatFileSize(attachment.size)})`);
        }
      } else {
        // For other file types (documents, etc.), show detailed info with download option
        const fileExtension = attachment.name.split('.').pop().toUpperCase();
        const newWindow = window.open('', '_blank');
        newWindow.document.write(`
          <html>
            <head>
              <title>${attachment.name}</title>
              <style>
                body {
                  margin: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
                  font-family: Arial, sans-serif;
                  color: white;
                }
                .container {
                  text-align: center;
                  background: rgba(255,255,255,0.1);
                  padding: 40px;
                  border-radius: 20px;
                  backdrop-filter: blur(10px);
                  border: 1px solid rgba(255,255,255,0.2);
                  max-width: 400px;
                }
                .file-icon {
                  font-size: 5em;
                  margin-bottom: 20px;
                }
                .file-info {
                  margin: 10px 0;
                  font-size: 16px;
                }
                .download-btn {
                  background: rgba(255,255,255,0.2);
                  border: 1px solid rgba(255,255,255,0.3);
                  color: white;
                  padding: 12px 24px;
                  border-radius: 8px;
                  cursor: pointer;
                  text-decoration: none;
                  display: inline-block;
                  margin-top: 20px;
                  transition: background 0.3s;
                }
                .download-btn:hover {
                  background: rgba(255,255,255,0.3);
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="file-icon">${getFileIcon(attachment.type)}</div>
                <h2>${attachment.name}</h2>
                <div class="file-info">Type: ${fileExtension} Document</div>
                <div class="file-info">Size: ${formatFileSize(attachment.size)}</div>
                <div class="file-info">Uploaded: ${new Date(attachment.uploadDate).toLocaleDateString()}</div>
                ${attachment.preview ?
                  `<a href="${attachment.preview}" download="${attachment.name}" class="download-btn">📥 Download File</a>` :
                  '<p>File preview not available</p>'
                }
              </div>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    } catch (error) {
      console.error('Error viewing attachment:', error);
      toast.error('Unable to open attachment');
    }
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Just now';

      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) return 'Just now';

      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);

      if (diffInHours < 1) {
        return 'Just now';
      } else if (diffInHours < 24) {
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      } else if (diffInHours < 7 * 24) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: diffInHours > 365 * 24 ? 'numeric' : undefined
        });
      }
    } catch (error) {
      console.error('Date formatting error:', error, 'for date:', dateString);
      return 'Just now';
    }
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('video')) return '🎥';
    if (fileType.includes('audio')) return '🎵';
    if (fileType.includes('pdf')) return '📕';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    return '📄';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="notes-modern-container">
      {/* Header */}
      <div className="notes-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="page-title">
              <span className="title-icon">📝</span>
              Notes
            </h1>
            <p className="page-subtitle">Capture and organize your thoughts</p>
          </div>
          <button
            className="create-note-btn"
            onClick={() => openModal()}
            aria-label="Create new note"
          >
            <span className="btn-icon">+</span>
            <span className="btn-text">Create Note</span>
          </button>
        </div>
      </div>

      {/* Notes Grid */}
      <div className="notes-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your notes...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No notes yet</h3>
            <p>Create your first note to get started!</p>
            <button
              className="create-note-btn primary"
              onClick={() => openModal()}
            >
              <span className="btn-icon">+</span>
              <span className="btn-text">Create Your First Note</span>
            </button>
          </div>
        ) : (
          <div className="notes-grid">
            {notes.map(note => (
              <div key={note.id} className="note-card">
                <div className="note-header">
                  <h3 className="note-title">{note.title}</h3>
                  <div className="note-actions">
                    <button
                      className="action-btn edit-btn"
                      onClick={() => openModal(note)}
                      aria-label={`Edit ${note.title}`}
                      title="Edit note"
                    >
                      ✏️
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDeleteNote(note.id, note.title)}
                      aria-label={`Delete ${note.title}`}
                      title="Delete note"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {note.content && (
                  <div className="note-content">
                    {note.content.length > 120
                      ? `${note.content.substring(0, 120)}...`
                      : note.content
                    }
                  </div>
                )}

                {note.attachments && note.attachments.length > 0 && (
                  <div className="note-attachments">
                    <div className="attachments-header">
                      📎 {note.attachments.length} file{note.attachments.length > 1 ? 's' : ''}
                    </div>
                    <div className="attachments-list">
                      {note.attachments.slice(0, 3).map((attachment, index) => (
                        <div
                          key={attachment.id || index}
                          className="attachment-preview"
                          onClick={() => handleViewAttachment(attachment)}
                          title={`Click to open ${attachment.name}`}
                        >
                          {attachment.isImage ? (
                            <div className="attachment-preview-image">
                              <img
                                src={attachment.preview}
                                alt={attachment.name}
                                className="preview-thumbnail"
                              />
                              <div className="preview-overlay">
                                <span className="preview-icon">🔍</span>
                                <span className="preview-text">View</span>
                              </div>
                            </div>
                          ) : attachment.isVideo ? (
                            <div className="attachment-preview-video">
                              <span className="file-icon">🎥</span>
                              <span className="file-name">{attachment.name.length > 12
                                ? `${attachment.name.substring(0, 12)}...`
                                : attachment.name}
                              </span>
                              <div className="file-type">Video</div>
                            </div>
                          ) : attachment.isAudio ? (
                            <div className="attachment-preview-audio">
                              <span className="file-icon">🎵</span>
                              <span className="file-name">{attachment.name.length > 12
                                ? `${attachment.name.substring(0, 12)}...`
                                : attachment.name}
                              </span>
                              <div className="file-type">Audio</div>
                            </div>
                          ) : (
                            <div className="attachment-preview-file">
                              <span className="file-icon">{getFileIcon(attachment.type)}</span>
                              <span className="file-name">{attachment.name.length > 12
                                ? `${attachment.name.substring(0, 12)}...`
                                : attachment.name}
                              </span>
                              <div className="file-type">{attachment.type ? attachment.type.split('/')[0] : 'File'}</div>
                            </div>
                          )}
                        </div>
                      ))}
                      {note.attachments.length > 3 && (
                        <div className="attachment-more">
                          +{note.attachments.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="note-footer">
                  <span className="note-date">{formatDate(note.updated_at || note.created_at)}</span>
                  <span className="note-type">📚</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal - Using fixed positioning and high z-index */}
      {showModal && (
        <div className="notes-modal-overlay">
          <div className="notes-modal" ref={modalRef}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingNote ? 'Edit Note' : 'Create New Note'}
              </h2>
              <button
                className="modal-close-btn"
                onClick={closeModal}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <form className="modal-form" onSubmit={handleSaveNote}>
              <div className="form-group">
                <label className="form-label" htmlFor="note-title">
                  Title *
                </label>
                <input
                  id="note-title"
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter a descriptive title..."
                  required
                  autoComplete="off"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="note-content">
                  Content
                </label>
                <textarea
                  id="note-content"
                  className="form-textarea"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your note content here..."
                  rows={6}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Attachments
                </label>
                <div className="attachment-upload">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx"
                    className="file-input-hidden"
                    id="file-input"
                  />
                  <label htmlFor="file-input" className="file-upload-btn">
                    <span className="upload-icon">📎</span>
                    <span className="upload-text">Add Files</span>
                    <span className="upload-hint">Images, documents, videos (max 50MB each)</span>
                  </label>
                </div>

                {attachmentPreviews.length > 0 && (
                  <div className="attachments-preview">
                    <div className="preview-header">
                      <span className="preview-count">
                        {attachmentPreviews.length} file{attachmentPreviews.length > 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <div className="preview-list">
                      {attachmentPreviews.map(attachment => (
                        <div key={attachment.id} className="attachment-item">
                          <div className="attachment-info">
                            {attachment.isImage && attachment.preview ? (
                              <img
                                src={attachment.preview}
                                alt={attachment.name}
                                className="attachment-thumbnail"
                              />
                            ) : (
                              <div className="attachment-icon">
                                {getFileIcon(attachment.type)}
                              </div>
                            )}
                            <div className="attachment-details">
                              <div className="attachment-name">{attachment.name}</div>
                              <div className="attachment-size">{formatFileSize(attachment.size)}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="remove-attachment-btn"
                            onClick={() => removeAttachment(attachment.id)}
                            aria-label={`Remove ${attachment.name}`}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !formData.title.trim()}
                >
                  {loading ? (
                    <>
                      <span className="btn-spinner"></span>
                      {editingNote ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">💾</span>
                      {editingNote ? 'Update Note' : 'Create Note'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        className="fab"
        onClick={() => openModal()}
        aria-label="Create new note"
        title="Create new note"
      >
        <span className="fab-icon">+</span>
      </button>
    </div>
  );
}