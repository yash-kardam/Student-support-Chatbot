import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import Groq from 'groq-sdk';
import MessageBubble from '../components/MessageBubble';
import FloatingInput from '../components/FloatingInput';
import { retrieve, buildContext, isAbesQuery } from '../lib/ragEngine';
import './ChatView.css';

// Initialize the Groq SDK client
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

const BASE_SYSTEM_PROMPT = `You are a warm, empathetic, and encouraging Student Support Chatbot for ABES Engineering College (Ghaziabad, UP).
Students might talk to you about exams, deadlines, mental health, career doubts, or general life issues — respond with care, empathy, and active listening.
You also have detailed, up-to-date knowledge about ABES Engineering College including departments, faculty, contacts, courses, infrastructure, placements, clubs, and more.
When a student asks anything about ABES EC — contacts, HODs, courses, hostel, library, placement stats, fees, accreditation, clubs — answer accurately and helpfully using the provided context.
Provide practical, concise answers. Avoid robotic jargon. Maintain a friendly, knowledgeable counselor + college guide persona.`;

// ── Task-update command parser ─────────────────────────────────────────────
// The AI is instructed to embed [TASK_UPDATE:{"id":X,"status":"Y"}] in its reply
// when it wants to update a task. We strip those out before displaying the text.
const TASK_UPDATE_REGEX = /\[TASK_UPDATE:\s*(\{[^}]+\})\]/g;

function parseTaskUpdates(text) {
  const updates = [];
  let cleanText = text;
  let match;

  // reset regex state
  TASK_UPDATE_REGEX.lastIndex = 0;
  while ((match = TASK_UPDATE_REGEX.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.id !== undefined && parsed.status) {
        updates.push({ id: Number(parsed.id), status: parsed.status });
      }
    } catch (e) {
      console.warn('Could not parse TASK_UPDATE command:', match[1]);
    }
  }

  // Strip the command tokens from displayed text
  cleanText = text.replace(TASK_UPDATE_REGEX, '').replace(/\n{3,}/g, '\n\n').trim();
  return { cleanText, updates };
}

// Build the tasks context block for the system prompt (always included when tasks exist)
function buildTasksSystemContext(tasks) {
  if (!tasks || tasks.length === 0) return '';
  const list = tasks
    .map(t => `  - ID:${t.id} | "${t.title}" | Priority: ${t.priority} | Status: ${t.status}`)
    .join('\n');
  return `\n\n--- STUDENT'S ACTION PLAN (live task list) ---
${list}
--- END ACTION PLAN ---

TASK UPDATE RULES (follow exactly):
• If the student asks to update, complete, mark, or change the status of any task, embed this command at the END of your response (after your normal reply):
  [TASK_UPDATE:{"id":<task_id>,"status":"<new_status>"}]
• Valid statuses: "To do" | "In progress" | "Done"
• Match the task by name (case-insensitive) using the ID shown above.
• You can emit multiple commands if updating several tasks.
• After embedding the command(s), confirm what you did in friendly human language.
• If you cannot confidently match a task name, ask the student to clarify.
• Never show the raw [TASK_UPDATE:...] text in your reply — it will be stripped automatically.`;
}
// ──────────────────────────────────────────────────────────────────────────────

