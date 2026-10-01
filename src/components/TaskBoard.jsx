import { useState } from 'react';
import { Search, Plus, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import Groq from 'groq-sdk';
import './TaskBoard.css';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

const getStatusColor = (tag) => {
  switch (tag) {
    case 'Urgent': return 'status-urgent';
    case 'By today': return 'status-today';
    case 'By tomorrow': return 'status-tomorrow';
    case 'In progress': return 'status-progress';
    default: return 'status-todo';
  }
};

export default function TaskBoard({ tasks, setTasks }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isPrioritizing, setIsPrioritizing] = useState(false);

  // Toggle complete
  const toggleComplete = (taskId) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          status: task.status === 'Done' ? 'To do' : 'Done'
        };
      }
      return task;
    }));
  };

  // AI Task Prioritizer via Groq
  const handleAiPrioritize = async () => {
    if (tasks.length === 0) return;
    setIsPrioritizing(true);

    try {
      const prompt = `Here is my current student task list. Please sort these tasks in order of logical/academic priority (from highest urgency to lowest). 
Format your response ONLY as a valid JSON array of objects with the exact keys: "id" (keep original id), "title", "priority", "status". Do not include markdown code block syntax (like \`\`\`json), just return the raw JSON array string.

Current Tasks:
${JSON.stringify(tasks)}`;

      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'qwen/qwen3.8-27b',
      });

      const responseText = chatCompletion.choices[0]?.message?.content || "";
      const arrayMatch = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (arrayMatch) {
        const prioritizedList = JSON.parse(arrayMatch[0]);
        if (Array.isArray(prioritizedList)) {
          setTasks(prioritizedList);
        }
      } else {
        throw new Error("No JSON array found in LLM response");
      }
    } catch (error) {
      console.error("AI Task sorting error:", error);
    } finally {
      setIsPrioritizing(false);
    }
  };

  // Filtering
  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="card task-board-card">
      <div className="task-board-header">
        <div className="task-board-title">
          <h3>My Action Plan</h3>
          <span className="task-count">{tasks.filter(t => t.status !== 'Done').length} left</span>
        </div>
        
        <div className="task-actions">
          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            className="prioritize-btn" 
            onClick={handleAiPrioritize}
            disabled={isPrioritizing || tasks.length === 0}
          >
            <Sparkles size={14} />
            {isPrioritizing ? 'Sorting...' : 'AI Prioritize'}
          </button>
        </div>
      </div>

      <div className="task-table">
        {filteredTasks.length === 0 ? (
          <div className="empty-tasks">
            <p>No tasks. Add some in Action Plan page!</p>
          </div>
        ) : (
          filteredTasks.slice(0, 4).map((task) => (
            <div key={task.id} className="task-row">
              <div className="task-main" style={{ cursor: 'pointer' }} onClick={() => toggleComplete(task.id)}>
                <div 
                  className="task-dot" 
                  style={{ backgroundColor: task.status === 'Done' ? '#22c55e' : '#ef4444' }}
                ></div>
                <span className="task-name" style={{ textDecoration: task.status === 'Done' ? 'line-through' : 'none' }}>
                  {task.title}
                </span>
              </div>
              
              <div className="task-meta">
                <div className="task-tags">
                  <span className={`task-badge ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                  <span className={`task-badge ${getStatusColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
