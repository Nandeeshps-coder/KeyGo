import React, { useState } from 'react';
import axios from 'axios';
import './CreateShortcut.css';

function CreateShortcut({ user, onLogout, onNavigate }) {
  const [shortcutData, setShortcutData] = useState({
    name: '',
    url: '',
    description: '',
    category: 'general'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setShortcutData({
      ...shortcutData,
      [e.target.name]: e.target.value
    });
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/shortcuts', shortcutData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setMessage('Shortcut created successfully!');
      setShortcutData({
        name: '',
        url: '',
        description: '',
        category: 'general'
      });
    } catch (error) {
      if (error.response?.data?.error) {
        setMessage(error.response.data.error);
      } else {
        setMessage('Failed to create shortcut');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
  };

  return (
    <div className="create-shortcut">
      <header className="create-shortcut-header">
        <div className="header-content">
          <div className="header-left">
            <button onClick={() => onNavigate('search')} className="back-button">
              ← Back to Search
            </button>
            <h1>Create Shortcut</h1>
          </div>
          <div className="user-info">
            <span>{user.name}</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="create-shortcut-main">
        <div className="form-container">
          <form onSubmit={handleSubmit} className="shortcut-form">
            <div className="form-group">
              <label htmlFor="name">Shortcut Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={shortcutData.name}
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
                value={shortcutData.url}
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
                value={shortcutData.description}
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
                value={shortcutData.category}
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

            {message && (
              <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}

            <div className="form-actions">
              <button type="submit" disabled={loading} className="create-button">
                {loading ? 'Creating...' : 'Create Shortcut'}
              </button>
              <button 
                type="button" 
                onClick={() => onNavigate('search')} 
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default CreateShortcut;