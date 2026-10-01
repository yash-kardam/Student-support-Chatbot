import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import './InputArea.css';

export default function InputArea({ onSendMessage }) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="input-area-wrapper">
      <form className="input-form glass-panel" onSubmit={handleSubmit}>
        <button type="button" className="icon-btn attachment-btn" aria-label="Attach file">
          <Paperclip size={20} />
        </button>
        
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="message-input"
          rows={1}
        />
        
        <button type="button" className="icon-btn emoji-btn" aria-label="Add emoji">
          <Smile size={20} />
        </button>
        
        <button 
          type="submit" 
          className={`send-btn ${message.trim() ? 'active' : ''}`}
          aria-label="Send message"
          disabled={!message.trim()}
        >
          <Send size={18} className="send-icon" />
        </button>
      </form>
    </div>
  );
}
