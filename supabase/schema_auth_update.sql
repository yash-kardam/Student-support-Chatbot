-- First, make sure we empty the tables to avoid NOT NULL constraint violations if there's any test data
TRUNCATE TABLE chat_messages, chat_sessions, resources, tasks RESTART IDENTITY;

-- Add user_id to tasks
ALTER TABLE tasks 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL;

-- Add user_id to resources
ALTER TABLE resources 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL;

-- Add user_id and a title to chat_sessions
ALTER TABLE chat_sessions 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
ADD COLUMN title TEXT DEFAULT 'New Session';
