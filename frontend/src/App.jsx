import React, { createContext, useState, useEffect, useContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './AuthContext';
import Booking from './Booking';
import Admin from './Admin';
import ClientArea from './ClientArea';
import { Sun, Moon } from 'lucide-react';
import './i18n';
import './index.css';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  return (
    <button 
      onClick={toggleTheme}
      style={{ position: 'absolute', top: '10px', left: '75px', zIndex: 100, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '50%', padding: '8px', backdropFilter: 'blur(10px)', color: 'var(--text-dark)' }}
    >
      {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemeToggle />
        <Toaster position="top-center" />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Booking />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/client" element={<ClientArea />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
