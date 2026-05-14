import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { BarChart2, MessageCircle, BookHeart, Cpu, AlertTriangle, LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = ({ user, onLogout }) => {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isActive = (path) => location.pathname === path;

  // Responsive State
  const [isMobile, setIsMobile] = useState(window.innerWidth < 850);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 850);
      if (window.innerWidth >= 850) setIsMenuOpen(false); // Auto-close if expanded
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDeleteAccount = async () => {
    if (user?.id === 'guest') {
      alert("Guest accounts are completely untraceable and leave no data to delete!");
      return;
    }
    if (window.confirm("WARNING: This will permanently delete your account and securely erase all your encrypted chat history. Are you sure?")) {
      try {
        await axios.delete(`http://localhost:5001/api/auth/account/${user.id}`);
        onLogout(); 
      } catch (error) { alert("Failed to delete account. Please try again."); }
    }
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <nav className="glass-panel" style={{ 
        position: isLanding ? 'fixed' : 'sticky', 
        top: isLanding ? '20px' : '0', 
        left: isLanding ? '50%' : '0', 
        transform: isLanding ? 'translateX(-50%)' : 'none', 
        width: isLanding ? '90%' : '100%', 
        maxWidth: isLanding ? '1400px' : 'none', 
        zIndex: 100, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: isMobile ? '15px 20px' : (isLanding ? '15px 25px' : '15px 40px'), 
        
        /* THIS IS THE MAGIC FIX: */
        boxSizing: 'border-box', 
        
        /* Transparent on Landing, Solid Glass everywhere else */
        background: isLanding ? 'transparent' : 'rgba(10, 15, 30, 0.65)', 
        backdropFilter: isLanding ? 'none' : 'blur(20px)', 
        WebkitBackdropFilter: isLanding ? 'none' : 'blur(20px)', 
        borderBottom: isLanding ? 'none' : '1px solid rgba(139, 92, 246, 0.15)', 
        borderRadius: isLanding ? '40px' : '0', 
        transition: 'all 0.3s ease',
        pointerEvents: isLanding ? 'none' : 'auto' 
      }}>
        
        {/* LEFT: SANCTUM LOGO */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', pointerEvents: 'auto' }}>
          <Link to="/" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{ width: '14px', height: '14px', background: '#8b5cf6', borderRadius: '50%', boxShadow: '0 0 20px #8b5cf6' }}></div>
            <h2 style={{ margin: 0, color: '#fff', fontSize: '1.4rem', letterSpacing: '-0.5px', fontWeight: '700' }}>Sanctum</h2>
          </Link>
        </div>

        {/* DESKTOP LAYOUT (Hidden on Mobile) */}
        {!isMobile && (
          <>
            {/* CENTER: TOOL LINKS */}
            <div style={{ flex: 2, display: 'flex', justifyContent: 'center', gap: '40px', alignItems: 'center', pointerEvents: 'auto' }}>
              {user && !isLanding && (
                <>
                  {user.id !== 'guest' && (
                    <Link to="/home" style={{ color: isActive('/home') ? '#fff' : '#a1a1aa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: isActive('/home') ? '600' : '400', transition: 'color 0.3s' }}>
                      <BarChart2 size={18}/> Insights
                    </Link>
                  )}
                  <Link to="/chat" style={{ color: isActive('/chat') ? '#a78bfa' : '#a1a1aa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: isActive('/chat') ? '600' : '400', transition: 'color 0.3s' }}>
                    <MessageCircle size={18}/> Sanctuary
                  </Link>
                  <Link to="/journal" style={{ color: isActive('/journal') ? '#f43f5e' : '#a1a1aa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: isActive('/journal') ? '600' : '400', transition: 'color 0.3s' }}>
                    <BookHeart size={18}/> Journal
                  </Link>
                  <Link to="/games" style={{ color: isActive('/games') ? '#2dd4bf' : '#a1a1aa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: isActive('/games') ? '600' : '400', transition: 'color 0.3s' }}>
                    <Cpu size={18}/> Zen Zone
                  </Link>
                </>
              )}
            </div>

            {/* RIGHT: SIGN IN / USER PROFILE */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '20px', alignItems: 'center', pointerEvents: 'auto' }}>
              {user ? (
                <>
                  {!isLanding && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: user.id === 'guest' ? '#2dd4bf' : '#10b981', boxShadow: `0 0 10px ${user.id === 'guest' ? '#2dd4bf' : '#10b981'}` }}></span>
                      <span style={{ color: '#e4e4e7', fontSize: '0.9rem', fontWeight: '500' }}>{user.username}</span>
                    </div>
                  )}
                  {user.id !== 'guest' && !isLanding && (
                    <button onClick={handleDeleteAccount} title="Delete Account" style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', padding: '8px', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                      <AlertTriangle size={18} />
                    </button>
                  )}
                  <button onClick={() => { onLogout(); closeMenu(); }} style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: '600', transition: 'all 0.3s', backdropFilter: 'blur(10px)' }}>
                    <LogOut size={16} /> Exit
                  </button>
                </>
              ) : (
                <Link to="/login" style={{ color: '#fff', textDecoration: 'none', fontSize: '0.95rem', fontWeight: '600', background: isLanding ? 'transparent' : 'rgba(255,255,255,0.1)', border: isLanding ? '1px solid rgba(255,255,255,0.3)' : 'none', padding: '10px 24px', borderRadius: '30px', transition: 'all 0.3s', backdropFilter: 'blur(10px)' }}>
                  Sign In
                </Link>
              )}
            </div>
          </>
        )}

        {/* MOBILE LAYOUT (Hamburger Toggle) */}
        {isMobile && (
           <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', pointerEvents: 'auto' }}>
             <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px' }}>
               {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
             </button>
           </div>
        )}
      </nav>

      {/* MOBILE DROPDOWN MENU */}
      <AnimatePresence>
        {isMobile && isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }} 
            transition={{ duration: 0.2 }}
            style={{ 
              position: isLanding ? 'fixed' : 'absolute', 
              top: isLanding ? '75px' : '65px', 
              left: isLanding ? '5%' : '0', 
              width: isLanding ? '90%' : '100%', 
              background: 'rgba(10, 15, 30, 0.95)', 
              backdropFilter: 'blur(20px)', 
              borderBottom: isLanding ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(139, 92, 246, 0.15)', 
              borderLeft: isLanding ? '1px solid rgba(139, 92, 246, 0.3)' : 'none', 
              borderRight: isLanding ? '1px solid rgba(139, 92, 246, 0.3)' : 'none', 
              borderRadius: isLanding ? '20px' : '0 0 24px 24px', 
              padding: '20px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '20px', 
              zIndex: 99,
              pointerEvents: 'auto' 
            }}
          >
            {user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: user.id === 'guest' ? '#2dd4bf' : '#10b981', boxShadow: `0 0 10px ${user.id === 'guest' ? '#2dd4bf' : '#10b981'}` }}></span>
                     <span style={{ color: '#fff', fontSize: '1rem', fontWeight: '600' }}>{user.username}</span>
                  </div>
                  {user.id !== 'guest' && (
                    <button onClick={handleDeleteAccount} style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <AlertTriangle size={18} /> <span style={{ fontSize: '0.8rem' }}>Delete</span>
                    </button>
                  )}
                </div>
                
                {user.id !== 'guest' && (
                  <Link to="/home" onClick={closeMenu} style={{ color: isActive('/home') ? '#fff' : '#a1a1aa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.1rem', fontWeight: isActive('/home') ? '600' : '400' }}>
                    <BarChart2 size={20} color={isActive('/home') ? '#fff' : '#a1a1aa'} /> Insights Dashboard
                  </Link>
                )}
                <Link to="/chat" onClick={closeMenu} style={{ color: isActive('/chat') ? '#a78bfa' : '#a1a1aa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.1rem', fontWeight: isActive('/chat') ? '600' : '400' }}>
                  <MessageCircle size={20} color={isActive('/chat') ? '#a78bfa' : '#a1a1aa'} /> The Sanctuary
                </Link>
                <Link to="/journal" onClick={closeMenu} style={{ color: isActive('/journal') ? '#f43f5e' : '#a1a1aa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.1rem', fontWeight: isActive('/journal') ? '600' : '400' }}>
                  <BookHeart size={20} color={isActive('/journal') ? '#f43f5e' : '#a1a1aa'} /> Private Journal
                </Link>
                <Link to="/games" onClick={closeMenu} style={{ color: isActive('/games') ? '#2dd4bf' : '#a1a1aa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.1rem', fontWeight: isActive('/games') ? '600' : '400' }}>
                  <Cpu size={20} color={isActive('/games') ? '#2dd4bf' : '#a1a1aa'} /> Zen Zone
                </Link>
                
                <button onClick={() => { onLogout(); closeMenu(); }} style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '14px', borderRadius: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1rem', fontWeight: '600', marginTop: '10px' }}>
                  <LogOut size={20} /> Exit Sanctum
                </button>
              </>
            ) : (
              <Link to="/login" onClick={closeMenu} style={{ color: '#fff', textDecoration: 'none', fontSize: '1.1rem', textAlign: 'center', fontWeight: '600', background: 'rgba(255,255,255,0.1)', padding: '14px', borderRadius: '16px' }}>
                Sign In
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar;