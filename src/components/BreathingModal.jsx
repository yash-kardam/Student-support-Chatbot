import { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw } from 'lucide-react';
import './BreathingModal.css';

export default function BreathingModal({ onClose }) {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [phase, setPhase] = useState('Inhale'); // Inhale, Hold, Exhale

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          const cycleTime = next % 12;
          
          if (cycleTime >= 0 && cycleTime < 4) {
            setPhase('Inhale');
          } else if (cycleTime >= 4 && cycleTime < 8) {
            setPhase('Hold');
          } else {
            setPhase('Exhale');
          }
          return next;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const handleReset = () => {
    setSeconds(0);
    setPhase('Inhale');
    setIsActive(true);
  };

  const getCircleClass = () => {
    if (phase === 'Inhale') return 'inhale';
    if (phase === 'Hold') return 'hold';
    return 'exhale';
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="modal-overlay">
      <div className="card breathing-modal-card glass-panel">
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="breathing-content">
          <div className="breathing-header">
            <h2>Calm Space</h2>
            <p>Follow the expanding circle to sync your breathing and release stress.</p>
          </div>

          <div className="breathing-circle-container">
            <div className={`breathing-circle-outer`}>
              <div className={`breathing-circle-inner ${getCircleClass()}`}>
                <span className="phase-text">{phase}</span>
              </div>
            </div>
          </div>

          <div className="breathing-stats">
            <span className="timer-text">{formatTime(seconds)}</span>
          </div>

          <div className="breathing-controls">
            <button className="control-btn" onClick={() => setIsActive(!isActive)}>
              {isActive ? <Pause size={18} /> : <Play size={18} />}
              {isActive ? 'Pause' : 'Start'}
            </button>
            
            <button className="control-btn secondary" onClick={handleReset}>
              <RotateCcw size={18} />
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
