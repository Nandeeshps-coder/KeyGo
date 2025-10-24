import React, { useState } from 'react';
import axios from 'axios';
import ThemeToggle from './ThemeToggle';
import './SearchPage.css';

function SearchPage({ user, onLogout, onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);

  const fetchSuggestions = async (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/shortcuts', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const filtered = response.data
        .filter(shortcut => 
          shortcut.name.toLowerCase().includes(query.toLowerCase()) ||
          shortcut.url.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 5); // Limit to 5 suggestions

      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedSuggestion(-1);
    fetchSuggestions(value);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestion(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestion(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedSuggestion >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[selectedSuggestion]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestion(-1);
    }
  };

  const selectSuggestion = (suggestion) => {
    setSearchQuery(suggestion.name);
    setShowSuggestions(false);
    setSelectedSuggestion(-1);
    // Automatically search when suggestion is selected
    performSearch(suggestion.name);
  };

  const performSearch = async (query) => {
    const searchTerm = query || searchQuery.trim();
    if (!searchTerm) return;

    setLoading(true);
    setMessage('');
    setShowSuggestions(false);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/search/${encodeURIComponent(searchTerm)}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.found) {
        window.open(response.data.shortcut.url, '_blank');
        setMessage(`Opened: ${response.data.shortcut.name} → ${response.data.shortcut.url}`);
        setSearchQuery('');
      } else {
        setMessage(`No shortcut found for "${searchTerm}". Try creating one!`);
      }
    } catch (error) {
      setMessage('Search failed. Please try again.');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch();
  };

  const handleDashboard = () => {
    onNavigate('dashboard');
  };

  const handleCreateShortcut = () => {
    onNavigate('create-shortcut');
  };

  return (
    <div className="search-page">
      <header className="search-header">
        <div className="user-info">
          <span>Welcome, {user.name}</span>
          <ThemeToggle />
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="search-main">
        <div className="search-container">
          <div className="logo-container">
            <h1 className="keygo-logo">KeyGo</h1>
          </div>

          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-container">
              <input
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => searchQuery && setShowSuggestions(suggestions.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Search KeyGo"
                className="search-input"
                autoComplete="off"
              />
              <button type="submit" className="search-icon-btn" disabled={loading}>
                {loading ? (
                  <div className="search-loading"></div>
                ) : (
                  <svg className="search-icon" viewBox="0 0 24 24">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                  </svg>
                )}
              </button>
              
              {showSuggestions && (
                <div className="suggestions-dropdown">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.id}
                      className={`suggestion-item ${index === selectedSuggestion ? 'selected' : ''}`}
                      onClick={() => selectSuggestion(suggestion)}
                    >
                      <div className="suggestion-name">{suggestion.name}</div>
                      <div className="suggestion-url">{suggestion.url}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>

          {message && (
            <div className={`search-message ${message.includes('Opened:') ? 'success' : 'info'}`}>
              {message}
            </div>
          )}

          <div className="action-buttons">
            <button onClick={handleDashboard} className="action-btn" disabled={loading}>
              Dashboard
            </button>
            <button onClick={handleCreateShortcut} className="action-btn" disabled={loading}>
              Create Shortcut
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SearchPage;