import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, UserPlus, UserMinus, Grid3X3, List, LayoutGrid } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/react-app/components/ui/avatar';
import { Button } from '@/react-app/components/ui/button';
import { PostCard } from '@/react-app/components/PostCard';
import { FollowListModal } from '@/react-app/components/FollowListModal';
import { useUsers } from '@/react-app/hooks/useUsers';
import { usePosts } from '@/react-app/hooks/usePosts';
import { useState, useEffect } from 'react';

type ViewMode = 'feed' | 'grid';
type FollowModal = 'followers' | 'following' | null;

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { getUserById, toggleFollow, areMutualFollowers, getFollowersOfUser, getFollowingOfUser } = useUsers();
  const { posts } = usePosts();
  const [viewMode, setViewMode] = useState<ViewMode>('feed');
  const [followModal, setFollowModal] = useState<FollowModal>(null);
  const [followersUsers, setFollowersUsers] = useState<any[]>([]);
  const [followingUsers, setFollowingUsers] = useState<any[]>([]);

  const user = getUserById(userId || '');
  const isMutual = userId ? areMutualFollowers(userId) : false;

  useEffect(() => {
    if (userId && followModal) {
      if (followModal === 'followers') {
        getFollowersOfUser(userId).then(setFollowersUsers);
      } else {
        getFollowingOfUser(userId).then(setFollowingUsers);
      }
    }
  }, [userId, followModal, getFollowersOfUser, getFollowingOfUser]);
  
  if (!user) {
    return (
      <div className="min-h-screen pb-20 flex items-center justify-center">
        <p className="text-muted-foreground">Usuário não encontrado</p>
      </div>
    );
  }

  const userPosts = posts.filter((post) => post.user.id === user.id);
  const isMe = user.id === 'me';

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto flex items-center h-14 px-4 gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-secondary rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-semibold text-lg truncate">{user.displayName}</h1>
            <p className="text-xs text-muted-foreground">@{user.username}</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        {/* Profile header */}
        <div className="px-4 py-6">
          <div className="flex items-start gap-4 mb-4">
            <Avatar className="h-20 w-20 ring-4 ring-primary/20">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-2xl">{user.displayName[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="font-display font-bold text-xl mb-1">{user.displayName}</h2>
              <p className="text-sm text-muted-foreground mb-3">@{user.username}</p>
              <p className="text-sm">{user.bio}</p>
            </div>
          </div>

          {/* Follow button */}
          {!isMe && (
            <Button
              onClick={() => toggleFollow(user.id)}
              variant={user.isFollowing ? 'outline' : 'default'}
              className={`w-full mb-4 ${
                !user.isFollowing
                  ? 'bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90'
                  : ''
              }`}
            >
              {user.isFollowing ? (
                <>
                  <UserMinus size={18} className="mr-2" />
                  Deixar de Seguir
                </>
              ) : (
                <>
                  <UserPlus size={18} className="mr-2" />
                  Seguir
                </>
              )}
            </Button>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 py-4 border-y border-border">
            <div className="text-center">
              <p className="font-display font-bold text-lg">{userPosts.length}</p>
              <p className="text-xs text-muted-foreground">Publicações</p>
            </div>
            <button 
              onClick={() => setFollowModal('followers')}
              className="text-center hover:bg-secondary/50 px-3 py-1 rounded-lg transition-colors"
            >
              <p className="font-display font-bold text-lg">{user.followersCount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Seguidores</p>
            </button>
            <button 
              onClick={() => setFollowModal('following')}
              className="text-center hover:bg-secondary/50 px-3 py-1 rounded-lg transition-colors"
            >
              <p className="font-display font-bold text-lg">{user.followingCount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Seguindo</p>
            </button>
          </div>
        </div>

        {/* Posts section */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Grid3X3 size={18} className="text-muted-foreground" />
              <h3 className="font-semibold text-sm">Publicações</h3>
            </div>
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
          
          {userPosts.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 gap-3">
                {userPosts.map((post) => (
                  <PostCard key={post.id} post={post} compact />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {userPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <Grid3X3 className="mx-auto text-muted-foreground mb-3" size={32} />
              <p className="text-muted-foreground">Nenhuma publicação ainda.</p>
            </div>
          )}
        </div>
      </main>

      {/* Follow List Modal */}
      <FollowListModal
        isOpen={followModal !== null}
        onClose={() => setFollowModal(null)}
        title={followModal === 'followers' ? 'Seguidores' : 'Seguindo'}
        users={followModal === 'followers' ? followersUsers : followingUsers}
        isLocked={!isMutual}
        lockedMessage="Vocês precisam se seguir mutuamente para ver esta lista"
      />
    </div>
  );
}
