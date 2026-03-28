import React, { useState, useEffect, useCallback } from 'react';
import { motion, useSpring, useMotionValue } from 'motion/react';

interface AnimatedCursorProps {
  enabled: boolean;
}

export default function AnimatedCursor({ enabled }: AnimatedCursorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 250 };
  const ringX = useSpring(cursorX, springConfig);
  const ringY = useSpring(cursorY, springConfig);

  const onMouseMove = useCallback((e: MouseEvent) => {
    cursorX.set(e.clientX);
    cursorY.set(e.clientY);
    setIsVisible(true);
  }, [cursorX, cursorY]);

  const onMouseLeave = useCallback(() => {
    setIsVisible(false);
  }, []);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouch();

    if (enabled && !isTouchDevice) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseleave', onMouseLeave);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [enabled, isTouchDevice, onMouseMove, onMouseLeave]);

  if (!enabled || isTouchDevice) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {/* Dot */}
      <motion.div
        className="fixed w-2 h-2 bg-emerald-600 rounded-full"
        style={{
          left: 0,
          top: 0,
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
          opacity: isVisible ? 1 : 0,
        }}
      />
      {/* Trailing Ring */}
      <motion.div
        className="fixed w-8 h-8 border-2 border-emerald-600/30 rounded-full"
        style={{
          left: 0,
          top: 0,
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
          opacity: isVisible ? 1 : 0,
        }}
      />
    </div>
  );
}
