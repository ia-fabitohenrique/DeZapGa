import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router';
import { AuthProvider } from '@getmocha/users-service/react';
import { BottomNav } from '@/react-app/components/BottomNav';
import { PostsProvider } from '@/react-app/hooks/usePosts';
import { UsersProvider } from '@/react-app/hooks/useUsers';
import { MessagesProvider } from '@/react-app/hooks/useMessages';
import { ThemeProvider } from '@/react-app/hooks/useTheme';
import HomePage from '@/react-app/pages/Home';
import HypesPage from '@/react-app/pages/HypesPage';
import SearchPage from '@/react-app/pages/SearchPage';
import MessagesPage from '@/react-app/pages/MessagesPage';
import ChatPage from '@/react-app/pages/ChatPage';
import ProfilePage from '@/react-app/pages/ProfilePage';
import UserProfilePage from '@/react-app/pages/UserProfilePage';
import EditProfilePage from '@/react-app/pages/EditProfilePage';
import LoginPage from '@/react-app/pages/LoginPage';
import AuthCallbackPage from '@/react-app/pages/AuthCallbackPage';

function AppContent() {
  const location = useLocation();
  const hideNav = ['/login', '/auth/callback'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/hypes" element={<HypesPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/chat/:conversationId" element={<ChatPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<EditProfilePage />} />
        <Route path="/user/:userId" element={<UserProfilePage />} />
      </Routes>
      {!hideNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UsersProvider>
          <PostsProvider>
            <MessagesProvider>
              <Router>
                <AppContent />
              </Router>
            </MessagesProvider>
          </PostsProvider>
        </UsersProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
