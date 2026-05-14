import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, ShieldAlert, Mic, MicOff, Ghost, Plus, MessageSquare, Edit2, Trash2, Volume2, VolumeX, Download, Camera, CameraOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as faceapi from 'face-api.js';
import { jsPDF } from "jspdf";

const ChatApp = ({ user }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Initialize from memory
  const [isIncognito, setIsIncognito] = useState(() => localStorage.getItem('sanctum_incognito') === 'true');
  const [isAutoRead, setIsAutoRead] = useState(() => localStorage.getItem('sanctum_voice') === 'true');

  // Save to memory when toggled
  const toggleVoice = () => {
    const newVal = !isAutoRead;
    setIsAutoRead(newVal);
    localStorage.setItem('sanctum_voice', newVal);
  };

  const toggleIncognito = () => {
    const newVal = !isIncognito;
    setIsIncognito(newVal);
    localStorage.setItem('sanctum_incognito', newVal);
  };

  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(() => localStorage.getItem('currentSessionId') || null);

  const [isVisionActive, setIsVisionActive] = useState(false);
  const [isVisionLoading, setIsVisionLoading] = useState(false);
  const [detectedEmotion, setDetectedEmotion] = useState('neutral');
  const videoRef = useRef(null);
  
  const playSoftPop = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext(); const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.setValueAtTime(400, ctx.currentTime); 
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1); 
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.02); 
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1); 
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  };

  const recognitionRef = useRef(null);
  const [availableVoices, setAvailableVoices] = useState([]);

  useEffect(() => {
    const loadVoices = () => setAvailableVoices(window.speechSynthesis.getVoices());
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const isGuest = user.id === 'guest';
  const messagesEndRef = useRef(null)
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  useEffect(scrollToBottom, [messages])

  useEffect(() => { if (currentSessionId && !isGuest) localStorage.setItem('currentSessionId', currentSessionId); }, [currentSessionId, isGuest]);

  useEffect(() => {
    if (isGuest) { setSessions([]); setCurrentSessionId('guest-session'); return; }
    const fetchSessions = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/sessions?userId=${user.id}`);
        if (response.data && response.data.length > 0) {
          setSessions(response.data); 
          const savedId = localStorage.getItem('currentSessionId');
          if (savedId && response.data.some(s => s.id === savedId)) setCurrentSessionId(savedId); 
          else setCurrentSessionId(response.data[0].id);
        } else { startNewChat(); }
      } catch (error) { startNewChat(); }
    };
    fetchSessions();
  }, [user.id, isGuest]);

  useEffect(() => {
    if (!currentSessionId) return;
    if (isGuest) {
      setMessages([{ sender: 'ai', text: "Welcome to Zero-Trace mode. I am Sanctum. No data from this session is being saved. How can I support you today?", timestamp: new Date().toISOString() }]);
      return;
    }
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/history/${currentSessionId}`);
        if (response.data && response.data.length > 0) setMessages(response.data);
        else setMessages([{ sender: 'ai', text: `Hello ${user.username}. I'm here to listen without judgment. How are you feeling right now?`, timestamp: new Date().toISOString() }]);
      } catch (error) { console.error("Could not load history", error); }
    };
    fetchHistory();
  }, [currentSessionId, user.username, isGuest]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; 
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev ? prev + " " + transcript : transcript);
        setIsListening(false); 
      };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  useEffect(() => {
    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (e) {}
    } else if (!isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  useEffect(() => {
    if (isAutoRead && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === 'ai') {
        window.speechSynthesis.cancel(); 
        const utterance = new SpeechSynthesisUtterance(lastMsg.text);
        if (availableVoices.length > 0) {
          const premiumVoice = availableVoices.find(v => 
            v.name.includes('Samantha') || v.name.includes('Google US English') || v.name.includes('Natural') || v.name.includes('Premium')
          );
          if (premiumVoice) { utterance.voice = premiumVoice; } 
          else {
            const englishVoice = availableVoices.find(v => v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Zira')));
            if (englishVoice) utterance.voice = englishVoice;
          }
        }
        utterance.rate = 0.85; utterance.pitch = 0.95; 
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [messages, isAutoRead, availableVoices]);

  useEffect(() => { if (!isAutoRead) window.speechSynthesis.cancel(); }, [isAutoRead]);

  const toggleVision = async () => {
    if (!isVisionActive) {
      setIsVisionLoading(true); setIsVisionActive(true); 
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models')
        ]);
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) { videoRef.current.srcObject = stream; }
      } catch (err) { 
        alert("Camera access denied or models failed to load. Ensure your /models folder is set up correctly.");
        setIsVisionActive(false); setIsVisionLoading(false);
      }
    } else {
      const stream = videoRef.current?.srcObject;
      if (stream) { stream.getTracks().forEach(track => track.stop()); }
      setIsVisionActive(false); setIsVisionLoading(false); setDetectedEmotion('neutral');
      clearInterval(window.emotionInterval);
    }
  };

  const handleVideoPlay = () => {
    setIsVisionLoading(false);
    window.emotionInterval = setInterval(async () => {
        if (videoRef.current && isVisionActive) {
            const detections = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
            if (detections) {
                const expressions = detections.expressions;
                const highestEmotion = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
                setDetectedEmotion(highestEmotion);
            }
        }
    }, 4000);
  };

  const startNewChat = () => {
    const newId = crypto.randomUUID(); 
    setCurrentSessionId(newId);
    const newSession = { id: newId, name: "New Space" };
    if (!sessions.find(s => s.id === newId)) setSessions(prev => [newSession, ...prev]);
  };

  const renameChat = async (id, oldName) => {
    const newName = window.prompt("Rename space:", oldName === "New Space" ? "" : oldName);
    if (!newName || newName.trim() === "" || newName === oldName) return;
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/sessions/${id}`, { name: newName });
      setSessions(sessions.map(s => s.id === id ? { ...s, name: newName } : s));
    } catch (error) {}
  };

  const deleteChat = async (id, e) => {
    e.stopPropagation(); 
    if (!window.confirm("Purge this conversation permanently?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/sessions/${id}`);
      const updatedSessions = sessions.filter(s => s.id !== id);
      setSessions(updatedSessions);
      if (currentSessionId === id) {
        if (updatedSessions.length > 0) setCurrentSessionId(updatedSessions[0].id);
        else startNewChat();
      }
    } catch (error) {}
  };

  const sendMessage = async (e) => {
    e?.preventDefault()
    if (!input.trim()) return
    playSoftPop();
    const userMsg = { sender: 'user', text: input, facialEmotion: (isVisionActive && !isVisionLoading) ? detectedEmotion : null, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    const sessionName = sessions.find(s => s.id === currentSessionId)?.name || "New Space";

    try {
      const response = await axios.post('${import.meta.env.VITE_API_URL}/api/chat', {
        message: userMsg.text,
        isIncognito: isGuest ? true : isIncognito,
        sessionId: currentSessionId,
        sessionName: sessionName,
        userId: user.id,
        facialEmotion: (isVisionActive && !isVisionLoading) ? detectedEmotion : "neutral"
      })
      const aiReplyText = response.data.reply;
      setMessages(prev => [...prev, { sender: 'ai', text: aiReplyText, isSafe: response.data.isSafe, timestamp: new Date().toISOString() }])
    } catch (error) { setMessages(prev => [...prev, { sender: 'ai', text: "Inference bridge timeout.", timestamp: new Date().toISOString() }]) } 
    finally { setIsLoading(false) }
  }

  const exportChat = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(139, 92, 246); 
    doc.text("Sanctum: Private Sanctuary Log", 14, y);
    y += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, y);
    y += 15;

    doc.setFontSize(12);
    messages.forEach((m) => {
      if (y > 270) { doc.addPage(); y = 20; }

      doc.setFont("helvetica", "bold");
      if (m.sender === 'user') {
        doc.setTextColor(139, 92, 246); 
        doc.text(`You [${formatTime(m.timestamp)}]`, 14, y);
      } else {
        doc.setTextColor(45, 212, 191); 
        doc.text(`Sanctum [${formatTime(m.timestamp)}]`, 14, y);
      }
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      const lines = doc.splitTextToSize(m.text, pageWidth - 28);
      doc.text(lines, 14, y);
      y += (lines.length * 6) + 10;
    });

    doc.save(`Sanctum_Session_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ height: 'calc(100vh - 90px)', display: 'flex', position: 'relative', zIndex: 10 }}>
      
      <div className="glass-panel" style={{ width: '280px', borderRight: '1px solid rgba(139, 92, 246, 0.1)', display: 'flex', flexDirection: 'column', padding: '20px', margin: '0 0 15px 15px', borderRadius: '24px 0 0 24px' }}>
        {isGuest ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#2dd4bf', border: '1px solid rgba(45, 212, 191, 0.3)', borderRadius: '16px', background: 'rgba(45, 212, 191, 0.05)' }}>
            <Ghost size={32} style={{ marginBottom: '10px' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Zero-Trace Active</h3>
            <p style={{ fontSize: '0.8rem', color: '#a1a1aa', marginTop: '10px' }}>Database writing is disabled. Everything here vanishes.</p>
          </div>
        ) : (
          <>
            <button onClick={startNewChat} style={{ width: '100%', padding: '14px', background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '600', marginBottom: '25px' }}>
              <Plus size={18} /> New Space
            </button>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Encrypted Spaces</div>
              {sessions.map((session) => (
                <div key={session.id} onClick={() => setCurrentSessionId(session.id)} style={{ padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: currentSessionId === session.id ? 'rgba(139, 92, 246, 0.15)' : 'transparent', border: currentSessionId === session.id ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent', color: currentSessionId === session.id ? '#fff' : '#a1a1aa' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    <MessageSquare size={16} style={{ flexShrink: 0, color: currentSessionId === session.id ? '#a78bfa' : '#71717a' }} />
                    <span style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', opacity: currentSessionId === session.id ? 1 : 0 }}>
                    <Edit2 size={14} onClick={(e) => { e.stopPropagation(); renameChat(session.id, session.name); }} style={{ cursor: 'pointer', color: '#a1a1aa' }} />
                    <Trash2 size={14} onClick={(e) => deleteChat(session.id, e)} style={{ cursor: 'pointer', color: '#ef4444' }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 15px 15px 0', position: 'relative' }}>
        
        <AnimatePresence>
          {isVisionActive && (
            <motion.div initial={{ opacity: 0, scale: 0.8, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.8, x: 20 }} style={{ position: 'absolute', top: '80px', right: '40px', width: '160px', height: '120px', borderRadius: '16px', overflow: 'hidden', border: '2px solid rgba(168, 85, 247, 0.4)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 20, background: '#000' }}>
              {isVisionLoading && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(20, 15, 35, 0.9)', color: '#a78bfa', zIndex: 2 }}>
                   <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Loader2 size={24} /></motion.div>
                   <span style={{ fontSize: '0.7rem', marginTop: '8px', fontWeight: '500' }}>Loading Models...</span>
                </div>
              )}
              <video ref={videoRef} autoPlay muted playsInline onPlay={handleVideoPlay} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', opacity: isVisionLoading ? 0 : 1 }} />
              {!isVisionLoading && (
                 <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', padding: '4px 10px', borderRadius: '10px', fontSize: '0.7rem', color: '#fff', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}>
                   {detectedEmotion.toUpperCase()}
                 </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ width: '100%', marginBottom: '15px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '0 10px' }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              
              {!isGuest && messages.length > 0 && (
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={exportChat} title="Export for Therapist" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(45, 212, 191, 0.2))', color: '#fff', border: '1px solid rgba(139, 92, 246, 0.4)', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '600', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.2)' }}>
                  <Download size={16} /> Export Session
                </motion.button>
              )}
              
              {/* FIX: Connected the onClick to toggleVoice! */}
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toggleVoice} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: isAutoRead ? '#fff' : '#a1a1aa', background: isAutoRead ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)', border: isAutoRead ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '12px', boxShadow: isAutoRead ? '0 0 15px rgba(16, 185, 129, 0.3)' : 'none', fontWeight: '600', fontSize: '0.85rem' }}>
                {isAutoRead ? <Volume2 size={16} color="#10b981" /> : <VolumeX size={16} />} 
                {isAutoRead ? 'Voice ON' : 'Voice OFF'}
              </motion.button>
              
              {/* FIX: Connected the onClick to toggleIncognito! */}
              {!isGuest && (
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toggleIncognito} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: isIncognito ? '#fff' : '#a1a1aa', background: isIncognito ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '12px', border: isIncognito ? '1px solid rgba(244, 63, 94, 0.5)' : '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s', boxShadow: isIncognito ? '0 0 15px rgba(244, 63, 94, 0.3)' : 'none', fontWeight: '600', fontSize: '0.85rem' }}>
                  <Ghost size={16} color={isIncognito ? "#f43f5e" : "#a1a1aa"} />
                  {isIncognito ? 'Incognito ON' : 'Incognito OFF'}
                </motion.button>
              )}
            </div>
        </div>

        <div className="glass-panel" style={{ flex: 1, borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', marginBottom: '20px' }}>
                  <div style={{ maxWidth: '75%', padding: '14px 20px', borderRadius: '20px', borderBottomRightRadius: msg.sender === 'user' ? '4px' : '20px', borderBottomLeftRadius: msg.sender === 'ai' ? '4px' : '20px', background: msg.sender === 'user' ? '#8b5cf6' : 'rgba(255,255,255,0.03)', color: '#fff', border: msg.isSafe === false ? '1px solid #ef4444' : (msg.sender === 'ai' ? '1px solid rgba(255,255,255,0.05)' : 'none'), boxShadow: msg.sender === 'user' ? '0 4px 15px rgba(139, 92, 246, 0.2)' : 'none', fontSize: '0.95rem', lineHeight: '1.6' }}>
                    
                    {msg.sender === 'user' && msg.facialEmotion && msg.facialEmotion !== 'neutral' && (
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: '4px', fontStyle: 'italic' }}>*Visually expressing {msg.facialEmotion}*</div>
                    )}
                    {msg.isSafe === false && <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ef4444', marginBottom: '8px', fontWeight: '600', fontSize: '0.85rem' }}><ShieldAlert size={16} /> Crisis Intercepted</div>}
                    {msg.text.split('\n').map((line, i) => <p key={i} style={{ margin: 0, minHeight: line === '' ? '1rem' : 'auto' }}>{line}</p>)}
                    
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textAlign: msg.sender === 'user' ? 'right' : 'left', marginTop: '6px', display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#8b5cf6', fontSize: '0.9rem', fontStyle: 'italic', paddingLeft: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '6px', height: '6px', background: '#8b5cf6', borderRadius: '50%', animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}></div>
                Synthesizing...
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} style={{ padding: '20px 30px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '15px', alignItems: 'center' }}>
            <button type="button" onClick={toggleVision} title="Toggle Facial Emotion Recognition" style={{ background: isVisionActive ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.05)', color: isVisionActive ? '#d8b4fe' : '#a1a1aa', border: isVisionActive ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(255,255,255,0.1)', padding: '14px', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.2s' }}>
              {isVisionLoading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Loader2 size={20} /></motion.div> : isVisionActive ? <Camera size={20} /> : <CameraOff size={20} />}
            </button>
            <button type="button" onClick={() => setIsListening(!isListening)} style={{ background: isListening ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)', color: isListening ? '#f43f5e' : '#a1a1aa', border: isListening ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.1)', padding: '14px', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.2s' }}>
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <input className="glass-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder={isListening ? "Listening to prosody..." : "What's on your mind?"} style={{ flex: 1, padding: '16px 20px', borderRadius: '20px', fontSize: '1rem' }} />
            <button type="submit" disabled={isLoading || !input.trim()} style={{ background: (isLoading || !input.trim()) ? 'rgba(139, 92, 246, 0.2)' : '#8b5cf6', color: (isLoading || !input.trim()) ? '#a78bfa' : 'white', border: 'none', padding: '14px 20px', borderRadius: '20px', cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: (isLoading || !input.trim()) ? 'none' : '0 4px 15px rgba(139, 92, 246, 0.3)' }}>
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
};
export default ChatApp;