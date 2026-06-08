import { Header } from '@/react-app/components/Header';
import { PostCard } from '@/react-app/components/PostCard';
import { FollowListModal } from '@/react-app/components/FollowListModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/react-app/components/ui/avatar';
import { Grid3X3, Flame, ShoppingBag, MapPin, Edit, List, LayoutGrid, Sun, Moon, LogOut, Loader2 } from 'lucide-react';
import { usePosts } from '@/react-app/hooks/usePosts';
import { useUsers } from '@/react-app/hooks/useUsers';
import { useTheme } from '@/react-app/hooks/useTheme';
import { useAuth } from '@getmocha/users-service/react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/react-app/components/ui/button';

type Tab = 'posts' | 'hyped' | 'transactions';
type ViewMode = 'feed' | 'grid';
type FollowModal = 'followers' | 'following' | null;

export default function ProfilePage() {
  const { posts } = usePosts();
  const { currentUser, getFollowingUsers } = useUsers();
  const { theme, toggleTheme } = useTheme();
  const { user: authUser, isPending, logout, redirectToLogin } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('posts');
  const [viewMode, setViewMode] = useState<ViewMode>('feed');
  const [followModal, setFollowModal] = useState<FollowModal>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  // Show loading while checking auth
  if (isPending) {
    return (
      <div className="min-h-screen pb-20">
        <Header title="Perfil" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!authUser) {
    return (
      <div className="min-h-screen pb-20">
        <Header title="Perfil" />
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-orange-500/20 flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">👋</span>
            </div>
            <h2 className="text-2xl font-display font-bold mb-3">Bem-vindo ao DeZapGa!</h2>
            <p className="text-muted-foreground mb-8">
              Entre na sua conta para publicar, dar hype e conectar com outros desapegadores.
            </p>
            <Button
              onClick={redirectToLogin}
              size="lg"
              className="w-full max-w-xs bg-white text-gray-800 hover:bg-gray-100"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Entrar com Google
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const myPosts = posts.filter((post) => post.user.id === currentUser.id || post.user.id === 'me');
  const hypedPosts = posts.filter((post) => post.isHyped);
  const transactionPosts = posts.filter(
    (post) => (post.user.id === currentUser.id || post.user.id === 'me') && (post.status === 'sold' || post.status === 'donated')
  );

  const followingUsers = getFollowingUsers();

  const hasLocation = currentUser.location && (currentUser.location.city || currentUser.location.neighborhood);

  const formatLocation = () => {
    if (!currentUser.location) return '';
    const parts = [];
    if (currentUser.location.neighborhood) parts.push(currentUser.location.neighborhood);
    if (currentUser.location.city) parts.push(currentUser.location.city);
    if (currentUser.location.state) parts.push(currentUser.location.state);
    return parts.join(', ');
  };

  const tabs = [
    { id: 'posts' as Tab, icon: Grid3X3, label: 'Publicações', count: myPosts.length },
    { id: 'hyped' as Tab, icon: Flame, label: 'Hypados', count: hypedPosts.length },
    { id: 'transactions' as Tab, icon: ShoppingBag, label: 'Transações', count: transactionPosts.length },
  ];

  const renderPosts = (postsList: typeof posts, EmptyIcon: typeof Grid3X3, emptyMessage: string, emptySubMessage?: string) => {
    if (postsList.length === 0) {
      return (
        <div className="text-center py-12">
          <EmptyIcon className="mx-auto text-muted-foreground mb-3" size={32} />
          <p className="text-muted-foreground">{emptyMessage}</p>
          {emptySubMessage && <p className="text-sm text-muted-foreground mt-1">{emptySubMessage}</p>}
        </div>
      );
    }

    if (viewMode === 'grid') {
      return (
        <div className="grid grid-cols-2 gap-3">
          {postsList.map((post) => (
            <PostCard key={post.id} post={post} compact />
          ))}
        </div>
      );
    }

    return postsList.map((post) => <PostCard key={post.id} post={post} />);
  };

  const getTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return renderPosts(myPosts, Grid3X3, 'Você ainda não publicou nada.', 'Clique em "Publicar" para criar seu primeiro anúncio!');
      case 'hyped':
        return renderPosts(hypedPosts, Flame, 'Posts que você deu hype aparecerão aqui.');
      case 'transactions':
        return renderPosts(transactionPosts, ShoppingBag, 'Histórico de vendas e doações.');
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <Header title="Perfil" />
      
      <main className="max-w-lg mx-auto">
        {/* Profile header */}
        <div className="px-4 py-6">
          <div className="flex items-start gap-4 mb-4">
            <Avatar className="h-20 w-20 ring-4 ring-primary/20">
              <AvatarImage src={currentUser.avatar} />
              <AvatarFallback className="text-2xl">{currentUser.displayName[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-display font-bold text-xl">{currentUser.displayName}</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-2">@{currentUser.username}</p>
              <p className="text-sm mb-2">{currentUser.bio}</p>
              {hasLocation && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin size={14} />
                  <span>{formatLocation()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Edit profile button */}
          <div className="flex gap-2 mb-4">
            <Button
              onClick={() => navigate('/profile/edit')}
              variant="outline"
              className="flex-1"
            >
              <Edit size={16} className="mr-2" />
              Editar Perfil
            </Button>
            <Button
              onClick={toggleTheme}
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="icon"
              className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
            </Button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 py-4 border-y border-border">
            <div className="text-center">
              <p className="font-display font-bold text-lg">{myPosts.length}</p>
              <p className="text-xs text-muted-foreground">Publicações</p>
            </div>
            <button 
              onClick={() => setFollowModal('followers')}
              className="text-center hover:bg-secondary/50 px-3 py-1 rounded-lg transition-colors"
            >
              <p className="font-display font-bold text-lg">{currentUser.followersCount}</p>
              <p className="text-xs text-muted-foreground">Seguidores</p>
            </button>
            <button 
              onClick={() => setFollowModal('following')}
              className="text-center hover:bg-secondary/50 px-3 py-1 rounded-lg transition-colors"
            >
              <p className="font-display font-bold text-lg">{followingUsers.length}</p>
              <p className="text-xs text-muted-foreground">Seguindo</p>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon size={18} />
              <span className="text-sm font-medium hidden sm:inline">{tab.label}</span>
              {tab.count > 0 && (
                <span className="text-xs bg-secondary px-1.5 py-0.5 rounded-full">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex items-center justify-end px-4 py-3">
          <div className="flex items-center bg-secondary rounded-lg p-1">
            <button
              onClick={() => setViewMode('feed')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'feed' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`p-4 ${viewMode === 'feed' ? 'space-y-4' : ''}`}>
          {getTabContent()}
        </div>
      </main>

      {/* Follow List Modal */}
      <FollowListModal
        isOpen={followModal !== null}
        onClose={() => setFollowModal(null)}
        title={followModal === 'followers' ? 'Seguidores' : 'Seguindo'}
        users={followingUsers}
      />
    </div>
  );
}
