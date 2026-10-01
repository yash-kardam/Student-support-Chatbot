import { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import InputArea from './InputArea';
import './ChatArea.css';

const INITIAL_MESSAGES = [
  {
    id: 1,
    sender: 'bot',
    text: "Hi there, how can I help you today?",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    suggestedReplies: ["I'm feeling stressed", "Need study tips", "Just checking in"]
  }
];

export default function ChatArea() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (text) => {
    const newUserMsg = {
      id: Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages((prev) => [...prev, newUserMsg]);
    setIsTyping(true);

    // Mock bot response
    setTimeout(() => {
      setIsTyping(false);
      
      let botResponse = {
        id: Date.now() + 1,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      if (text.toLowerCase().includes('stress')) {
        botResponse.type = 'mood';
      } else {
        botResponse.text = "I hear you. That sounds completely valid. Tell me a bit more about what's going on.";
      }

      setMessages((prev) => [...prev, botResponse]);
    }, 1500);
  };

  return (
    <div className="chat-area">
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-illustration">
              <span className="sparkle">✨</span>
            </div>
            <h2>Welcome to SupportBot</h2>
            <p>Your safe space to talk about stress, studies, and everything in between.</p>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isTyping && (
              <MessageBubble message={{ id: 'typing', sender: 'bot', isTyping: true }} />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <InputArea onSendMessage={handleSendMessage} />
    </div>
  );
}
