import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const CustomCursor = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    const handleMouseOver = (e) => {
      if (e.target.tagName.toLowerCase() === 'button' || e.target.closest('button')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[100] mix-blend-multiply flex items-center justify-center hidden md:flex"
      animate={{
        x: mousePos.x - 16,
        y: mousePos.y - 16,
        scale: isHovering ? 1.4 : 1,
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 28, mass: 0.5 }}
    >
      <div className={`w-full h-full rounded-full border border-teal-600/30 transition-all ${isHovering ? 'bg-teal-600/10' : 'bg-transparent'}`} />
      <div className="absolute w-1.5 h-1.5 bg-teal-700 rounded-full" />
    </motion.div>
  );
};

export const AmbientBackground = ({ isTestActive }) => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#FDFBF7]">
    <div className="absolute inset-0 opacity-[0.25] mix-blend-soft-light" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
    
    {!isTestActive && (
      <>
        <motion.div 
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[5%] -left-[5%] w-[65vw] h-[65vw] rounded-full bg-amber-50/60 blur-[130px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[25%] -right-[5%] w-[55vw] h-[55vw] rounded-full bg-teal-50/50 blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute -bottom-[5%] left-[15%] w-[45vw] h-[45vw] rounded-full bg-blue-50/40 blur-[130px]" 
        />
      </>
    )}
    <div className="absolute inset-0 bg-[linear-gradient(rgba(203,213,225,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(203,213,225,0.06)_1px,transparent_1px)] bg-[size:50px_50px]" />
  </div>
);

export const GlassContainer = ({ children, className = "", isTestActive = false }) => (
  <motion.div 
    initial={{ opacity: 0, y: 15, scale: 0.99 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -15, scale: 0.99 }}
    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    className={`bg-white/85 backdrop-blur-2xl border border-[#F1E9DB] rounded-[2.5rem] shadow-medical-xl ${className}`}
  >
    {children}
  </motion.div>
);
