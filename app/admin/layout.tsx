'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ClipboardList, 
  ShoppingBag, 
  Settings, 
  Home, 
  Menu, 
  X, 
  Feather,
  ChevronRight,
  LogOut
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {
      // ignore network errors; still redirect
    }
    window.location.assign('/admin/login');
  };

  const menuItems = [
    {
      name: 'Overview',
      path: '/admin',
      icon: <LayoutDashboard size={18} />
    },
    {
      name: 'Egg Inventory',
      path: '/admin/inventory',
      icon: <ClipboardList size={18} />
    },
    {
      name: 'Reservations / Orders',
      path: '/admin/orders',
      icon: <ShoppingBag size={18} />
    },
    {
      name: 'Manage Products',
      path: '/admin/products',
      icon: <Settings size={18} />
    }
  ];

  // The login page is rendered bare, without the admin sidebar/chrome.
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="admin-wrapper">
      {/* Mobile Header Bar */}
      <div className="mobile-header glass">
        <Link href="/admin" className="mobile-logo">
          <Feather className="logo-icon" size={18} />
          <span>Farm Admin</span>
        </Link>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className="menu-toggle"
          aria-label="Toggle navigation menu"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="admin-container">
        
        {/* Sidebar Navigation */}
        <aside className={`admin-sidebar glass ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <Link href="/" className="sidebar-logo">
              <Feather className="logo-icon" size={22} />
              <div className="logo-text">
                <h3>Tabby Premium</h3>
                <span>NANYUKI ADMIN</span>
              </div>
            </Link>
          </div>

          <nav className="sidebar-menu">
            {menuItems.map((item) => {
              const active = pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  href={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`menu-item ${active ? 'active' : ''}`}
                >
                  <span className="item-icon">{item.icon}</span>
                  <span className="item-name">{item.name}</span>
                  {active && <ChevronRight size={14} className="active-indicator" />}
                </Link>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <Link href="/" className="menu-item view-site-btn">
              <Home size={18} />
              <span>Back to Storefront</span>
            </Link>
            <button onClick={handleLogout} className="menu-item logout-btn">
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Backdrop for mobile menu */}
        {sidebarOpen && (
          <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)}></div>
        )}

        {/* Admin Content Area */}
        <main className="admin-content-area">
          <header className="admin-content-header glass">
            <div>
              <span className="section-pre">FARM CONTROL CENTER</span>
              <h1 className="section-title">
                {menuItems.find(m => m.path === pathname)?.name || 'Admin Panel'}
              </h1>
            </div>
            <div className="admin-profile">
              <div className="profile-info">
                <strong>Mom's Dashboard</strong>
                <span>Farm Manager</span>
              </div>
              <div className="profile-avatar">👩‍🌾</div>
            </div>
          </header>

          <div className="admin-page-container">
            {children}
          </div>
        </main>
      </div>

      <style jsx>{`
        .admin-wrapper {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background-color: var(--bg-color);
        }

        .admin-container {
          display: flex;
          flex-grow: 1;
          position: relative;
        }

        /* Mobile Header */
        .mobile-header {
          display: none;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          z-index: 101;
        }

        .mobile-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--primary-color);
          font-family: var(--font-display);
          font-weight: 700;
        }

        .menu-toggle {
          background: transparent;
          border: none;
          color: var(--fg-color);
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
        }

        /* Sidebar Styling */
        .admin-sidebar {
          width: 280px;
          min-height: 100vh;
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          padding: 2rem 1.5rem;
          position: sticky;
          top: 0;
          height: 100vh;
          z-index: 90;
          border-radius: 0 var(--radius-md) var(--radius-md) 0;
        }

        .sidebar-header {
          margin-bottom: 3rem;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--primary-color);
        }

        .logo-icon {
          color: var(--primary-color);
          stroke-width: 2.5;
        }

        .logo-text h3 {
          font-size: 1.1rem;
          line-height: 1;
          margin-bottom: 0.2rem;
        }

        .logo-text span {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--accent-dark);
          text-transform: uppercase;
        }

        .sidebar-menu {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex-grow: 1;
        }

        .menu-item {
          display: flex;
          align-items: center;
          padding: 0.8rem 1rem;
          border-radius: var(--radius-sm);
          color: var(--fg-muted);
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 0.95rem;
          gap: 0.75rem;
          transition: background-color var(--transition-fast), color var(--transition-fast);
        }

        .menu-item:hover {
          background-color: rgba(var(--primary-rgb), 0.04);
          color: var(--primary-color);
        }

        .menu-item.active {
          background-color: var(--primary-color);
          color: var(--primary-fg);
          box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.15);
        }

        .active-indicator {
          margin-left: auto;
          color: inherit;
        }

        .sidebar-footer {
          margin-top: auto;
          border-top: 1px solid var(--border-color-solid);
          padding-top: 1.5rem;
        }

        .view-site-btn {
          border: 1px solid var(--border-color);
          background-color: var(--bg-card-solid);
        }

        .view-site-btn:hover {
          border-color: var(--primary-color);
        }

        .logout-btn {
          width: 100%;
          margin-top: 0.5rem;
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--error-color);
          cursor: pointer;
          font-size: 0.95rem;
        }

        .logout-btn:hover {
          background-color: rgba(217, 4, 41, 0.06);
          border-color: var(--error-color);
          color: var(--error-color);
        }

        /* Content Area */
        .admin-content-area {
          flex-grow: 1;
          padding: 2rem;
          max-width: calc(100% - 280px);
          overflow-y: auto;
          min-height: 100vh;
        }

        .admin-content-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 2rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          margin-bottom: 2rem;
        }

        .section-pre {
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--accent-dark);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .section-title {
          font-size: 1.75rem;
          color: var(--primary-color);
          line-height: 1.2;
        }

        .admin-profile {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .profile-info {
          text-align: right;
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }

        .profile-info strong {
          font-size: 0.95rem;
          color: var(--primary-color);
        }

        .profile-info span {
          font-size: 0.75rem;
          color: var(--fg-muted);
        }

        .profile-avatar {
          font-size: 1.75rem;
          background-color: rgba(var(--primary-rgb), 0.08);
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: 1px solid var(--border-color);
        }

        .admin-page-container {
          width: 100%;
        }

        @media (max-width: 992px) {
          .mobile-header {
            display: flex;
          }
          
          .admin-sidebar {
            position: fixed;
            left: -280px;
            top: 55px; /* height of mobile header */
            height: calc(100vh - 55px);
            transition: left var(--transition-normal);
            border-radius: 0;
            background-color: var(--bg-color);
          }

          .admin-sidebar.open {
            left: 0;
          }

          .sidebar-backdrop {
            position: fixed;
            top: 55px;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(4px);
            z-index: 80;
          }

          .admin-content-area {
            max-width: 100%;
            padding: 1.5rem;
          }

          .admin-content-header {
            display: none; /* Mobile header covers this */
          }
        }
      `}</style>
    </div>
  );
}
