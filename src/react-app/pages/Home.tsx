import { Header } from '@/react-app/components/Header';
import { PostCard } from '@/react-app/components/PostCard';
import { usePosts } from '@/react-app/hooks/usePosts';
import { useUsers } from '@/react-app/hooks/useUsers';
import { Users } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function HomePage() {
  const { posts } = usePosts();
  const { users } = useUsers();
  const navigate = useNavigate();
  
  // Get users I'm following
  const followingUsers = users.filter((u) => u.isFollowing);
  
  // Filter posts from followed users only (or my own posts)
  const feedPosts = posts.filter((post) => 
    post.user.isFollowing || post.user.id === 'me'
  );

  return (
    <div className="min-h-screen pb-20">
      <Header showLogo />
      
      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Following users quick access */}
        {followingUsers.length > 0 && (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
            {followingUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => navigate(`/user/${user.id}`)}
                className="flex flex-col items-center gap-1 flex-shrink-0"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-orange-500 p-0.5">
                  <img
                    src={user.avatar}
                    alt={user.displayName}
                    className="w-full h-full rounded-full object-cover ring-2 ring-background"
                  />
                </div>
                <span className="text-xs text-muted-foreground truncate max-w-[60px]">
                  {user.displayName.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        )}

        {feedPosts.length === 0 ? (
          <div className="text-center py-16">
            <Users className="mx-auto text-muted-foreground mb-4" size={48} />
            <p className="text-muted-foreground mb-2">
              Seu feed está vazio.
            </p>
            <p className="text-sm text-muted-foreground">
              Siga outros usuários para ver suas publicações aqui.
            </p>
            <button
              onClick={() => navigate('/search')}
              className="mt-4 text-primary font-semibold hover:underline"
            >
              Descobrir pessoas
            </button>
          </div>
        ) : (
          feedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </main>
    </div>
  );
}
