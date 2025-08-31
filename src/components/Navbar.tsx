import React, { useState, useEffect } from 'react';
import { Settings, Bell, LogOut, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Link } from 'react-router-dom';

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
          <Link to="/" className="flex items-center space-x-3 hover-scale">
            <img 
              src="/SFA-updateLogo.png" 
              alt="SFA Logo" 
              className="w-12 h-12 object-contain"
            />
            <span className="text-xl font-bold text-text-primary">SFA</span>
          </Link>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-text-secondary hover:text-primary transition-colors duration-200 font-medium">
              Home
            </Link>
            <Link to="/lobby-data" className="text-text-secondary hover:text-primary transition-colors duration-200 font-medium">
              Lobby Data
            </Link>
            <Link to="/user-info" className="text-text-secondary hover:text-primary transition-colors duration-200 font-medium">
              User Info
            </Link>
            <Link to="/payment" className="text-text-secondary hover:text-primary transition-colors duration-200 font-medium">
              Payment
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-2">
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <button className="md:hidden p-2 text-text-secondary hover:text-primary hover:bg-surface-hover rounded-dashboard transition-all duration-200">
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col space-y-4 mt-8">
                  <Link to="/" className="text-text-secondary hover:text-primary transition-colors duration-200 font-medium py-2 px-4 hover:bg-surface-hover rounded-dashboard">
                    Home
                  </Link>
                  <Link to="/lobby-data" className="text-text-secondary hover:text-primary transition-colors duration-200 font-medium py-2 px-4 hover:bg-surface-hover rounded-dashboard">
                    Lobby Data
                  </Link>
                  <Link to="/user-info" className="text-text-secondary hover:text-primary transition-colors duration-200 font-medium py-2 px-4 hover:bg-surface-hover rounded-dashboard">
                    User Info
                  </Link>
                  <Link to="/payment" className="text-text-secondary hover:text-primary transition-colors duration-200 font-medium py-2 px-4 hover:bg-surface-hover rounded-dashboard">
                    Payment
                  </Link>
                  <div className="border-t border-border pt-4 mt-4">
                    <button className="w-full flex items-center space-x-2 text-text-secondary hover:text-primary hover:bg-surface-hover rounded-dashboard transition-all duration-200 py-2 px-4">
                      <Bell className="w-5 h-5" />
                      <span>Notifications</span>
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-4">
              <button className="p-2 text-text-secondary hover:text-primary hover:bg-surface-hover rounded-dashboard transition-all duration-200 hover-scale">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-text-secondary hover:text-primary hover:bg-surface-hover rounded-dashboard transition-all duration-200 hover-scale">
                <Settings className="w-5 h-5" />
              </button>
            </div>
            
            {/* User Profile - Always visible */}
            <div className="flex items-center space-x-3 p-2 hover:bg-surface-hover rounded-dashboard transition-all duration-200 cursor-pointer hover-lift">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format"
                alt="User"
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="hidden sm:block">
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