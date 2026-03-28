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
      className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[100] mix-blend-screen flex items-center justify-center"
      animate={{
        x: mousePos.x - 16,
        y: mousePos.y - 16,
        scale: isHovering ? 2 : 1,
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 28, mass: 0.5 }}
    >
      <div className={`w-full h-full rounded-full border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all ${isHovering ? 'bg-cyan-500/20' : 'bg-transparent'}`} />
      <div className="absolute w-1 h-1 bg-cyan-300 rounded-full" />
    </motion.div>
  );
};

export const AmbientBackground = ({ isTestActive }) => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#030712]">
    <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
    
    {!isTestActive && (
      <>
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-cyan-900/40 blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[40%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-violet-900/40 blur-[100px]" 
        />
      </>
    )}
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]" />
  </div>
);

export const GlassContainer = ({ children, className = "", isTestActive = false }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.95 }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    className={`${isTestActive ? 'bg-black/60' : 'bg-white/[0.02] backdrop-blur-2xl'} border border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] ${className}`}
  >
    {children}
  </motion.div>
);
