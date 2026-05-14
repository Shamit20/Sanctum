import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Lock, Camera, Cpu, BookHeart, Fingerprint } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const targetRef = useRef(null);
  
  // Math for 4 Panels: Move -300vw (-75%) across a 400vw container
  const { scrollYProgress } = useScroll({ target: targetRef });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);
  
  const [chatStep, setChatStep] = useState(0);
  const [cryptoHash, setCryptoHash] = useState("8a12d4e5f6a7b8c9d0e1f2a3");
  const emotions = ["SAD", "ANALYZING...", "CALM", "NEUTRAL"];
  const [emotionIndex, setEmotionIndex] = useState(0);

  useEffect(() => {
    const runChat = () => {
      setChatStep(0); setTimeout(() => setChatStep(1), 1000);
      setTimeout(() => setChatStep(2), 3000); setTimeout(() => setChatStep(3), 5000);
    };
    runChat(); const interval = setInterval(runChat, 9000);
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    const interval = setInterval(() => setCryptoHash(Array.from({length: 24}, () => Math.floor(Math.random() * 16).toString(16)).join('')), 800);
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    const interval = setInterval(() => setEmotionIndex((prev) => (prev + 1) % emotions.length), 2500);
    return () => clearInterval(interval);
  }, [emotions.length]);

  return (
    <div style={{ width: '100%' }}>
      {/* 1. HERO SECTION */}
      <section style={{ height: '100svh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px', textAlign: 'center', position: 'relative' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: "easeOut" }} style={{ zIndex: 10 }}>
          <h1 style={{ fontSize: '6rem', fontWeight: '800', margin: '0 0 10px 0', letterSpacing: '-2px', background: 'linear-gradient(to right, #fff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Sanctum
          </h1>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '400', color: '#a1a1aa', margin: '0 0 40px 0' }}>A quiet place for your mind.</h2>
        </motion.div>
        <motion.div animate={{ y: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 2 }} style={{ position: 'absolute', bottom: '50px', color: '#71717a', fontSize: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          <span>Scroll down</span>
          <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, #a78bfa, transparent)' }}></div>
        </motion.div>
      </section>

      {/* 2. THE STICKY HORIZONTAL SCROLL TRAP (Now 400vh/400vw for 4 Panels) */}
      <section ref={targetRef} style={{ position: 'relative', height: '400vh', width: '100%' }}>
        <div style={{ position: 'sticky', top: 0, height: '100svh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
          <motion.div style={{ x, display: 'flex', width: '400vw' }}>
            
            {/* Panel A: Empathy */}
            <div style={{ width: '100vw', height: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 10vw', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '60px', width: '100%', maxWidth: '1200px' }}>
                <div style={{ flex: '1 1 400px' }}>
                  <h2 style={{ fontSize: '3.5rem', fontWeight: '600', marginBottom: '20px', lineHeight: '1.2' }}>Sometimes, you don't need advice.</h2>
                  <p style={{ fontSize: '1.2rem', color: '#a1a1aa', lineHeight: '1.7' }}>You just need a safe space to be heard without judgment or interruption.</p>
                </div>
                <div className="glass-panel" style={{ flex: '1 1 400px', padding: '40px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '15px', minHeight: '250px', justifyContent: 'center' }}>
                  <AnimatePresence>
                    {chatStep >= 1 && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#8b5cf6', padding: '16px 24px', borderRadius: '20px 20px 4px 20px', color: '#fff', alignSelf: 'flex-end', maxWidth: '85%', fontSize: '1.1rem', lineHeight: '1.5' }}>
                      My mind won't quiet down. I feel like I'm constantly running, but getting nowhere.
                    </motion.div>}
                    {chatStep === 2 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ alignSelf: 'flex-start', color: '#a1a1aa', fontSize: '0.9rem', fontStyle: 'italic', marginLeft: '10px' }}>
                      Sanctum is holding space...
                    </motion.div>}
                    {chatStep >= 3 && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px 24px', borderRadius: '20px 20px 20px 4px', color: '#e2e8f0', alignSelf: 'flex-start', maxWidth: '85%', fontSize: '1.1rem', lineHeight: '1.5' }}>
                      You've been carrying the weight of the world for a while. You don't have to be productive here. Let's just sit in the quiet together.
                    </motion.div>}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Panel B: Privacy */}
            <div style={{ width: '100vw', height: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 10vw', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap-reverse', alignItems: 'center', gap: '60px', width: '100%', maxWidth: '1200px' }}>
                <div className="glass-panel" style={{ flex: '1 1 400px', padding: '50px 40px', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <Lock size={60} color="#2dd4bf" style={{ marginBottom: '30px' }} />
                  <div style={{ fontFamily: 'monospace', color: 'rgba(45, 212, 191, 0.6)', fontSize: '1rem', wordBreak: 'break-all', lineHeight: '1.8' }}>
                    aes-256-cbc:<br/><span style={{ color: '#fff', fontSize: '1.2rem' }}>{cryptoHash}</span><br/><br/><span style={{ color: '#2dd4bf', fontWeight: 'bold' }}>[ Local Vault Secured ]</span>
                  </div>
                </div>
                <div style={{ flex: '1 1 400px' }}>
                  <h2 style={{ fontSize: '3.5rem', fontWeight: '600', marginBottom: '20px', lineHeight: '1.2', color: '#2dd4bf' }}>Your vulnerability is not a product.</h2>
                  <p style={{ fontSize: '1.2rem', color: '#a1a1aa', lineHeight: '1.7' }}>Built on the MERN stack with strict local processing. Your data is encrypted dynamically before it ever leaves your screen.</p>
                </div>
              </div>
            </div>

            {/* Panel C: Multi-Modal */}
            <div style={{ width: '100vw', height: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 10vw', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '60px', width: '100%', maxWidth: '1200px' }}>
                <div style={{ flex: '1 1 400px' }}>
                  <h2 style={{ fontSize: '3.5rem', fontWeight: '600', marginBottom: '20px', lineHeight: '1.2', color: '#f43f5e' }}>We read between the lines.</h2>
                  <p style={{ fontSize: '1.2rem', color: '#a1a1aa', lineHeight: '1.7' }}>Words can hide how we truly feel. Sanctum uses optional, secure edge-computing to read your facial expressions, allowing the AI to respond to your actual emotional state.</p>
                </div>
                <div className="glass-panel" style={{ flex: '1 1 400px', padding: '40px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '350px', position: 'relative', overflow: 'hidden' }}>
                   <Camera size={80} color="#f43f5e" opacity={0.8} />
                   <motion.div animate={{ y: [-120, 120, -120] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} style={{ position: 'absolute', width: '200px', height: '3px', background: '#f43f5e', boxShadow: '0 0 20px #f43f5e' }} />
                   <div style={{ position: 'absolute', bottom: '30px', background: 'rgba(0,0,0,0.8)', padding: '10px 20px', borderRadius: '15px', fontSize: '1rem', border: '1px solid rgba(244, 63, 94, 0.3)' }}>EMOTION: <span style={{ color: '#fff', fontWeight: 'bold' }}>{emotions[emotionIndex]}</span></div>
                </div>
              </div>
            </div>

            {/* Panel D: THE ARCHITECTURE OF EMPATHY (New!) */}
            <div style={{ width: '100vw', height: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 10vw', boxSizing: 'border-box' }}>
              <h2 style={{ fontSize: '3.5rem', fontWeight: '600', marginBottom: '40px', color: '#fff' }}>The Architecture of Empathy.</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', width: '100%', maxWidth: '1200px' }}>
                <div className="glass-panel" style={{ padding: '40px', borderRadius: '24px' }}>
                  <Lock size={32} color="#8b5cf6" style={{ marginBottom: '20px' }} />
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Zero-Knowledge</h3>
                  <p style={{ color: '#a1a1aa', lineHeight: '1.6' }}>Every message is encrypted dynamically using AES-256-CBC. No plaintext is ever written to our databases.</p>
                </div>
                <div className="glass-panel" style={{ padding: '40px', borderRadius: '24px' }}>
                  <Cpu size={32} color="#f43f5e" style={{ marginBottom: '20px' }} />
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Guardian Protocol</h3>
                  <p style={{ color: '#a1a1aa', lineHeight: '1.6' }}>A deterministic safety middleware that monitors for crisis keywords to instantly provide verified emergency helplines.</p>
                </div>
                <div className="glass-panel" style={{ padding: '40px', borderRadius: '24px' }}>
                  <Fingerprint size={32} color="#2dd4bf" style={{ marginBottom: '20px' }} />
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Zero-Trace Mode</h3>
                  <p style={{ color: '#a1a1aa', lineHeight: '1.6' }}>Bypass authentication entirely. In Guest Mode, database write-operations are blocked. Your interactions exist only in volatile RAM.</p>
                </div>
              </div>
            </div>

          </motion.div>
        </div>
      </section>

      {/* 3. FINAL CTA SECTIONS */}
      <section style={{ height: '100svh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 10vw', boxSizing: 'border-box' }}>
        
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ fontSize: '4rem', fontWeight: '700', marginBottom: '15px', color: '#fff', letterSpacing: '-1px' }}>
          Instruments of Peace.
        </motion.h2>
        <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }} style={{ fontSize: '1.2rem', color: '#a1a1aa', marginBottom: '50px', textAlign: 'center', maxWidth: '700px', lineHeight: '1.6' }}>
          A carefully curated suite of tools designed to ground your nervous system, protect your thoughts, and restore your inner quiet.
        </motion.p>
        
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
          variants={{ visible: { transition: { staggerChildren: 0.2 } }, hidden: {} }}
          style={{ display: 'flex', gap: '30px', width: '100%', maxWidth: '1200px', flexWrap: 'wrap', marginBottom: '60px' }}
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', bounce: 0.4, duration: 1 } } }} whileHover={{ y: -10, boxShadow: '0 10px 30px rgba(139, 92, 246, 0.2)', borderColor: 'rgba(139, 92, 246, 0.5)' }} className="glass-panel" style={{ flex: '1 1 300px', padding: '40px', borderRadius: '24px', borderTop: '4px solid #8b5cf6', transition: 'all 0.3s ease' }}>
            <h3 style={{ fontSize: '1.8rem', color: '#8b5cf6', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}><Cpu size={24} /> The Zen Zone</h3>
            <p style={{ color: '#a1a1aa', lineHeight: '1.6' }}>Nine clinically inspired grounding tools including EMDR visual tracking, sensory exercises, and resonant frequency bowls.</p>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', bounce: 0.4, duration: 1 } } }} whileHover={{ y: -10, boxShadow: '0 10px 30px rgba(244, 63, 94, 0.2)', borderColor: 'rgba(244, 63, 94, 0.5)' }} className="glass-panel" style={{ flex: '1 1 300px', padding: '40px', borderRadius: '24px', borderTop: '4px solid #f43f5e', transition: 'all 0.3s ease' }}>
            <h3 style={{ fontSize: '1.8rem', color: '#f43f5e', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}><BookHeart size={24} /> Private Journal</h3>
            <p style={{ color: '#a1a1aa', lineHeight: '1.6' }}>Write without an audience. Entries are encrypted locally and hidden from the AI. Export safely for your therapist.</p>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', bounce: 0.4, duration: 1 } } }} whileHover={{ y: -10, boxShadow: '0 10px 30px rgba(45, 212, 191, 0.2)', borderColor: 'rgba(45, 212, 191, 0.5)' }} className="glass-panel" style={{ flex: '1 1 300px', padding: '40px', borderRadius: '24px', borderTop: '4px solid #2dd4bf', transition: 'all 0.3s ease' }}>
            <h3 style={{ fontSize: '1.8rem', color: '#2dd4bf', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}><Lock size={24} /> Local Vault</h3>
            <p style={{ color: '#a1a1aa', lineHeight: '1.6' }}>Built on a zero-knowledge architecture. Everything is dynamically AES-256 encrypted before it ever leaves your screen.</p>
          </motion.div>
        </motion.div>

        <motion.button initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.8, duration: 0.5 }} onClick={() => navigate('/login')} style={{ padding: '18px 40px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '40px', fontSize: '1.3rem', fontWeight: '600', cursor: 'pointer', boxShadow: '0 0 30px rgba(139, 92, 246, 0.5)', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
            Begin Your Journey
        </motion.button>
      </section>
    </div>
  )
};
export default LandingPage;