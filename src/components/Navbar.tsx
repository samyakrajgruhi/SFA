import React, { useState, useEffect } from 'react';
import { LogOut, Menu, User } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';

const Navbar = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { user, isAuthenticated, logout } = useAuth();

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
              className="w-8 h-8 sm:w-12 sm:h-12 object-contain flex-shrink-0"
            />
            <span className="text-lg sm:text-xl font-bold text-text-primary">SFA</span>
          </Link>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-text-secondary hover:text-primary transition-colors duration-200 font-medium">
              Home
            </Link>
            <Link to="/lobby-data" className="text-text-secondary hover:text-primary transition-colors duration-200 font-medium">
              Lobby Data
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/user-info" className="text-text-secondary hover:text-primary transition-colors duration-200 font-medium">
                  User Info
                </Link>
                {user?.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className="text-text-secondary hover:text-primary transition-colors duration-200 font-medium"
                  >
                    Admin Panel
                  </Link>
                )}
                <Link to="/payment" className="text-text-secondary hover:text-primary transition-colors duration-200 font-medium">
                  Payment
                </Link>

              </>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
            )}
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
                  {isAuthenticated ? (
                    <>
                      <Link to="/user-info" className="text-text-secondary hover:text-primary transition-colors duration-200 font-medium py-2 px-4 hover:bg-surface-hover rounded-dashboard">
                        User Info
                      </Link>
                      <Link to="/payment" className="text-text-secondary hover:text-primary transition-colors duration-200 font-medium py-2 px-4 hover:bg-surface-hover rounded-dashboard">
                        Payment
                      </Link>
                    </>
                  ) : (
                    <Link to="/login" className="text-text-secondary hover:text-primary transition-colors duration-200 font-medium py-2 px-4 hover:bg-surface-hover rounded-dashboard">
                      Login
                    </Link>
                  )}

                  {isAuthenticated && user?.role === 'admin' && (
                    <Link 
                      to="/admin" 
                      className="text-text-secondary hover:text-primary transition-colors duration-200 font-medium"
                    >
                      Admin Panel
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            
            {/* User Profile - Only visible when authenticated */}
            {isAuthenticated ? (
              <>
                <Link to="/user-info" className="flex items-center space-x-3 p-2 hover:bg-surface-hover rounded-dashboard transition-all duration-200 cursor-pointer hover-lift">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-text-primary">{user?.name}</p>
                    <p className="text-xs text-text-muted">{user?.email}</p>
                  </div>
                </Link>
                
                <button 
                  onClick={logout}
                  className="p-2 text-text-secondary hover:text-warning hover:bg-warning-light rounded-dashboard transition-all duration-200 hover-scale"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;