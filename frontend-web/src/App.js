import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Register from './components/Register';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authView, setAuthView] = useState('login'); // login | register

  useEffect(() => {
    // Check if user has token
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  // Listen for login/logout events
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="App">
      {isLoggedIn ? (
        <Dashboard />
      ) : authView === 'register' ? (
        <Register onGoToLogin={() => setAuthView('login')} />
      ) : (
        <Login onGoToRegister={() => setAuthView('register')} />
      )}
    </div>
  );
}

export default App;