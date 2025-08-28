import React, { useState, useEffect } from 'react';
import { Building2, Settings, Bell, LogOut } from 'lucide-react';

const Navbar = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <nav className={`navbar ${isVisible ? 'scroll-visible' : 'scroll-hidden'}`}>
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3 hover-scale">
            <div className="w-10 h-10 bg-primary rounded-dashboard flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-text-primary">DashBoard</span>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-text-secondary hover:text-primary transition-colors duration-200 font-medium">
              Overview
            </a>
            <a href="#" className="text-text-secondary hover:text-primary transition-colors duration-200 font-medium">
              Analytics
            </a>
            <a href="#" className="text-text-secondary hover:text-primary transition-colors duration-200 font-medium">
              Reports
            </a>
            <a href="#" className="text-text-secondary hover:text-primary transition-colors duration-200 font-medium">
              Settings
            </a>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            <button className="p-2 text-text-secondary hover:text-primary hover:bg-surface-hover rounded-dashboard transition-all duration-200 hover-scale">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 text-text-secondary hover:text-primary hover:bg-surface-hover rounded-dashboard transition-all duration-200 hover-scale">
              <Settings className="w-5 h-5" />
            </button>
            
            {/* User Profile */}
            <div className="flex items-center space-x-3 p-2 hover:bg-surface-hover rounded-dashboard transition-all duration-200 cursor-pointer hover-lift">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format"
                alt="User"
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="hidden md:block">
                <p className="text-sm font-medium text-text-primary">John Doe</p>
                <p className="text-xs text-text-muted">Administrator</p>
              </div>
            </div>
            
            <button className="p-2 text-text-secondary hover:text-warning hover:bg-warning-light rounded-dashboard transition-all duration-200 hover-scale">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;