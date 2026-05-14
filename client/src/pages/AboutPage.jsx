import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Cpu, Fingerprint } from 'lucide-react';

const AboutPage = () => {
  return (
    <div style={{ minHeight: 'calc(100vh - 65px)', padding: '60px 20px', color: '#fff', maxWidth: '1000px', margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '10px' }}>The Architecture of Empathy</h1>
        <p style={{ color: '#a1a1aa', fontSize: '1.2rem', marginBottom: '50px', maxWidth: '700px' }}>
          We engineered Sanctum from the ground up to solve the privacy paradox of modern AI. Here is how your data is protected.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          <div className="glass-panel" style={{ padding: '30px', borderRadius: '24px' }}>
            <Lock size={32} color="#8b5cf6" style={{ marginBottom: '20px' }} />
            <h3 style={{ fontSize: '1.3rem', marginBottom: '15px' }}>Zero-Knowledge Cryptography</h3>
            <p style={{ color: '#a1a1aa', lineHeight: '1.6' }}>Every message is encrypted dynamically using AES-256-CBC with a uniquely generated 16-byte Initialization Vector. No plaintext is ever written to our databases.</p>
          </div>
          <div className="glass-panel" style={{ padding: '30px', borderRadius: '24px' }}>
            <Cpu size={32} color="#f43f5e" style={{ marginBottom: '20px' }} />
            <h3 style={{ fontSize: '1.3rem', marginBottom: '15px' }}>The Guardian Protocol</h3>
            <p style={{ color: '#a1a1aa', lineHeight: '1.6' }}>A deterministic safety middleware that actively monitors for acute crisis keywords. If triggered, it intercepts the AI and instantly provides verified emergency helplines.</p>
          </div>
          <div className="glass-panel" style={{ padding: '30px', borderRadius: '24px' }}>
            <Fingerprint size={32} color="#2dd4bf" style={{ marginBottom: '20px' }} />
            <h3 style={{ fontSize: '1.3rem', marginBottom: '15px' }}>Zero-Trace Guest Mode</h3>
            <p style={{ color: '#a1a1aa', lineHeight: '1.6' }}>Bypass authentication entirely. In Guest Mode, state-routing actively blocks database write-operations. Your interactions exist only in volatile RAM.</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
};
export default AboutPage;