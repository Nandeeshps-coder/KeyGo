import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EditShortcut.css';

function EditShortcut({ shortcut, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    category: 'general'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (shortcut) {
      setFormData({
        name: shortcut.name,
        url: shortcut.url,
        description: shortcut.description || '',
        category: shortcut.category || 'general'
      });
    }
  }, [shortcut]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/shortcuts/${shortcut.id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      onUpdate(response.data.shortcut);
      onClose();
    } catch (error) {
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('Failed to update shortcut');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!shortcut) return null;

  return (
    <div className="edit-shortcut-overlay">
      <div className="edit-shortcut-modal">
        <div className="modal-header">
          <h2>Edit Shortcut</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group">
            <label htmlFor="name">Shortcut Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter shortcut name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="url">URL</label>
            <input
              type="url"
              id="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              placeholder="https://example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of the shortcut"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="general">General</option>
              <option value="work">Work</option>
              <option value="social">Social</option>
              <option value="entertainment">Entertainment</option>
              <option value="productivity">Productivity</option>
              <option value="development">Development</option>
            </select>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="save-btn">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditShortcut;