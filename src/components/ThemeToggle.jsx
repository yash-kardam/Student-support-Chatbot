import { Sun, Moon } from 'lucide-react';
import './ThemeToggle.css';

export default function ThemeToggle({ theme, toggleTheme }) {
  return (
    <button 
      className="theme-toggle" 
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className={`toggle-track ${theme === 'dark' ? 'dark' : ''}`}>
        <div className="toggle-thumb">
          {theme === 'light' ? (
            <Sun size={14} className="icon sun-icon" />
          ) : (
            <Moon size={14} className="icon moon-icon" />
          )}
        </div>
      </div>
    </button>
  );
}
