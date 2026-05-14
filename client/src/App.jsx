import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Global Components
import Navbar from './components/Navbar';
import { OmniCursor } from './components/OmniCursor';
import StarsCanvas from './components/StarsCanvas';
import AmbientMusic from './components/AmbientMusic';

// Pages
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import AuthPage from './pages/AuthPage';
import UserHome from './pages/UserHome';
import ChatApp from './pages/ChatApp';
import ZenGames from './pages/ZenGames';
import MoodJournal from './pages/MoodJournal';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sanctumUser');
    return saved ? JSON.parse(saved) : null;
  });


  const handleLogout = () => {
    localStorage.removeItem('sanctumUser');
    localStorage.removeItem('currentSessionId'); 
    localStorage.removeItem('zenScore'); 
    setUser(null);
  };

  return (
    <BrowserRouter>
      {/* 1. Interactive Cursor Layers */}
      <OmniCursor />

      {/* 2. Background Layers */}
      <div className="aurora-bg"><div></div></div>
      <StarsCanvas />
      
      {/* 3. Main Application Wrapper */}
      <div style={{ minHeight: '100vh', width: '100vw', fontFamily: 'system-ui', position: 'relative', zIndex: 10 }}>
        
        {/* Global Components */}
        <Navbar user={user} onLogout={handleLogout} />
        <AmbientMusic />

        {/* Page Routes */}
        <Routes>
          <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/home" />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={!user ? <AuthPage setAuthUser={setUser} /> : <Navigate to="/home" />} />
          <Route path="/home" element={user ? <UserHome user={user} /> : <Navigate to="/login" />} />
          <Route path="/chat" element={user ? <ChatApp user={user} /> : <Navigate to="/login" />} />
          <Route path="/games" element={user ? <ZenGames user={user} /> : <Navigate to="/login" />} />
          <Route path="/journal" element={user ? <MoodJournal user={user} /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        
      </div>
    </BrowserRouter>
  );
}