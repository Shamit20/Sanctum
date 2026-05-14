import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Ghost } from 'lucide-react';

const AuthPage = ({ setAuthUser }) => {
  const [authMode, setAuthMode] = useState('login'); 
  const [identifier, setIdentifier] = useState(''); 
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAction = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMsg('');

    try {
      if (authMode === 'login') {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, { identifier, password });
        const userData = { id: res.data.userId, username: res.data.username };
        localStorage.setItem('sanctumUser', JSON.stringify(userData));
        setAuthUser(userData);
      } 
      else if (authMode === 'register-step1') {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register-step1`, { username, email });
        setSuccessMsg(res.data.message);
        setAuthMode('register-step2');
      }
      else if (authMode === 'register-step2') {
        if (!password.trim() || password.length < 6) return setError("Password must be at least 6 characters long.");
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/verify-otp`, { username, email, password, otp });
        const userData = { id: res.data.userId, username: res.data.username };
        localStorage.setItem('sanctumUser', JSON.stringify(userData));
        setAuthUser(userData);
      }
      else if (authMode === 'forgot-step1') {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, { email });
        setSuccessMsg(res.data.message);
        setAuthMode('forgot-step2');
      }
      else if (authMode === 'forgot-step2') {
        if (!password.trim() || password.length < 6) return setError("Password must be at least 6 characters long.");
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, { email, otp, newPassword: password });
        setSuccessMsg(res.data.message);
        setIdentifier(''); setPassword(''); setEmail(''); setOtp(''); setShowPassword(false); 
        setAuthMode('login');
      }
    } catch (err) { setError(err.response?.data?.error || "An error occurred"); }
  };

  const handleGuestMode = () => {
    const guestData = { id: 'guest', username: 'Guest User' };
    localStorage.setItem('sanctumUser', JSON.stringify(guestData));
    setAuthUser(guestData);
  };

  return (
    <div style={{ height: 'calc(100vh - 65px)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', position: 'relative', zIndex: 10 }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel" style={{ padding: '40px', borderRadius: '24px', width: '350px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ textAlign: 'center', margin: '0', fontSize: '1.8rem', fontWeight: '600' }}>
          {authMode === 'login' && 'Welcome Back'}
          {(authMode === 'register-step1' || authMode === 'register-step2') && 'Secure Sign Up'}
          {(authMode === 'forgot-step1' || authMode === 'forgot-step2') && 'Account Recovery'}
        </h2>
        {error && <div style={{ color: '#ef4444', fontSize: '0.9rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '8px' }}>{error}</div>}
        {successMsg && <div style={{ color: '#10b981', fontSize: '0.9rem', textAlign: 'center', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '10px', borderRadius: '8px' }}>{successMsg}</div>}
        
        <form onSubmit={handleAction} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {authMode === 'login' && (
            <>
              <input className="glass-input" autoComplete="off" placeholder="Username or Email" value={identifier} onChange={e => setIdentifier(e.target.value)} required style={{ padding: '14px', borderRadius: '12px' }} />
              <div style={{ position: 'relative', width: '100%' }}>
                <input className="glass-input" type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '14px', borderRadius: '12px', width: '100%', boxSizing: 'border-box' }} />
                <div onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '15px', top: '15px', cursor: 'pointer', color: '#a1a1aa' }}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </div>
              </div>
            </>
          )}
          {authMode === 'register-step1' && (
            <>
              <input className="glass-input" placeholder="Create a Username" value={username} onChange={e => setUsername(e.target.value)} required style={{ padding: '14px', borderRadius: '12px' }} />
              <input className="glass-input" type="email" placeholder="Official Recovery Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: '14px', borderRadius: '12px' }} />
              <div style={{ position: 'relative', width: '100%' }}>
                <input className="glass-input" type={showPassword ? "text" : "password"} placeholder="Create Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '14px', borderRadius: '12px', width: '100%', boxSizing: 'border-box' }} />
                <div onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '15px', top: '15px', cursor: 'pointer', color: '#a1a1aa' }}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </div>
              </div>
            </>
          )}
          {authMode === 'register-step2' && (
            <input className="glass-input" placeholder="Enter 6-Digit Code" value={otp} onChange={e => setOtp(e.target.value)} required style={{ padding: '14px', borderRadius: '12px', textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem' }} />
          )}
          {authMode === 'forgot-step1' && (
            <input className="glass-input" type="email" placeholder="Enter Recovery Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: '14px', borderRadius: '12px' }} />
          )}
          {authMode === 'forgot-step2' && (
            <>
              <input className="glass-input" placeholder="Enter 6-Digit Code" value={otp} onChange={e => setOtp(e.target.value)} required style={{ padding: '14px', borderRadius: '12px', textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem' }} />
              <div style={{ position: 'relative', width: '100%' }}>
                <input className="glass-input" type={showPassword ? "text" : "password"} placeholder="Create New Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '14px', borderRadius: '12px', width: '100%', boxSizing: 'border-box' }} />
                <div onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '15px', top: '15px', cursor: 'pointer', color: '#a1a1aa' }}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </div>
              </div>
            </>
          )}
          <button type="submit" style={{ padding: '14px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem', marginTop: '10px' }}>
            {authMode === 'login' && 'Sign In'}
            {authMode === 'register-step1' && 'Send Code'}
            {authMode === 'register-step2' && 'Verify & Create'}
            {authMode === 'forgot-step1' && 'Send Reset Code'}
            {authMode === 'forgot-step2' && 'Confirm & Reset'}
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
          {authMode === 'login' && <span style={{ fontSize: '0.85rem', color: '#a78bfa', cursor: 'pointer' }} onClick={() => { setError(''); setSuccessMsg(''); setAuthMode('forgot-step1'); }}>Forgot Password?</span>}
          <span style={{ fontSize: '0.85rem', color: '#a1a1aa', cursor: 'pointer' }} onClick={() => {
            setError(''); setSuccessMsg('');
            setAuthMode(authMode === 'login' ? 'register-step1' : 'login');
          }}>
            {authMode === 'login' ? "Don't have an account? Sign Up" : "Back to Sign In"}
          </span>
        </div>
        
        {authMode === 'login' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', margin: '5px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
              <span style={{ padding: '0 10px', color: '#71717a', fontSize: '0.8rem' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
            </div>
            <button onClick={handleGuestMode} style={{ padding: '14px', background: 'rgba(45, 212, 191, 0.1)', color: '#2dd4bf', border: '1px solid rgba(45, 212, 191, 0.3)', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '600' }}>
              <Ghost size={18} /> Enter Zero-Trace Mode
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
};
export default AuthPage;