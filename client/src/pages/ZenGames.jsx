import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { MoveHorizontal, Maximize, Type, Trash2, Eye, Sparkles } from 'lucide-react';

// FIX: Added the { user } prop here!
const ZenGames = ({ user }) => {
  const [activeGame, setActiveGame] = useState(null);
  const [score, setScore] = useState(0); 
  
  const [breathState, setBreathState] = useState('Inhale');
  const [bubbles, setBubbles] = useState([]);
  const [ripples, setRipples] = useState([]);
  const [trails, setTrails] = useState([]); 
  const [thought, setThought] = useState('');
  const [isReleasing, setIsReleasing] = useState(false);
  const [groundingStep, setGroundingStep] = useState(0);

  const [tensionLevel, setTensionLevel] = useState(0);
  const [tensionInterval, setTensionInterval] = useState(null);
  const [mantraInput, setMantraInput] = useState('');
  const [currentMantra, setCurrentMantra] = useState("I am safe in this present moment.");
  const [emdrSpeed, setEmdrSpeed] = useState(2.5);

  // FIX: Fetch the real score from the database when you open the games page
  useEffect(() => {
    if (user && user.id !== 'guest') {
      axios.get(`${import.meta.env.VITE_API_URL}/api/users/${user.id}/zenscore`)
        .then(res => {
           setScore(res.data.zenScore || 0);
           localStorage.setItem('zenScore', res.data.zenScore || 0); 
        }).catch(err => console.log(err));
    } else {
      setScore(parseInt(localStorage.getItem('zenScore') || '0'));
    }
  }, [user]);

  // FIX: Save score to database instantly on every point
  const incrementScore = () => {
    setScore(prev => {
      const newScore = prev + 1;
      localStorage.setItem('zenScore', newScore.toString());
      
      if (user && user.id !== 'guest') {
        // Silently save to database in the background
        axios.put(`${import.meta.env.VITE_API_URL}/api/users/${user.id}/zenscore`, { score: newScore }).catch(e => {});
      }
      return newScore;
    });
  };

  useEffect(() => {
    if (activeGame !== 'breathe') return;
    const interval = setInterval(() => {
      setBreathState(prev => {
        if (prev === 'Inhale') return 'Hold';
        if (prev === 'Hold') return 'Exhale';
        return 'Inhale';
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [activeGame]);

  useEffect(() => {
    if (activeGame !== 'bubbles') return;
    const interval = setInterval(() => {
      setBubbles(prev => {
        if (prev.length > 15) return prev;
        return [...prev, { id: Date.now(), x: Math.random() * 80 + 10, y: Math.random() * 80 + 10, size: Math.random() * 30 + 40 }];
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeGame]);

  const popBubble = (id) => { setBubbles(prev => prev.filter(b => b.id !== id)); incrementScore(); };

  const addRipple = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const newRipple = { id: Date.now(), x: e.clientX - rect.left, y: e.clientY - rect.top };
    setRipples(prev => [...prev, newRipple]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== newRipple.id)), 2000);
    incrementScore();
  };

  const handleWeaverMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const newTrail = { id: Date.now() + Math.random(), x: e.clientX - rect.left, y: e.clientY - rect.top };
    setTrails(prev => [...prev.slice(-40), newTrail]);
  };

  const releaseThought = () => { if (!thought.trim()) return; setIsReleasing(true); incrementScore(); };

  const startTension = () => {
    setTensionLevel(0);
    const interval = setInterval(() => { setTensionLevel(prev => prev >= 100 ? 100 : prev + 2); }, 50);
    setTensionInterval(interval);
  };

  const releaseTension = () => {
    if (tensionInterval) clearInterval(tensionInterval);
    if (tensionLevel > 20) incrementScore();
    setTensionLevel(-1); 
    setTimeout(() => setTensionLevel(0), 1000);
  };

  const handleMantraType = (e) => {
    const val = e.target.value; setMantraInput(val);
    if (val === currentMantra) {
      incrementScore();
      setTimeout(() => {
        setMantraInput('');
        const mantras = ["I am safe in this present moment.", "This feeling is temporary and will pass.", "I release what I cannot control.", "My breath is my anchor to the now."];
        setCurrentMantra(mantras[Math.floor(Math.random() * mantras.length)]);
      }, 1000);
    }
  };

  const groundingPrompts = [
    { sense: "SEE", desc: "Acknowledge 5 things you can see around you." },
    { sense: "FEEL", desc: "Acknowledge 4 things you can physically feel." },
    { sense: "HEAR", desc: "Acknowledge 3 things you can hear." },
    { sense: "SMELL", desc: "Acknowledge 2 things you can smell." },
    { sense: "TASTE", desc: "Acknowledge 1 thing you can taste." },
    { sense: "PRESENT", desc: "You are here. You are grounded. You are safe." }
  ];

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', color: '#fff', zIndex: 10, position: 'relative' }}>
      <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px', color: '#2dd4bf' }}>The Zen Zone</h1>
      <p style={{ color: '#a1a1aa', margin: '0 0 40px 0' }}>Grounding exercises to reset your nervous system.</p>

      {!activeGame ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px' }}>
          <motion.div whileHover={{ y: -5 }} className="glass-panel" onClick={() => setActiveGame('breathe')} style={{ padding: '30px', borderRadius: '24px', cursor: 'pointer', textAlign: 'center', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <div style={{ width: '60px', height: '60px', margin: '0 auto 15px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#8b5cf6', animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }}></div>
            </div>
            <h2 style={{ margin: '0 0 10px', fontSize: '1.2rem' }}>Breathing Lotus</h2>
            <p style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>A visual respiratory pacer to ease anxiety.</p>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="glass-panel" onClick={() => setActiveGame('emdr')} style={{ padding: '30px', borderRadius: '24px', cursor: 'pointer', textAlign: 'center', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
            <div style={{ width: '60px', height: '60px', margin: '0 auto 15px', borderRadius: '50%', background: 'rgba(14, 165, 233, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <MoveHorizontal size={24} color="#0ea5e9" />
            </div>
            <h2 style={{ margin: '0 0 10px', fontSize: '1.2rem' }}>EMDR Tracker</h2>
            <p style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>Bilateral eye movement to process emotional distress.</p>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="glass-panel" onClick={() => setActiveGame('bubbles')} style={{ padding: '30px', borderRadius: '24px', cursor: 'pointer', textAlign: 'center', border: '1px solid rgba(45, 212, 191, 0.3)' }}>
             <div style={{ width: '60px', height: '60px', margin: '0 auto 15px', borderRadius: '50%', background: 'rgba(45, 212, 191, 0.2)', border: '2px dashed #2dd4bf', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <span style={{ color: '#2dd4bf', fontWeight: 'bold' }}>{score}</span>
             </div>
            <h2 style={{ margin: '0 0 10px', fontSize: '1.2rem' }}>Mindful Bubbles</h2>
            <p style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>A satisfying distraction tool for racing thoughts.</p>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="glass-panel" onClick={() => setActiveGame('tension')} style={{ padding: '30px', borderRadius: '24px', cursor: 'pointer', textAlign: 'center', border: '1px solid rgba(249, 115, 22, 0.3)' }}>
            <div style={{ width: '60px', height: '60px', margin: '0 auto 15px', borderRadius: '50%', background: 'rgba(249, 115, 22, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Maximize size={24} color="#f97316" />
            </div>
            <h2 style={{ margin: '0 0 10px', fontSize: '1.2rem' }}>Tension Hold</h2>
            <p style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>Physically squeeze and release pent-up stress.</p>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="glass-panel" onClick={() => setActiveGame('mantra')} style={{ padding: '30px', borderRadius: '24px', cursor: 'pointer', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <div style={{ width: '60px', height: '60px', margin: '0 auto 15px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Type size={24} color="#10b981" />
            </div>
            <h2 style={{ margin: '0 0 10px', fontSize: '1.2rem' }}>Mantra Focus</h2>
            <p style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>Mindful typing exercises to anchor you to the present.</p>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="glass-panel" onClick={() => setActiveGame('release')} style={{ padding: '30px', borderRadius: '24px', cursor: 'pointer', textAlign: 'center', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
            <div style={{ width: '60px', height: '60px', margin: '0 auto 15px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Trash2 size={24} color="#f43f5e" />
            </div>
            <h2 style={{ margin: '0 0 10px', fontSize: '1.2rem' }}>Thought Release</h2>
            <p style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>Type a heavy thought and watch it dissolve.</p>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="glass-panel" onClick={() => setActiveGame('ripple')} style={{ padding: '30px', borderRadius: '24px', cursor: 'pointer', textAlign: 'center', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <div style={{ width: '60px', height: '60px', margin: '0 auto 15px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #3b82f6' }}></div>
            </div>
            <h2 style={{ margin: '0 0 10px', fontSize: '1.2rem' }}>Cosmic Ripples</h2>
            <p style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>Create soothing ripples to center your mind.</p>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="glass-panel" onClick={() => { setActiveGame('grounding'); setGroundingStep(0); }} style={{ padding: '30px', borderRadius: '24px', cursor: 'pointer', textAlign: 'center', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
            <div style={{ width: '60px', height: '60px', margin: '0 auto 15px', borderRadius: '50%', background: 'rgba(234, 179, 8, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Eye size={24} color="#eab308" />
            </div>
            <h2 style={{ margin: '0 0 10px', fontSize: '1.2rem' }}>5-4-3-2-1 Grounding</h2>
            <p style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>A guided sensory checklist to halt panic attacks.</p>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="glass-panel" onClick={() => setActiveGame('weaver')} style={{ padding: '30px', borderRadius: '24px', cursor: 'pointer', textAlign: 'center', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
            <div style={{ width: '60px', height: '60px', margin: '0 auto 15px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Sparkles size={24} color="#a855f7" />
            </div>
            <h2 style={{ margin: '0 0 10px', fontSize: '1.2rem' }}>Light Weaver</h2>
            <p style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>Paint soothing trails of stardust to quiet your mind.</p>
          </motion.div>

        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '40px', borderRadius: '24px', minHeight: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
          <button onClick={() => { setActiveGame(null); setBubbles([]); setRipples([]); setTrails([]); setIsReleasing(false); setThought(''); setTensionLevel(0); setMantraInput(''); }} style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', zIndex: 20 }}>← Back to Menu</button>
          
          {activeGame === 'emdr' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', width: '100%' }}>
              <p style={{ color: '#a1a1aa', marginBottom: '40px', fontSize: '1.1rem', textAlign: 'center' }}>Follow the orb with your eyes without moving your head.<br/>Bilateral stimulation helps the brain process trauma and lower panic.</p>
              
              <div style={{ width: '80%', height: '12px', background: 'rgba(14, 165, 233, 0.1)', borderRadius: '10px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
                <motion.div key={emdrSpeed} animate={{ x: ['-38vw', '38vw', '-38vw'] }} transition={{ repeat: Infinity, duration: emdrSpeed, ease: "easeInOut" }} style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#0ea5e9', boxShadow: '0 0 30px #0ea5e9', position: 'absolute' }} />
              </div>

              <div style={{ marginTop: '60px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                <span style={{ color: '#a1a1aa' }}>Speed:</span>
                <button onClick={() => setEmdrSpeed(3.5)} style={{ background: emdrSpeed === 3.5 ? '#0ea5e9' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '15px', cursor: 'pointer' }}>Slow</button>
                <button onClick={() => {setEmdrSpeed(2.5); incrementScore();}} style={{ background: emdrSpeed === 2.5 ? '#0ea5e9' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '15px', cursor: 'pointer' }}>Medium</button>
                <button onClick={() => setEmdrSpeed(1.5)} style={{ background: emdrSpeed === 1.5 ? '#0ea5e9' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '15px', cursor: 'pointer' }}>Fast</button>
              </div>
            </div>
          )}

          {activeGame === 'tension' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', width: '100%' }}>
              <p style={{ color: '#a1a1aa', marginBottom: '20px', fontSize: '1.1rem', textAlign: 'center' }}>Click and hold the sphere to gather your physical tension.<br/>When it feels heavy enough, release your mouse to let it go.</p>
              
              <div onMouseDown={startTension} onMouseUp={releaseTension} onMouseLeave={releaseTension} onTouchStart={startTension} onTouchEnd={releaseTension} style={{ width: '300px', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                {tensionLevel >= 0 ? (
                  <motion.div 
                    animate={{ 
                      scale: 1 - (tensionLevel / 150),
                      x: tensionLevel > 40 ? [-2, 2, -2, 2, 0] : 0,
                      backgroundColor: `rgb(${250}, ${150 - tensionLevel}, ${50 - tensionLevel/2})`,
                      boxShadow: `0 0 ${tensionLevel}px rgba(249, 115, 22, ${tensionLevel/100})`
                    }}
                    transition={{ type: 'tween', duration: 0.1 }}
                    style={{ width: '150px', height: '150px', borderRadius: '50%', background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }}>{tensionLevel === 0 ? "HOLD" : ""}</span>
                  </motion.div>
                ) : (
                  <motion.div initial={{ scale: 0.5, opacity: 1 }} animate={{ scale: 5, opacity: 0 }} transition={{ duration: 1, ease: "easeOut" }} style={{ width: '150px', height: '150px', borderRadius: '50%', background: '#f97316' }} />
                )}
              </div>
            </div>
          )}

          {activeGame === 'mantra' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', width: '100%' }}>
              <p style={{ color: '#a1a1aa', marginBottom: '40px', fontSize: '1.1rem', textAlign: 'center' }}>Focus your mind by typing the affirmation below exactly as it appears.</p>
              
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.1)', marginBottom: '30px', position: 'relative' }}>
                {currentMantra}
                <div style={{ position: 'absolute', top: 0, left: 0, color: '#10b981', overflow: 'hidden', whiteSpace: 'nowrap', width: `${(mantraInput.length / currentMantra.length) * 100}%`, textShadow: '0 0 20px rgba(16, 185, 129, 0.5)' }}>
                  {currentMantra}
                </div>
              </div>

              <input className="glass-input" value={mantraInput} onChange={handleMantraType} autoFocus placeholder="Type here..." style={{ width: '80%', maxWidth: '500px', padding: '16px', borderRadius: '12px', textAlign: 'center', fontSize: '1.2rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.3)' }} />
              {mantraInput === currentMantra && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ color: '#10b981', marginTop: '20px', fontWeight: 'bold' }}>Breathe in. Breathe out.</motion.div>}
            </div>
          )}

          {activeGame === 'breathe' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', width: '100%' }}>
              <motion.div animate={{ scale: breathState === 'Inhale' ? 1.8 : breathState === 'Hold' ? 1.8 : 1, opacity: breathState === 'Hold' ? 0.7 : 1 }} transition={{ duration: 4, ease: "easeInOut" }} style={{ width: '150px', height: '150px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid rgba(139, 92, 246, 0.3)', filter: 'blur(4px)' }}></div>
                <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', opacity: 0.5 }}></div>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', textShadow: '0 2px 10px rgba(0,0,0,0.5)', zIndex: 10 }}>{breathState}</span>
              </motion.div>
            </div>
          )}

          {activeGame === 'bubbles' && (
            <div style={{ width: '100%', height: '400px', position: 'relative' }}>
               <div style={{ position: 'absolute', top: 0, right: 0, color: '#2dd4bf', fontWeight: 'bold' }}>Bubbles Cleared: {score}</div>
               <AnimatePresence>
                 {bubbles.map(b => (
                   <motion.div key={b.id} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.8 }} exit={{ scale: 1.5, opacity: 0 }} onClick={() => popBubble(b.id)} style={{ position: 'absolute', left: `${b.x}%`, top: `${b.y}%`, width: `${b.size}px`, height: `${b.size}px`, borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), rgba(45, 212, 191, 0.2))', border: '1px solid rgba(255,255,255,0.6)', cursor: 'pointer', boxShadow: 'inset 0 0 10px rgba(255,255,255,0.8), 0 0 15px rgba(45, 212, 191, 0.3)' }} />
                 ))}
               </AnimatePresence>
            </div>
          )}

          {activeGame === 'release' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', width: '100%' }}>
              <AnimatePresence mode="wait">
                {!isReleasing ? (
                  <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                    <p style={{ color: '#a1a1aa', marginBottom: '20px', fontSize: '1.1rem' }}>What is weighing heavily on your mind right now?</p>
                    <input className="glass-input" value={thought} onChange={e => setThought(e.target.value)} placeholder="I am worried about..." style={{ width: '100%', padding: '16px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center', fontSize: '1rem' }} />
                    <button onClick={releaseThought} disabled={!thought.trim()} style={{ background: thought.trim() ? '#f43f5e' : 'rgba(244, 63, 94, 0.2)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '20px', cursor: thought.trim() ? 'pointer' : 'not-allowed' }}>Let It Go</button>
                  </motion.div>
                ) : (
                  <motion.div key="release" initial={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }} animate={{ opacity: 0, y: -150, scale: 1.5, filter: 'blur(10px)' }} transition={{ duration: 4, ease: 'easeOut' }} onAnimationComplete={() => { setIsReleasing(false); setThought(''); }} style={{ fontSize: '1.5rem', color: '#f43f5e', textAlign: 'center', maxWidth: '80%' }}>{thought}</motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {activeGame === 'ripple' && (
            <div onClick={addRipple} style={{ width: '100%', height: '400px', position: 'relative', overflow: 'hidden', cursor: 'crosshair', borderRadius: '16px', background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ position: 'absolute', top: '20px', width: '100%', textAlign: 'center', color: '#a1a1aa', pointerEvents: 'none' }}>Click anywhere to create a ripple</div>
              <AnimatePresence>
                {ripples.map(r => (
                  <motion.div key={r.id} initial={{ scale: 0, opacity: 0.8 }} animate={{ scale: 5, opacity: 0 }} transition={{ duration: 2, ease: "easeOut" }} style={{ position: 'absolute', left: r.x - 25, top: r.y - 25, width: '50px', height: '50px', borderRadius: '50%', border: '2px solid rgba(59, 130, 246, 0.8)', boxShadow: 'inset 0 0 20px rgba(59, 130, 246, 0.5)', pointerEvents: 'none' }} />
                ))}
              </AnimatePresence>
            </div>
          )}

          {activeGame === 'grounding' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', width: '100%', textAlign: 'center' }}>
              <AnimatePresence mode="wait">
                <motion.div key={groundingStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.5 }}>
                  <div style={{ fontSize: '6rem', fontWeight: 'bold', color: 'rgba(234, 179, 8, 0.2)', marginBottom: '-30px' }}>{groundingPrompts[groundingStep].count > 0 ? groundingPrompts[groundingStep].count : ''}</div>
                  <h2 style={{ fontSize: '2rem', color: '#eab308', marginBottom: '15px' }}>{groundingPrompts[groundingStep].sense}</h2>
                  <p style={{ fontSize: '1.2rem', color: '#e4e4e7', maxWidth: '400px', lineHeight: '1.6' }}>{groundingPrompts[groundingStep].desc}</p>
                </motion.div>
              </AnimatePresence>
              {groundingStep < 5 && (
                <button onClick={() => { setGroundingStep(prev => prev + 1); incrementScore(); }} style={{ marginTop: '40px', background: '#eab308', color: '#000', border: 'none', padding: '12px 30px', borderRadius: '30px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}>Acknowledge & Continue</button>
              )}
            </div>
          )}

          {activeGame === 'weaver' && (
            <div 
              onMouseMove={handleWeaverMove} 
              style={{ width: '100%', height: '400px', position: 'relative', overflow: 'hidden', cursor: 'crosshair', borderRadius: '16px', background: 'rgba(0,0,0,0.3)' }}
            >
              <div style={{ position: 'absolute', top: '20px', width: '100%', textAlign: 'center', color: '#a1a1aa', pointerEvents: 'none' }}>Weave light by moving your cursor smoothly</div>
              <AnimatePresence>
                {trails.map(t => (
                  <motion.div 
                    key={t.id} 
                    initial={{ scale: 1, opacity: 0.8 }} 
                    animate={{ scale: 0, opacity: 0 }} 
                    transition={{ duration: 1.5, ease: "easeOut" }} 
                    style={{ position: 'absolute', left: t.x - 10, top: t.y - 10, width: '20px', height: '20px', borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 20px #a855f7', pointerEvents: 'none' }} 
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default ZenGames;