import { useState } from 'react';
import { Search, Plus, Trash2, CheckCircle2, Circle, Sparkles, Filter } from 'lucide-react';
import Groq from 'groq-sdk';
import './ActionPlanPage.css';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

export default function ActionPlanPage({ tasks, setTasks }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('Normal');
  const [newStatus, setNewStatus] = useState('To do');
  const [filterPriority, setFilterPriority] = useState('All');
  const [isPrioritizing, setIsPrioritizing] = useState(false);

  // Toggle complete
  const toggleComplete = (taskId) => {
    const updated = tasks.map(task =>
      task.id === taskId
        ? { ...task, status: task.status === 'Done' ? 'To do' : 'Done' }
        : task
    );
    setTasks(updated);
  };

  // Delete task
  const deleteTask = (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  // Add new task
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask = {
      id: Date.now(),
      title: newTitle,
      priority: newPriority,
      status: newStatus
    };

    setTasks([newTask, ...tasks]);
    setNewTitle('');
    setNewPriority('Normal');
    setNewStatus('To do');
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
      alert("Failed to prioritize tasks via AI. Please check your network connection.");
    } finally {
      setIsPrioritizing(false);
    }
  };

  // Filtering
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'All' || task.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="action-plan-page">
      <header className="page-header">
        <h1 className="page-title">My Action Plan</h1>
        <p className="page-subtitle">Add, complete, or ask AI to prioritize your study list.</p>
      </header>

      {/* Add Task Box */}
      <form onSubmit={handleAddTask} className="add-task-form card">
        <div className="form-row">
          <input 
            type="text" 
            placeholder="Add new task (e.g. Finish chemistry lab report)..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="task-input-field"
          />
          
          <select 
            value={newPriority} 
            onChange={(e) => setNewPriority(e.target.value)}
            className="task-select"
          >
            <option value="Urgent">Urgent</option>
            <option value="By today">By Today</option>
            <option value="By tomorrow">By Tomorrow</option>
            <option value="Normal">Normal</option>
          </select>

          <select 
            value={newStatus} 
            onChange={(e) => setNewStatus(e.target.value)}
            className="task-select"
          >
            <option value="To do">To Do</option>
            <option value="In progress">In Progress</option>
          </select>

          <button type="submit" className="add-btn-primary">
            <Plus size={16} /> Add Task
          </button>
        </div>
      </form>

      {/* Task Filters and AI Trigger */}
      <div className="task-filters-row">
        <div className="search-filter-box">
          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-dropdown">
            <Filter size={16} className="filter-icon" />
            <select 
              value={filterPriority} 
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="All">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="By today">By Today</option>
              <option value="By tomorrow">By Tomorrow</option>
              <option value="Normal">Normal</option>
            </select>
          </div>
        </div>

        <button 
          onClick={handleAiPrioritize} 
          className="prioritize-btn-large"
          disabled={isPrioritizing || tasks.length === 0}
        >
          <Sparkles size={16} />
          {isPrioritizing ? 'AI Prioritizing...' : 'AI Prioritize List'}
        </button>
      </div>

      {/* Tasks List */}
      <div className="tasks-list-container card">
        {filteredTasks.length === 0 ? (
          <div className="empty-tasks">
            <p>No tasks found. Create one above to get started!</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} className={`task-item-row ${task.status === 'Done' ? 'completed' : ''}`}>
              <div className="task-left">
                <button className="check-btn" onClick={() => toggleComplete(task.id)}>
                  {task.status === 'Done' ? (
                    <CheckCircle2 size={20} className="check-icon-active" />
                  ) : (
                    <Circle size={20} className="check-icon-empty" />
                  )}
                </button>
                <span className="task-title-text">{task.title}</span>
              </div>

              <div className="task-right">
                <span className={`task-badge badge-${task.priority.toLowerCase().replace(' ', '-')}`}>
                  {task.priority}
                </span>
                
                <span className={`task-badge badge-${task.status.toLowerCase().replace(' ', '-')}`}>
                  {task.status}
                </span>

                <button className="delete-btn" onClick={() => deleteTask(task.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
