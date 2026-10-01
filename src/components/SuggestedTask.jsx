import { Sparkles } from 'lucide-react';
import './SuggestedTask.css';

export default function SuggestedTask({ icon: Icon, title, description, onClick }) {
  return (
    <div className="card suggested-task-card" onClick={onClick}>
      <div className="task-header">
        <Sparkles size={16} className="task-sparkle" />
        <span className="task-label">Suggested Action</span>
      </div>
      <div className="task-content">
        {Icon && <Icon size={24} className="task-icon" />}
        <h3 className="task-title">{title}</h3>
      </div>
      {description && <p className="task-desc">{description}</p>}
    </div>
  );
}
