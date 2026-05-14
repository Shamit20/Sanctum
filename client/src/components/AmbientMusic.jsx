import React, { useState, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const AmbientMusic = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.volume = 0.4; 
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.error("Audio playback failed:", err);
          alert("Make sure you click anywhere on the page first before playing audio!");
        });
    }
  };

  return (
    <>
      <audio ref={audioRef} loop>
        <source src="/Ark Patrol - Let Go  instrumental.mp3" type="audio/mpeg" />
      </audio>

      <button
        onClick={toggleMusic}
        style={{
          position: 'fixed', bottom: '30px', left: '110px',
          background: isPlaying ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${isPlaying ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`,
          color: isPlaying ? '#a78bfa' : '#a1a1aa',
          width: '55px', height: '55px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 90, backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          boxShadow: isPlaying ? '0 0 30px rgba(139, 92, 246, 0.5)' : 'none'
        }}
        title={isPlaying ? "Silence Sanctuary" : "Play Ambient Choir"}
      >
        {isPlaying ? <Volume2 size={24} /> : <VolumeX size={24} />}
      </button>
    </>
  );
};
export default AmbientMusic;