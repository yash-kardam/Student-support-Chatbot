import { useState, useRef } from 'react';
import { Sparkles, ArrowRight, BookOpen, CheckSquare, X, ChevronDown } from 'lucide-react';
import './FloatingInput.css';

export default function FloatingInput({ onSubmit, resources = [], tasks = [] }) {
  const [text, setText] = useState('');
  const [attachedContext, setAttachedContext] = useState(null); // { type, label, content }
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text, attachedContext);
    setText('');
    setAttachedContext(null);
    setShowPicker(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') setShowPicker(false);
  };

  const attachResource = (r) => {
    setAttachedContext({
      type: 'resource',
      label: r.name,
      content: `Resource: "${r.name}"\n${r.content || ''}`,
    });
    setShowPicker(false);
  };

  const attachTasks = () => {
    const taskList = tasks
      .map(t => `- [${t.status}] ${t.title} (Priority: ${t.priority})`)
      .join('\n');
    setAttachedContext({
      type: 'tasks',
      label: 'My Action Plan',
      content: `My current action plan / tasks:\n${taskList}`,
    });
    setShowPicker(false);
  };

  const hasItems = resources.length > 0 || tasks.length > 0;

  return (
    <div className="floating-input-container">
      {/* Context Attachment Picker */}
      {showPicker && (
        <div className="context-picker" ref={pickerRef}>
          <div className="context-picker-header">Add context from your workspace</div>

          {tasks.length > 0 && (
            <button className="context-picker-item" onClick={attachTasks}>
              <CheckSquare size={15} className="ctx-icon tasks-icon" />
              <div className="ctx-item-info">
                <span className="ctx-item-label">My Action Plan</span>
                <span className="ctx-item-sub">{tasks.length} tasks</span>
              </div>
            </button>
          )}

          {resources.length > 0 && (
            <>
              <div className="context-picker-section">Resources</div>
              {resources.map((r, i) => (
                <button key={i} className="context-picker-item" onClick={() => attachResource(r)}>
                  <BookOpen size={15} className="ctx-icon resource-icon" />
                  <div className="ctx-item-info">
                    <span className="ctx-item-label">{r.name}</span>
                    <span className="ctx-item-sub">{r.type}</span>
                  </div>
                </button>
              ))}
            </>
          )}

          {!hasItems && (
            <div className="ctx-empty">No saved resources or tasks yet.</div>
          )}
        </div>
      )}

      <div className="floating-input-wrapper">
        {/* Attached context pill */}
        {attachedContext && (
          <div className="attached-ctx-pill">
            {attachedContext.type === 'tasks'
              ? <CheckSquare size={12} />
              : <BookOpen size={12} />}
            <span>{attachedContext.label}</span>
            <button
              className="ctx-remove"
              onClick={() => setAttachedContext(null)}
              aria-label="Remove context"
            >
              <X size={11} />
            </button>
          </div>
        )}

        <div className="spark-icon-wrapper">
          <Sparkles size={18} className="spark-icon" />
        </div>

        <input
          type="text"
          placeholder="Ask anything about ABES or talk to your support bot…"
          className="stratify-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {/* Context attach button */}
        <button
          className={`ctx-attach-btn ${showPicker ? 'ctx-attach-active' : ''}`}
          onClick={() => setShowPicker(p => !p)}
          title="Attach context (resources / action plan)"
          aria-label="Attach context"
        >
          <ChevronDown size={15} />
        </button>

        <button className="submit-arrow-btn" onClick={handleSubmit}>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
