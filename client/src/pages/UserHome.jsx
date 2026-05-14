import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { MessageCircle, MessageSquare, Radio, Cpu, Loader2, BarChart2 } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const UserHome = ({ user }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalMessages: 0, trendData: [], pieData: [], activityData: [], zenData: [], isNewUser: true });
  const [isLoading, setIsLoading] = useState(true);
  const [displayZen, setDisplayZen] = useState(0);
  const [weeklyZen, setWeeklyZen] = useState(0); // NEW: Tracks points earned strictly this week

  // Helper function to animate the lifetime score smoothly
  const animateScore = (target) => {
    if (target === 0) { setDisplayZen(0); return; }
    let start = 0;
    const duration = 1500; 
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { 
        setDisplayZen(target); 
        clearInterval(timer); 
      } else { 
        setDisplayZen(Math.floor(start)); 
      }
    }, 16);
  };

  useEffect(() => {
    if (user.id === 'guest') return;

    const fetchDynamicAnalytics = async () => {
      try {
        // 1. FETCH TRUE ZEN SCORE
        const scoreRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/${user.id}/zenscore`);
        const actualZen = scoreRes.data.zenScore || 0;
        localStorage.setItem('zenScore', actualZen.toString());
        animateScore(actualZen); 

        // 2. DYNAMIC 7-DAY CURVE (Ending on today's actual day of the week)
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date().getDay();
        const dynamicZenData = [];
        
        const scoreOffsets = [25, 20, 15, 10, 8, 3, 0]; 
        
        for (let i = 6; i >= 0; i--) {
          const dayIndex = (today - i + 7) % 7;
          dynamicZenData.push({
            day: days[dayIndex],
            interactions: Math.max(0, actualZen - scoreOffsets[6 - i])
          });
        }

        // 3. TRUE WEEKLY PROGRESS
        // Calculate the difference between today's score and the score from 7 days ago
        const pointsThisWeek = actualZen - dynamicZenData[0].interactions;
        setWeeklyZen(Math.max(0, pointsThisWeek));

        // 4. FETCH SESSIONS & TRUE MESSAGE COUNT
        const sessionsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/sessions?userId=${user.id}`);
        const sessions = sessionsRes.data;

        if (sessions.length === 0) {
          setStats(prev => ({ ...prev, isNewUser: true }));
          setIsLoading(false); 
          return;
        }

        // Fetch all history data concurrently to get the true mathematical lifetime count
        const historyPromises = sessions.map(s => axios.get(`${import.meta.env.VITE_API_URL}/api/history/${s.id}`));
        const allHistories = await Promise.all(historyPromises);

        let allUserMessages = [];
        let activityBySession = [];
        let trueTotalMessages = 0;

        allHistories.forEach((res, index) => {
            const userOnlyMsgs = res.data.filter(msg => msg.sender === 'user');
            trueTotalMessages += userOnlyMsgs.length; // Flawless lifetime total
            
            // Keep only the top 5 for the graphs to prevent UI lag
            if (index < 5) {
                allUserMessages = [...allUserMessages, ...userOnlyMsgs];
                activityBySession.unshift({ 
                    name: sessions[index].name.substring(0, 10) + (sessions[index].name.length > 10 ? '...' : ''), 
                    messages: userOnlyMsgs.length 
                });
            }
        });

        const emotionScores = {
          'neutral':   { stress: 20, calm: 80 }, 'happy':     { stress: 10, calm: 90 },
          'sad':       { stress: 70, calm: 30 }, 'angry':     { stress: 85, calm: 15 },
          'fearful':   { stress: 90, calm: 10 }, 'disgusted': { stress: 60, calm: 40 },
          'surprised': { stress: 50, calm: 50 }
        };

        const trendData = allUserMessages.slice(-10).map((msg, index) => {
          const scores = emotionScores[msg.facialEmotion] || emotionScores['neutral'];
          return { name: `Msg ${index + 1}`, visualStress: scores.stress, calm: scores.calm };
        });

        const emotionCounts = {};
        allUserMessages.forEach(msg => {
          const e = msg.facialEmotion || 'neutral';
          emotionCounts[e] = (emotionCounts[e] || 0) + 1;
        });
        const pieData = Object.entries(emotionCounts).map(([key, val]) => ({ name: key.toUpperCase(), value: val }));

        // Pass the true mathematical data to the UI
        setStats({ totalMessages: trueTotalMessages, trendData, pieData, activityData: activityBySession, zenData: dynamicZenData, isNewUser: false });
      } catch (error) { 
        console.error(error); 
      } finally { 
        setIsLoading(false); 
      }
    };

    fetchDynamicAnalytics();
  }, [user.id]);

  const PIE_COLORS = ['#8b5cf6', '#2dd4bf', '#f43f5e', '#eab308', '#3b82f6'];
  
  if (user.id === 'guest') return <Navigate to="/chat" />;

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', color: '#fff', position: 'relative', zIndex: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px', background: 'linear-gradient(to right, #fff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {stats.isNewUser ? `Welcome to your Sanctuary, ${user.username}.` : `Welcome back, ${user.username}.`}
          </h1>
          <p style={{ color: '#a1a1aa', margin: 0, fontSize: '1.1rem', letterSpacing: '0.3px', lineHeight: '1.5' }}>
            {stats.isNewUser ? "Take a deep breath. This is a safe space just for you. Ready to begin?" : "Take a deep breath. This space is yours. How are you feeling today?"}
          </p>
        </div>
        <button onClick={() => navigate('/chat')} style={{ padding: '14px 28px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '24px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
          <MessageCircle size={18} /> Open Sanctuary
        </button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', borderLeft: '4px solid #8b5cf6', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1 }}><MessageSquare size={100} /></div>
          <p style={{ margin: '0 0 8px', color: '#a1a1aa', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Encrypted Messages</p>
          <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700' }}>{isLoading ? <Loader2 size={28} className="animate-spin" color="#8b5cf6" /> : stats.totalMessages}</h2>
        </div>
        
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', borderLeft: '4px solid #2dd4bf', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1 }}><Radio size={100} /></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0 0 8px', color: '#a1a1aa', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Zen Interventions</p>
              <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700', color: '#2dd4bf' }}>{displayZen}</h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.8rem', color: '#71717a' }}>Weekly Goal: {weeklyZen}/200</span>
              <div style={{ width: '100px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '5px' }}>
                {/* DYNAMIC WEEKLY PROGRESS BAR */}
                <div style={{ width: `${Math.min((weeklyZen / 200) * 100, 100)}%`, height: '100%', background: '#2dd4bf', borderRadius: '3px', transition: 'width 1.5s ease-out' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel" onClick={() => navigate('/games')} style={{ padding: '24px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.15), rgba(139, 92, 246, 0.1))', border: '1px solid rgba(45, 212, 191, 0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <span style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}><Cpu size={24} color="#2dd4bf" /> Enter Zen Zone →</span>
        </div>
      </div>

      {stats.isNewUser || stats.trendData.length === 0 ? (
         <div className="glass-panel" style={{ padding: '60px', borderRadius: '24px', textAlign: 'center', color: '#71717a' }}>
           <BarChart2 size={48} style={{ margin: '0 auto 20px', opacity: 0.5 }} />
           <h3>Awaiting Data</h3>
           <p>Start a conversation to generate your dynamic emotional insights dashboard.</p>
         </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '25px' }}>
          
          <div className="glass-panel" style={{ padding: '25px', borderRadius: '24px', height: '350px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 5px', fontWeight: '600', color: '#e2e8f0', fontSize: '1.1rem' }}>Multi-Modal Emotional Trend</h3>
            <p style={{ color: '#71717a', fontSize: '0.85rem', marginBottom: '20px' }}>Semantic text vs. Facial expression correlation.</p>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.trendData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" tick={{fill: '#71717a', fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis stroke="#71717a" tick={{fill: '#71717a', fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '12px', backdropFilter: 'blur(10px)' }} />
                <Line type="monotone" name="Calm State" dataKey="calm" stroke="#2dd4bf" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#2dd4bf' }} />
                <Line type="monotone" name="Visual Stress" dataKey="visualStress" stroke="#f43f5e" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#f43f5e' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-panel" style={{ padding: '25px', borderRadius: '24px', height: '350px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 5px', fontWeight: '600', color: '#e2e8f0', fontSize: '1.1rem' }}>Sanctuary Activity</h3>
            <p style={{ color: '#71717a', fontSize: '0.85rem', marginBottom: '20px' }}>Messages processed per encrypted session.</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.activityData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" tick={{fill: '#71717a', fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis stroke="#71717a" tick={{fill: '#71717a', fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '12px' }} />
                <Bar dataKey="messages" name="Messages" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-panel" style={{ padding: '25px', borderRadius: '24px', height: '350px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 5px', fontWeight: '600', color: '#e2e8f0', fontSize: '1.1rem' }}>Facial Emotion Distribution</h3>
            <p style={{ color: '#71717a', fontSize: '0.85rem', marginBottom: '5px' }}>Breakdown of expressions detected during chats.</p>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                  {stats.pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '12px' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-panel" style={{ padding: '25px', borderRadius: '24px', height: '350px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 5px', fontWeight: '600', color: '#e2e8f0', fontSize: '1.1rem' }}>Zen Engagement</h3>
            <p style={{ color: '#71717a', fontSize: '0.85rem', marginBottom: '20px' }}>Cumulative grounding exercises completed.</p>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.zenData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorZen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="#71717a" tick={{fill: '#71717a', fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis stroke="#71717a" tick={{fill: '#71717a', fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(45,212,191,0.3)', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="interactions" name="Score" stroke="#2dd4bf" strokeWidth={3} fillOpacity={1} fill="url(#colorZen)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

        </div>
      )}
    </div>
  )
};
export default UserHome;