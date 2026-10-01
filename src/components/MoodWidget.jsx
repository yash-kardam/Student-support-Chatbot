import { useState } from 'react';
import './MoodWidget.css';

const MOODS = [
  { emoji: '😊', label: 'Great' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '😞', label: 'Down' },
  { emoji: '😢', label: 'Overwhelmed' },
];

export default function MoodWidget({ onSelect }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (mood) => {
    setSelected(mood.label);
    if (onSelect) onSelect(mood.label);
  };

  return (
    <div className="mood-widget">
      <p className="mood-prompt">How are you feeling right now?</p>
      <div className="mood-options">
        {MOODS.map((mood) => (
          <button
            key={mood.label}
            className={`mood-btn ${selected === mood.label ? 'selected' : ''}`}
            onClick={() => handleSelect(mood)}
            title={mood.label}
          >
            <span className="mood-emoji">{mood.emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
