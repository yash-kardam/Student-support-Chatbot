import { Calendar } from 'lucide-react';
import FileCard from '../components/FileCard';
import SuggestedTask from '../components/SuggestedTask';
import TaskBoard from '../components/TaskBoard';
import FloatingInput from '../components/FloatingInput';
import './Home.css';

export default function Home({ 
  onStartChat, 
  onOpenBreathing, 
  onJoinMeeting, 
  tasks, 
  setTasks, 
  resources, 
  onViewDoc,
  user
}) {
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Friend';

  return (
    <div className="home-container">
      <header className="home-header">
        <h1 className="welcome-text">
          <span className="welcome-highlight">Welcome, {userName}! 👋</span>
          <br />
          <span className="welcome-subtext">How can I help you today?</span>
        </h1>
      </header>

      <div className="home-grid">
        <div className="grid-col files-col">
          <FileCard resources={resources} onViewDoc={onViewDoc} />
        </div>
        
        <div className="grid-col suggestions-col">
          <SuggestedTask 
            icon={Calendar} 
            title="Upcoming session: Midterm Prep" 
            description="With Counselor Jane at 2:00 PM" 
            onClick={onJoinMeeting}
          />
          <div className="action-row">
            <SuggestedTask 
              title="Take a 5-min breather" 
              onClick={onOpenBreathing}
            />
            <SuggestedTask 
              title="Review math concepts" 
              onClick={() => onStartChat("Can you help me review the calculus math concepts for my upcoming test?")}
            />
          </div>
        </div>
      </div>

      <div className="tasks-section">
        <TaskBoard tasks={tasks} setTasks={setTasks} />
      </div>

      <FloatingInput onSubmit={onStartChat} />
    </div>
  );
}
