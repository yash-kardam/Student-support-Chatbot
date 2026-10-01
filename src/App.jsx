import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import DashboardLayout from './components/DashboardLayout';
import AuthPage from './pages/AuthPage';
import Home from './pages/Home';
import ChatView from './pages/ChatView';
import ActionPlanPage from './pages/ActionPlanPage';
import SessionsPage from './pages/SessionsPage';
import ResourcesPage from './pages/ResourcesPage';
import BreathingModal from './components/BreathingModal';
import VideoCallModal from './components/VideoCallModal';
import DocumentReaderModal from './components/DocumentReaderModal';
import OnboardingTour from './components/OnboardingTour';

function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [currentView, setCurrentView] = useState('home');
  const [initialChatMessage, setInitialChatMessage] = useState('');
  const [activeSessionId, setActiveSessionId] = useState(null);
  
  // Local state
  const [tasks, setTasks] = useState([]);
  const [resources, setResources] = useState([]);
  const [chatSessions, setChatSessions] = useState([]);

  // Supabase Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Supabase Data Fetching (only when user is logged in)
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const { data: tasksData } = await supabase.from('tasks').select('*').eq('user_id', user.id).order('id');
        if (tasksData) setTasks(tasksData);
        
        const { data: resourcesData } = await supabase.from('resources').select('*').eq('user_id', user.id).order('id');
        if (resourcesData) setResources(resourcesData);

        const { data: sessionsData } = await supabase.from('chat_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (sessionsData) setChatSessions(sessionsData);
      } catch (err) {
        console.error("Error fetching from Supabase:", err);
      }
    };
    fetchData();
  }, [user]);
  
  // Sync a single new task to Supabase and update state with DB-assigned id
  const syncTasks = async (newTasks) => {
    // newTasks is the full desired array (from ActionPlanPage setTasks)
    setTasks(newTasks);
    if (!user) return;
    try {
      // Find tasks that don't have a proper DB id (newly added, id is a timestamp number)
      // We keep track by checking if the id already exists in the current DB tasks
      const dbRows = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', user.id);
      const existingDbIds = new Set((dbRows.data || []).map(r => r.id));

      for (const t of newTasks) {
        if (existingDbIds.has(t.id)) {
          // Update existing row
          await supabase.from('tasks').update({
            title: t.title,
            priority: t.priority,
            status: t.status,
          }).eq('id', t.id).eq('user_id', user.id);
        } else {
          // Insert new row, get back the DB id, update local state
          const { data: inserted } = await supabase
            .from('tasks')
            .insert({ title: t.title, priority: t.priority, status: t.status, user_id: user.id })
            .select()
            .single();
          if (inserted) {
            // Replace the temp local id with the real DB id
            setTasks(prev => prev.map(pt => pt.id === t.id ? { ...pt, id: inserted.id } : pt));
          }
        }
      }

      // Delete tasks removed from the list
      const newIds = new Set(newTasks.map(t => t.id));
      for (const dbId of existingDbIds) {
        if (!newIds.has(dbId)) {
          await supabase.from('tasks').delete().eq('id', dbId).eq('user_id', user.id);
        }
      }
    } catch (err) {
      console.error('syncTasks error:', err);
    }
  };

  const syncResources = async (newResources) => {
    setResources(newResources);
    if (!user) return;
    try {
      const dbRows = await supabase
        .from('resources')
        .select('id')
        .eq('user_id', user.id);
      const existingDbIds = new Set((dbRows.data || []).map(r => r.id));

      for (const r of newResources) {
        if (existingDbIds.has(r.id)) {
          await supabase.from('resources').update({
            name: r.name,
            type: r.type,
            color: r.color,
            content: r.content,
          }).eq('id', r.id).eq('user_id', user.id);
        } else {
          const { data: inserted } = await supabase
            .from('resources')
            .insert({ name: r.name, type: r.type, color: r.color, content: r.content, user_id: user.id })
            .select()
            .single();
          if (inserted) {
            setResources(prev => prev.map(pr => pr.id === r.id ? { ...pr, id: inserted.id } : pr));
          }
        }
      }

      // Delete resources removed from the list
      const newIds = new Set(newResources.map(r => r.id));
      for (const dbId of existingDbIds) {
        if (!newIds.has(dbId)) {
          await supabase.from('resources').delete().eq('id', dbId).eq('user_id', user.id);
        }
      }
    } catch (err) {
      console.error('syncResources error:', err);
    }
  };

  // Modal States
  const [isBreathingOpen, setIsBreathingOpen] = useState(false);
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [isDocReaderOpen, setIsDocReaderOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const handleStartChat = (msg) => {
    setInitialChatMessage({ text: msg, id: Date.now() });
    setActiveSessionId(null);
    setCurrentView('chat');
  };

  const handleViewDoc = (doc) => {
    setSelectedDoc(doc);
    setIsDocReaderOpen(true);
  };

  // Navigations
  const handleNavigate = (view) => {
    setCurrentView(view);
  };

  if (isAuthLoading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <DashboardLayout 
      currentView={currentView} 
      onNavigate={handleNavigate}
      user={user}
      chatSessions={chatSessions}
      activeSessionId={activeSessionId}
      setActiveSessionId={setActiveSessionId}
    >
      {currentView === 'home' && (
        <Home 
          onStartChat={handleStartChat} 
          onOpenBreathing={() => setIsBreathingOpen(true)}
          onJoinMeeting={() => setIsVideoCallOpen(true)}
          tasks={tasks}
          setTasks={syncTasks}
          resources={resources}
          onViewDoc={handleViewDoc}
          user={user}
        />
      )}
      {currentView === 'chat' && (
        <ChatView 
          initialMessage={initialChatMessage} 
          clearInitialMessage={() => setInitialChatMessage(null)}
          activeSessionId={activeSessionId}
          setActiveSessionId={setActiveSessionId}
          user={user}
          resources={resources}
          tasks={tasks}
          setTasks={syncTasks}
          onNewSessionCreated={(newSession) => {
             setChatSessions(prev => [newSession, ...prev]);
             setActiveSessionId(newSession.id);
          }}
        />
      )}
      {currentView === 'tasks' && (
        <ActionPlanPage 
          tasks={tasks} 
          setTasks={syncTasks} 
        />
      )}
      {currentView === 'sessions' && (
        <SessionsPage 
          onJoinMeeting={() => setIsVideoCallOpen(true)} 
        />
      )}
      {currentView === 'resources' && (
        <ResourcesPage 
          resources={resources} 
          setResources={syncResources}
          onViewDoc={handleViewDoc}
        />
      )}

      {/* Modals */}
      {isBreathingOpen && (
        <BreathingModal onClose={() => setIsBreathingOpen(false)} />
      )}
      {isVideoCallOpen && (
        <VideoCallModal onClose={() => setIsVideoCallOpen(false)} />
      )}
      {isDocReaderOpen && selectedDoc && (
        <DocumentReaderModal 
          doc={selectedDoc} 
          onClose={() => {
            setIsDocReaderOpen(false);
            setSelectedDoc(null);
          }} 
        />
      )}

      <OnboardingTour user={user} currentView={currentView} />
    </DashboardLayout>
  );
}

export default App;