export default function ChatView({
  initialMessage, clearInitialMessage,
  activeSessionId, setActiveSessionId,
  user, onNewSessionCreated,
  resources, tasks, setTasks
}) {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [latestBotMsgId, setLatestBotMsgId] = useState(null);
  const [taskUpdateNotice, setTaskUpdateNotice] = useState(null); // { count, names[] }
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  // Fetch messages from Supabase when session changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!user) return;
      if (!activeSessionId) { setMessages([]); return; }
      try {
        const { data } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', activeSessionId)
          .order('created_at');
        if (data && data.length > 0) {
          setMessages(data.map(m => ({ sender: m.sender, text: m.text, timestamp: m.timestamp })));
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };
    fetchMessages();
  }, [activeSessionId, user]);

  // Handle new initialMessage (from Home screen)
  const handleSendMessageRef = useRef();
  const processedMessageId = useRef(null);
  useEffect(() => { handleSendMessageRef.current = handleSendMessage; });
  useEffect(() => {
    if (initialMessage?.text && initialMessage.id !== processedMessageId.current) {
      processedMessageId.current = initialMessage.id;
      setTimeout(() => {
        handleSendMessageRef.current(initialMessage.text, null);
        if (clearInitialMessage) clearInitialMessage();
      }, 0);
    }
  }, [initialMessage, clearInitialMessage]);

  // Helper to ensure we have a session
  const ensureSession = async (firstMessageText) => {
    if (activeSessionId) return activeSessionId;
    const title = firstMessageText.length > 30
      ? firstMessageText.substring(0, 30) + '…'
      : firstMessageText;
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ user_id: user.id, title })
      .select()
      .single();
    if (error) { console.error('Failed to create session', error); return null; }
    if (onNewSessionCreated) onNewSessionCreated(data);
    return data.id;
  };

  // ── Core: send to Groq, parse task updates, display ─────────────────────────
  const sendMessageToGroq = async (chatHistory, userMessageText, sessionIdToUse, attachedContext = null) => {
    setIsTyping(true);
    const typingStart = Date.now();

    try {
      // ── Build system prompt ──────────────────────────────────────────────────
      let systemPrompt = BASE_SYSTEM_PROMPT;

      // Always inject task list so AI knows IDs and can act on them
      const taskContext = buildTasksSystemContext(tasks);
      if (taskContext) systemPrompt += taskContext;

      // RAG: ABES knowledge base
      if (isAbesQuery(userMessageText)) {
        const chunks = retrieve(userMessageText, 5);
        if (chunks.length > 0) {
          systemPrompt += `\n\n--- ABES ENGINEERING COLLEGE KNOWLEDGE BASE ---\n${buildContext(chunks)}\n--- END OF KNOWLEDGE BASE ---\nAnswer using the knowledge above. Give exact emails/phones when asked.`;
        }
      }

      // User-attached context (resource / action plan from picker)
      if (attachedContext?.content) {
        systemPrompt += `\n\n--- USER'S ATTACHED CONTEXT ---\n${attachedContext.content}\n--- END ATTACHED CONTEXT ---`;
      }
      // ────────────────────────────────────────────────────────────────────────

      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        })),
        { role: 'user', content: userMessageText }
      ];

      const chatCompletion = await groq.chat.completions.create({
        messages: apiMessages,
        model: 'openai/gpt-oss-120b',
      });

      const rawReply = chatCompletion.choices[0]?.message?.content
        || "I'm sorry, I'm having trouble connecting right now.";

      // ── Parse and apply task updates ─────────────────────────────────────────
      const { cleanText, updates } = parseTaskUpdates(rawReply);

      if (updates.length > 0 && tasks && setTasks) {
        const updatedNames = [];
        const updatedTasks = tasks.map(t => {
          const upd = updates.find(u => u.id === t.id);
          if (upd) {
            updatedNames.push({ title: t.title, status: upd.status });
            return { ...t, status: upd.status };
          }
          return t;
        });
        setTasks(updatedTasks);
        setTaskUpdateNotice({ updates: updatedNames });
        // Auto-clear the notice after 5 seconds
        setTimeout(() => setTaskUpdateNotice(null), 5000);
      }
      // ────────────────────────────────────────────────────────────────────────

      const msgId = `bot-${Date.now()}`;
      const newBotMessage = {
        id: msgId,
        sender: 'bot',
        text: cleanText,
        isNew: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      // Enforce minimum 2-second typing dots
      const elapsed = Date.now() - typingStart;
      if (elapsed < 2000) await new Promise(r => setTimeout(r, 2000 - elapsed));

      setIsTyping(false);
      setMessages(prev => [...prev, newBotMessage]);
      setLatestBotMsgId(msgId);

      if (sessionIdToUse) {
        await supabase.from('chat_messages').insert({
          session_id: sessionIdToUse,
          sender: 'bot',
          text: cleanText,
          timestamp: newBotMessage.timestamp
        });
      }
    } catch (error) {
      console.error('Error communicating with Groq API:', error);
      const elapsed = Date.now() - typingStart;
      if (elapsed < 2000) await new Promise(r => setTimeout(r, 2000 - elapsed));
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: 'I experienced an error connecting to my thought server. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  };
  // ────────────────────────────────────────────────────────────────────────────

  const handleSendMessage = async (text, attachedContext = null, overrideSessionId = null) => {
    const newUserMessage = {
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const currentHistory = [...messages];
    setMessages(prev => [...prev, newUserMessage]);

    const sessionIdToUse = overrideSessionId || await ensureSession(text);
    if (sessionIdToUse) {
      await supabase.from('chat_messages').insert({
        session_id: sessionIdToUse, sender: 'user', text,
        timestamp: newUserMessage.timestamp
      });
    }
    sendMessageToGroq(currentHistory, text, sessionIdToUse, attachedContext);
  };

  return (
    <div className="chat-view-container">
      <div className="chat-messages">
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id || index}
            message={message}
            animate={message.id && message.id === latestBotMsgId}
          />
        ))}
        {isTyping && (
          <MessageBubble message={{ sender: 'bot', isTyping: true }} />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Task update toast notification */}
      {taskUpdateNotice && (
        <div className="task-update-toast">
          <span className="toast-check">✓</span>
          <div className="toast-body">
            <strong>Task{taskUpdateNotice.updates.length > 1 ? 's' : ''} updated</strong>
            {taskUpdateNotice.updates.map((u, i) => (
              <span key={i} className="toast-task-line">
                "{u.title}" → <em>{u.status}</em>
              </span>
            ))}
          </div>
          <button className="toast-close" onClick={() => setTaskUpdateNotice(null)}>✕</button>
        </div>
      )}

      <FloatingInput
        onSubmit={(text, attachedCtx) => handleSendMessage(text, attachedCtx, activeSessionId)}
        resources={resources || []}
        tasks={tasks || []}
      />
    </div>
  );
}
