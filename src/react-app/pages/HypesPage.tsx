import { useState } from 'react';
import { Link } from 'react-router';
import { Header } from '@/react-app/components/Header';
import { PostCard } from '@/react-app/components/PostCard';
import { PostGridCard } from '@/react-app/components/PostGridCard';
import { ViewToggle, ViewMode } from '@/react-app/components/ViewToggle';
import { usePosts } from '@/react-app/hooks/usePosts';
import { Flame } from 'lucide-react';

export default function HypesPage() {
  const { posts, trendingPosts } = usePosts();
  const [viewMode, setViewMode] = useState<ViewMode>('feed');
  
  // Use trending posts from API, fallback to sorting regular posts
  const hypedPosts = trendingPosts.length > 0 
    ? trendingPosts 
    : [...posts].sort((a, b) => b.hypeCount - a.hypeCount);
  const topThree = hypedPosts.slice(0, 3);
  const remainingPosts = hypedPosts.slice(3);

  return (
    <div className="min-h-screen pb-20">
      <Header title="Em Alta 🔥" />
      
      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Top 3 highlight */}
        <div className="bg-gradient-to-br from-primary/20 via-orange-500/10 to-transparent rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="text-primary" size={20} />
            <h2 className="font-display font-semibold text-sm">Top Hypes</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {topThree.map((post, index) => (
              <Link
                key={post.id}
                to={`/post/${post.id}`}
                className="flex-shrink-0 w-28 relative block hover:scale-105 transition-transform"
              >
                <div className="aspect-square rounded-xl overflow-hidden ring-2 ring-primary/30">
                  <img
                    src={post.images[0]}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -top-1 -left-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground shadow-lg">
                  {index + 1}
                </div>
                <p className="mt-2 text-xs font-medium truncate">{post.title}</p>
                <p className="text-xs text-primary font-semibold">{post.hypeCount} hypes</p>
              </Link>
            ))}
          </div>
        </div>

        {/* View toggle and posts section */}
        {remainingPosts.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-sm text-muted-foreground">
                Mais populares
              </h3>
              <ViewToggle mode={viewMode} onChange={setViewMode} />
            </div>

            {viewMode === 'feed' ? (
              <div className="space-y-4">
                {remainingPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {remainingPosts.map((post) => (
                  <PostGridCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Show all posts in selected view if there are only top 3 */}
        {remainingPosts.length === 0 && hypedPosts.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-sm text-muted-foreground">
                Todas publicações
              </h3>
              <ViewToggle mode={viewMode} onChange={setViewMode} />
            </div>

            {viewMode === 'feed' ? (
              <div className="space-y-4">
                {hypedPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {hypedPosts.map((post) => (
                  <PostGridCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
