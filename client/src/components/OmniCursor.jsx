import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

// We kept the name "OmniCursor" so you don't have to change your file names,
// but it is now permanently locked to the sleek "Cosmic Aura" style!
export const OmniCursor = () => {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const moveCursor = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);

      // Check if hovering over anything clickable
      const target = e.target;
      if (target.closest('button') || target.closest('a') || target.closest('input')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };
    
    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, [cursorX, cursorY]);

  return (
    <>
      {/* OUTER RING (Trails behind with Spring Physics) */}
      <motion.div 
        style={{ 
          x: cursorXSpring, 
          y: cursorYSpring, 
          translateX: '-50%', 
          translateY: '-50%', 
          position: 'fixed', 
          left: 0, 
          top: 0, 
          width: '36px', 
          height: '36px', 
          border: `2px solid ${isHovering ? '#2dd4bf' : 'rgba(139, 92, 246, 0.5)'}`, 
          backgroundColor: isHovering ? 'rgba(45, 212, 191, 0.1)' : 'transparent', 
          borderRadius: '50%', 
          pointerEvents: 'none', 
          zIndex: 9998 
        }} 
        animate={{ scale: isHovering ? 1.5 : 1 }} 
        transition={{ duration: 0.2 }} 
      />
      
      {/* INNER DOT (Instantly follows the mouse) */}
      <motion.div 
        style={{ 
          x: cursorX, 
          y: cursorY, 
          translateX: '-50%', 
          translateY: '-50%', 
          position: 'fixed', 
          left: 0, 
          top: 0, 
          width: '8px', 
          height: '8px', 
          backgroundColor: isHovering ? '#2dd4bf' : '#8b5cf6', 
          borderRadius: '50%', 
          pointerEvents: 'none', 
          zIndex: 9999, 
          boxShadow: `0 0 10px ${isHovering ? '#2dd4bf' : '#8b5cf6'}` 
        }} 
      />
    </>
  );
};