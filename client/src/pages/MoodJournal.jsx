import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { jsPDF } from "jspdf";

const MoodJournal = ({ user }) => {
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user.id === 'guest') return;
    axios.get(`${import.meta.env.VITE_API_URL}/api/journal/${user.id}`)
      .then(res => setEntries(res.data))
      .catch(err => console.error("Failed to load journal"));
  }, [user.id]);

  const handleSave = async () => {
    if (!newEntry.trim() || user.id === 'guest') return;
    setIsSaving(true);
    try {
      const res = await axios.post('${import.meta.env.VITE_API_URL}/api/journal', { userId: user.id, text: newEntry });
      setEntries([res.data.entry, ...entries]);
      setNewEntry('');
    } catch (err) { alert("Failed to encrypt and save entry."); }
    finally { setIsSaving(false); }
  };

  // NEW: Premium Export Function
  const exportJournal = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Title Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(244, 63, 94); // Journal Rose color
    doc.text("Sanctum: Private Journal", 14, y);
    y += 15;

    // Entry Loop
    doc.setFontSize(12);
    entries.forEach((entry) => {
      if (y > 270) { doc.addPage(); y = 20; }

      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text(`Date: ${new Date(entry.timestamp).toLocaleString()}`, 14, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      const lines = doc.splitTextToSize(entry.text, pageWidth - 28);
      doc.text(lines, 14, y);
      y += (lines.length * 6) + 15;
    });

    doc.save(`Sanctum_Journal_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (user.id === 'guest') return <div style={{ color: '#fff', textAlign: 'center', marginTop: '100px' }}><h2>Guest Mode Active</h2><p>Journaling is disabled in Zero-Trace mode to prevent data storage.</p></div>;

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto', color: '#fff', zIndex: 10, position: 'relative' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px', color: '#f43f5e' }}>Private Journal</h1>
          <p style={{ color: '#a1a1aa', margin: 0 }}>Write without an audience. These entries are hidden from the AI.</p>
        </div>
        {entries.length > 0 && (
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={exportJournal} style={{ background: 'transparent', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.4)', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
            <Download size={18} /> Export Journal
          </motion.button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '20px', borderRadius: '24px', marginBottom: '40px' }}>
        <textarea 
          className="glass-input" 
          value={newEntry} 
          onChange={e => setNewEntry(e.target.value)} 
          placeholder="What's weighing on your mind today?"
          style={{ width: '100%', height: '150px', padding: '16px', borderRadius: '16px', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '1rem' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
          <button onClick={handleSave} disabled={isSaving || !newEntry.trim()} style={{ background: '#f43f5e', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '20px', cursor: 'pointer', fontWeight: '600' }}>
            {isSaving ? "Encrypting..." : "Lock & Save"}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {entries.map(entry => (
          <div key={entry.id} className="glass-panel" style={{ padding: '20px', borderRadius: '16px', borderLeft: '4px solid #f43f5e' }}>
            <div style={{ fontSize: '0.8rem', color: '#71717a', marginBottom: '10px' }}>{new Date(entry.timestamp).toLocaleString()}</div>
            <div style={{ color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{entry.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default MoodJournal;