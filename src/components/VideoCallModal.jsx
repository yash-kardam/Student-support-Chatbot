import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, PhoneOff, MessageSquare, Sparkles } from 'lucide-react';
import Groq from 'groq-sdk';
import './VideoCallModal.css';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

const VOICE_SYSTEM_PROMPT = `You are a voice assistant for a student support dashboard. 
A student is talking to you via real-time voice chat. 
Respond in extremely short, comforting, conversational, and simple sentences (1-3 sentences maximum). 
Never write long bulleted lists, markdown tables, or extensive text, as your responses will be read out loud. 
Keep your tone warm, reassuring, and empathetic. Focus on calming techniques or friendly guidance.`;

export default function VideoCallModal({ onClose }) {
  const [status, setStatus] = useState('Connecting...'); // Listening, Thinking, Speaking, Muted
  const [transcript, setTranscript] = useState('');
  const [botReply, setBotReply] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  
  const conversationHistory = useRef([]);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setStatus('Listening');
        setTranscript('Listening for your voice...');
      };

      rec.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(`You: "${text}"`);
        handleUserSpeech(text);
      };

      rec.onerror = (e) => {
        console.error("Speech recognition error:", e);
        if (e.error === 'no-speech') {
          // Restart if no speech detected
          startListening();
        } else {
          setStatus('Ready');
        }
      };

      rec.onend = () => {
        // Only restart if we ended while in listening state and not muted
        if (status === 'Listening' && !isMuted) {
          startListening();
        }
      };

      recognitionRef.current = rec;
    } else {
      setTranscript("Speech recognition not supported in this browser. Please type or use Chrome.");
      setStatus('Manual Mode');
    }

    // Start with a welcoming greeting
    greetStudent();

    return () => {
      stopAllAudio();
    };
  }, []);

  // Handle Mute state change
  useEffect(() => {
    if (isMuted) {
      stopListening();
      setStatus('Muted');
    } else {
      if (status === 'Muted') {
        startListening();
      }
    }
  }, [isMuted]);

  const stopAllAudio = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  };

  const startListening = () => {
    if (isMuted || !recognitionRef.current) return;
    try {
      stopAllAudio();
      recognitionRef.current.start();
    } catch (e) {
      console.warn("Recognition start failed: ", e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn("Recognition stop failed: ", e);
      }
    }
  };

  // Initial greeting
  const greetStudent = () => {
    const greetingText = "Hi Sam! I am your Voice Support counselor. I'm listening. How are you feeling today?";
    speakText(greetingText);
  };

  // Speech synthesis speaking
  const speakText = (text) => {
    stopAllAudio();
    setStatus('Speaking');
    setBotReply(text);

    if (synthRef.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to find a calming English voice
      const voices = synthRef.current.getVoices();
      const idealVoice = voices.find(v => 
        v.name.includes('Google US English') || 
        v.name.includes('Natural') || 
        v.lang.startsWith('en')
      );
      if (idealVoice) {
        utterance.voice = idealVoice;
      }
      
      utterance.rate = 0.95; // Slightly slower, relaxing pace
      utterance.pitch = 1.0;

      utterance.onend = () => {
        if (!isMuted) {
          startListening();
        } else {
          setStatus('Muted');
        }
      };

      utterance.onerror = (e) => {
        console.error("Speech synthesis error:", e);
        if (!isMuted) startListening();
      };

      utteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    } else {
      // Fallback if SpeechSynthesis is missing
      setTimeout(() => {
        if (!isMuted) startListening();
      }, 3000);
    }
  };

  // Process User speech text
  const handleUserSpeech = async (userText) => {
    setStatus('Thinking');
    stopListening();

    try {
      const apiMessages = [
        { role: 'system', content: VOICE_SYSTEM_PROMPT },
        ...conversationHistory.current,
        { role: 'user', content: userText }
      ];

      const completion = await groq.chat.completions.create({
        messages: apiMessages,
        model: 'qwen/qwen3.8-27b',
      });

      const reply = completion.choices[0]?.message?.content || "I'm here for you.";
      
      // Save history
      conversationHistory.current = [
        ...conversationHistory.current,
        { role: 'user', content: userText },
        { role: 'assistant', content: reply }
      ].slice(-10); // Keep last 10 turns for context

      speakText(reply);
    } catch (e) {
      console.error("Voice chat API error:", e);
      speakText("I had trouble connecting. Let me listen again.");
    }
  };

  // CSS class helper for animated central orb
  const getOrbClass = () => {
    switch (status) {
      case 'Listening': return 'orb-listening';
      case 'Thinking': return 'orb-thinking';
      case 'Speaking': return 'orb-speaking';
      case 'Muted': return 'orb-muted';
      default: return 'orb-connecting';
    }
  };

  return (
    <div className="modal-overlay voice-call-overlay">
      <div className="voice-call-container">
        
        {/* Top Header */}
        <div className="voice-header">
          <div className="voice-title-box">
            <Sparkles size={16} className="sparkle-icon" />
            <span>Voice Support Session</span>
          </div>
          <span className="voice-mode-tag">Realtime AI</span>
        </div>

        {/* Central Orb ChatGPT Visualization */}
        <div className="voice-visualizer-area">
          <div className="orb-wrapper">
            <div className={`voice-orb ${getOrbClass()}`}>
              <div className="orb-glow"></div>
            </div>
            {/* Concentric ripples during speaking */}
            {status === 'Speaking' && (
              <>
                <div className="orb-ripple ripple-1"></div>
                <div className="orb-ripple ripple-2"></div>
              </>
            )}
          </div>
          
          <div className="voice-status-box">
            <h3 className="status-label">{status}</h3>
            <p className="transcript-box">{transcript}</p>
            {status === 'Speaking' && <p className="bot-reply-preview">"{botReply}"</p>}
          </div>
        </div>

        {/* Voice Control Buttons at the Bottom */}
        <div className="voice-controls-bar">
          <button 
            className={`voice-control-btn ${isMuted ? 'muted' : ''}`}
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>

          <button 
            className="voice-control-btn end-session-btn" 
            onClick={onClose}
            title="End Session"
          >
            <PhoneOff size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}
