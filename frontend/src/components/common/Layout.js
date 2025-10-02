// frontend/src/components/common/Layout.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Home, BarChart, LogOut, Plus } from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Notes App</h2>
          <p>Welcome, {user?.name}</p>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/" className="nav-link">
            <Home size={20} />
            All Notes
          </Link>
          <Link to="/create" className="nav-link">
            <Plus size={20} />
            New Note
          </Link>
          <Link to="/analytics" className="nav-link">
            <BarChart size={20} />
            Analytics
          </Link>
        </nav>

        <button onClick={handleLogout} className="nav-link logout-btn">
          <LogOut size={20} />
          Logout
        </button>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;