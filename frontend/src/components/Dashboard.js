import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EditShortcut from './EditShortcut';
import ThemeToggle from './ThemeToggle';
import './Dashboard.css';

function Dashboard({ user, onLogout, onNavigate }) {
  const [shortcuts, setShortcuts] = useState([]);
  const [filteredShortcuts, setFilteredShortcuts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState(user);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedShortcuts, setSelectedShortcuts] = useState([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState(null);

  useEffect(() => {
    fetchUserProfile();
    fetchShortcuts();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUserProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchShortcuts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/shortcuts', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setShortcuts(response.data);
      filterShortcuts(response.data, selectedCategory);
    } catch (error) {
      if (error.response?.status === 401) {
        onLogout();
      } else {
        setError('Failed to fetch shortcuts');
      }
    } finally {
      setLoading(false);
    }
  };

  const filterShortcuts = (shortcutList, category) => {
    if (category === 'all') {
      setFilteredShortcuts(shortcutList);
    } else {
      setFilteredShortcuts(shortcutList.filter(s => s.category === category));
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    filterShortcuts(shortcuts, category);
    setSelectedShortcuts([]);
  };

  const toggleBulkMode = () => {
    setBulkMode(!bulkMode);
    setSelectedShortcuts([]);
  };

  const handleShortcutSelect = (shortcutId) => {
    setSelectedShortcuts(prev => 
      prev.includes(shortcutId)
        ? prev.filter(id => id !== shortcutId)
        : [...prev, shortcutId]
    );
  };

  const handleSelectAll = () => {
    if (selectedShortcuts.length === filteredShortcuts.length) {
      setSelectedShortcuts([]);
    } else {
      setSelectedShortcuts(filteredShortcuts.map(s => s.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedShortcuts.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedShortcuts.length} shortcuts?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await Promise.all(
        selectedShortcuts.map(id =>
          axios.delete(`/api/shortcuts/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
      
      fetchShortcuts();
      fetchUserProfile();
      setSelectedShortcuts([]);
    } catch (error) {
      setError('Failed to delete some shortcuts');
    }
  };

  const handleDeleteShortcut = async (shortcutId) => {
    if (!window.confirm('Are you sure you want to delete this shortcut?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/shortcuts/${shortcutId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      fetchShortcuts();
      fetchUserProfile();
    } catch (error) {
      setError('Failed to delete shortcut');
    }
  };

  const handleOpenShortcut = (url) => {
    window.open(url, '_blank');
  };

  const handleEditShortcut = (shortcut) => {
    setEditingShortcut(shortcut);
  };

  const handleUpdateShortcut = (updatedShortcut) => {
    fetchShortcuts();
    fetchUserProfile();
  };

  const getCategories = () => {
    const categories = [...new Set(shortcuts.map(s => s.category))];
    return ['all', ...categories.sort()];
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <button onClick={() => onNavigate('search')} className="back-button">
              ← Back to Search
            </button>
            <h1>Welcome, {user.name}!</h1>
          </div>
          <div className="header-right">
            <ThemeToggle />
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Hero Stats Section */}
        <section className="hero-stats">
          <div className="stats-container">
            <div className="stat-card primary">
              <div className="stat-icon">🚀</div>
              <div className="stat-content">
                <h3>{userProfile.shortcuts_count || 0}</h3>
                <p>Total Shortcuts</p>
              </div>
            </div>
            <div className="stat-card secondary">
              <div className="stat-icon">⚡</div>
              <div className="stat-content">
                <h3>{shortcuts.reduce((sum, s) => sum + s.usage_count, 0)}</h3>
                <p>Total Uses</p>
              </div>
            </div>
            <div className="stat-card tertiary">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <h3>{Math.floor((new Date() - new Date(userProfile.created_at)) / (1000 * 60 * 60 * 24))}</h3>
                <p>Days Active</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions Floating Panel */}
        <section className="quick-actions">
          <div className="floating-panel">
            <button 
              onClick={() => onNavigate('create-shortcut')} 
              className="quick-action-btn primary"
            >
              <span className="btn-icon">➕</span>
              <span className="btn-text">New Shortcut</span>
            </button>
            <button 
              onClick={toggleBulkMode}
              className={`quick-action-btn ${bulkMode ? 'active' : 'secondary'}`}
            >
              <span className="btn-icon">{bulkMode ? '✖️' : '📋'}</span>
              <span className="btn-text">{bulkMode ? 'Exit Bulk' : 'Bulk Edit'}</span>
            </button>
          </div>
        </section>

        {/* Category Pills */}
        <section className="category-section">
          <div className="category-pills">
            {getCategories().map(category => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`category-pill ${selectedCategory === category ? 'active' : ''}`}
              >
                <span className="pill-emoji">
                  {category === 'all' ? '🌟' : 
                   category === 'work' ? '💼' :
                   category === 'social' ? '👥' :
                   category === 'entertainment' ? '🎬' :
                   category === 'productivity' ? '⚡' :
                   category === 'development' ? '💻' : '📁'}
                </span>
                <span className="pill-text">
                  {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                </span>
                <span className="pill-count">
                  {category === 'all' ? shortcuts.length : shortcuts.filter(s => s.category === category).length}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Bulk Actions Bar */}
        {bulkMode && filteredShortcuts.length > 0 && (
          <section className="bulk-actions-bar">
            <div className="bulk-container">
              <div className="bulk-info">
                <span className="selected-count">{selectedShortcuts.length} selected</span>
              </div>
              <div className="bulk-buttons">
                <button onClick={handleSelectAll} className="bulk-btn select-all">
                  {selectedShortcuts.length === filteredShortcuts.length ? 'Deselect All' : 'Select All'}
                </button>
                {selectedShortcuts.length > 0 && (
                  <button onClick={handleBulkDelete} className="bulk-btn delete">
                    🗑️ Delete ({selectedShortcuts.length})
                  </button>
                )}
              </div>
            </div>
          </section>
        )}
        
        {error && <div className="error-message">{error}</div>}
        
        {/* Shortcuts Display */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your shortcuts...</p>
          </div>
        ) : shortcuts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-illustration">🎯</div>
            <h3>Ready to get started?</h3>
            <p>Create your first shortcut and start navigating faster!</p>
            <button 
              onClick={() => onNavigate('create-shortcut')} 
              className="create-first-btn"
            >
              <span>✨ Create Your First Shortcut</span>
            </button>
          </div>
        ) : (
          <section className="shortcuts-masonry">
            {filteredShortcuts.map((shortcut, index) => (
              <div 
                key={shortcut.id} 
                className={`shortcut-tile ${bulkMode ? 'bulk-mode' : ''} ${selectedShortcuts.includes(shortcut.id) ? 'selected' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {bulkMode && (
                  <div className="bulk-selector">
                    <input
                      type="checkbox"
                      checked={selectedShortcuts.includes(shortcut.id)}
                      onChange={() => handleShortcutSelect(shortcut.id)}
                    />
                  </div>
                )}
                
                <div className="tile-header">
                  <div className="shortcut-avatar">
                    {shortcut.category === 'work' ? '💼' :
                     shortcut.category === 'social' ? '👥' :
                     shortcut.category === 'entertainment' ? '🎬' :
                     shortcut.category === 'productivity' ? '⚡' :
                     shortcut.category === 'development' ? '💻' : '🔗'}
                  </div>
                  <div className="tile-title">
                    <h4>{shortcut.name}</h4>
                    <span className="category-tag">{shortcut.category}</span>
                  </div>
                </div>

                <div className="tile-content">
                  <div className="url-preview" onClick={() => handleOpenShortcut(shortcut.url)}>
                    <span className="url-icon">🌐</span>
                    <span className="url-text">{shortcut.url.replace(/^https?:\/\//, '').split('/')[0]}</span>
                  </div>
                  
                  {shortcut.description && (
                    <p className="tile-description">{shortcut.description}</p>
                  )}
                </div>

                <div className="tile-footer">
                  <div className="usage-stats">
                    <span className="stat">
                      <span className="stat-icon">🔥</span>
                      <span>{shortcut.usage_count}</span>
                    </span>
                    {shortcut.last_used && (
                      <span className="last-used">
                        {new Date(shortcut.last_used).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  
                  {!bulkMode && (
                    <div className="tile-actions">
                      <button 
                        onClick={() => handleOpenShortcut(shortcut.url)}
                        className="action-btn launch"
                        title="Open"
                      >
                        🚀
                      </button>
                      <button 
                        onClick={() => handleEditShortcut(shortcut)}
                        className="action-btn edit"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDeleteShortcut(shortcut.id)}
                        className="action-btn delete"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}
      </main>

      {editingShortcut && (
        <EditShortcut
          shortcut={editingShortcut}
          onClose={() => setEditingShortcut(null)}
          onUpdate={handleUpdateShortcut}
        />
      )}
    </div>
  );
}

export default Dashboard;