import React, { ReactNode, useState, useEffect, useRef } from 'react';

interface MotionWrapperProps {
  children: ReactNode;
  state: string; // Mapirano na kernel state (e.g., 'LOADING' → 'changing')
  className?: string;
  disableRipple?: boolean;
}

export const MotionWrapper: React.FC<MotionWrapperProps> = ({ children, state, className, disableRipple }) => {
  const [motionState, setMotionState] = useState('entering');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMotionState('entering'); // Reset na ulaz
    const timer = setTimeout(() => setMotionState(state), 300); // Pauza prije chaininga
    return () => clearTimeout(timer);
  }, [state]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (disableRipple || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    containerRef.current.style.setProperty('--ripple-x', `${x}%`);
    containerRef.current.style.setProperty('--ripple-y', `${y}%`);
  };

  return (
    <div 
      ref={containerRef}
      data-state={motionState} 
      className={`${className || ''} ${!disableRipple ? 'living-card' : ''}`}
      onMouseMove={handleMouseMove}
    >
      {children}
    </div>
  );
};
