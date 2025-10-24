import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './components/Login';
import Signup from './components/Signup';
import SearchPage from './components/SearchPage';
import Dashboard from './components/Dashboard';
import CreateShortcut from './components/CreateShortcut';
import './App.css';
import './components/GlobalStyles.css';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [currentPage, setCurrentPage] = useState('search'); // 'search', 'dashboard', 'create-shortcut'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    setCurrentPage('search'); // Always start at search page after login
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setCurrentPage('search');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const handleNavigation = (page) => {
    setCurrentPage(page);
  };

  const switchToSignup = () => setAuthMode('signup');
  const switchToLogin = () => setAuthMode('login');

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (user && token) {
    return (
      <ThemeProvider>
        {(() => {
          switch (currentPage) {
            case 'dashboard':
              return <Dashboard user={user} onLogout={handleLogout} onNavigate={handleNavigation} />;
            case 'create-shortcut':
              return <CreateShortcut user={user} onLogout={handleLogout} onNavigate={handleNavigation} />;
            default:
              return <SearchPage user={user} onLogout={handleLogout} onNavigate={handleNavigation} />;
          }
        })()}
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="App">
        {authMode === 'login' ? (
          <Login onLogin={handleLogin} switchToSignup={switchToSignup} />
        ) : (
          <Signup onLogin={handleLogin} switchToLogin={switchToLogin} />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;