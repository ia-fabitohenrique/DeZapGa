import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@getmocha/users-service/react';
import { Post, User, stubPosts } from '@/data/stubData';

interface PostsContextType {
  posts: Post[];
  trendingPosts: Post[];
  isLoading: boolean;
  error: string | null;
  addPost: (post: Omit<Post, 'id' | 'user' | 'hypeCount' | 'isHyped' | 'createdAt' | 'status'>) => Promise<void>;
  updatePost: (id: string, updates: Partial<Post>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  toggleHype: (id: string) => Promise<void>;
  markAsSold: (id: string) => Promise<void>;
  markAsDonated: (id: string) => Promise<void>;
  refreshPosts: () => Promise<void>;
  getPostsByUserId: (userId: string) => Post[];
  getHypedPosts: () => Post[];
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

// Transform API response to Post format
function transformApiPost(apiPost: any): Post {
  const user: User = {
    id: apiPost.user_id,
    username: apiPost.username || 'usuario',
    displayName: apiPost.display_name || 'Usuário',
    avatar: apiPost.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
    bio: '',
    followersCount: 0,
    followingCount: 0,
    isFollowing: false,
  };

  let images: string[] = [];
  try {
    images = typeof apiPost.images === 'string' ? JSON.parse(apiPost.images) : (apiPost.images || []);
  } catch {
    images = [];
  }

  return {
    id: String(apiPost.id),
    user,
    type: apiPost.type || 'sale',
    title: apiPost.title || '',
    description: apiPost.description || '',
    price: apiPost.price,
    category: apiPost.category || 'roupas',
    condition: apiPost.condition || 'good',
    status: apiPost.status || 'available',
    images,
    hypeCount: apiPost.hypes_count || 0,
    isHyped: apiPost.is_hyped || false,
    createdAt: apiPost.created_at || new Date().toISOString(),
  };
}

export function PostsProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>(stubPosts);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hypedPostIds, setHypedPostIds] = useState<Set<string>>(new Set());

  // Fetch posts from API
  const fetchPosts = useCallback(async () => {
    try {
      const response = await fetch('/api/posts?status=available');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const transformed = data.map(transformApiPost);
          // Apply hype status
          const withHypeStatus = transformed.map(p => ({
            ...p,
            isHyped: hypedPostIds.has(p.id)
          }));
          setPosts(withHypeStatus);
        }
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      // Keep stub data on error
    }
  }, [hypedPostIds]);

  // Fetch trending posts
  const fetchTrendingPosts = useCallback(async () => {
    try {
      const response = await fetch('/api/posts/trending');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const transformed = data.map(transformApiPost);
          const withHypeStatus = transformed.map(p => ({
            ...p,
            isHyped: hypedPostIds.has(p.id)
          }));
          setTrendingPosts(withHypeStatus);
        }
      }
    } catch (err) {
      console.error('Failed to fetch trending:', err);
    }
  }, [hypedPostIds]);

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchPosts(), fetchTrendingPosts()]);
      setIsLoading(false);
    };
    init();
  }, []);

  const refreshPosts = useCallback(async () => {
    await Promise.all([fetchPosts(), fetchTrendingPosts()]);
  }, [fetchPosts, fetchTrendingPosts]);

  const addPost = useCallback(async (postData: Omit<Post, 'id' | 'user' | 'hypeCount' | 'isHyped' | 'createdAt' | 'status'>) => {
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: postData.title,
          description: postData.description,
          price: postData.price,
          type: postData.type,
          condition: postData.condition,
          category: postData.category,
          images: postData.images,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      // Refresh posts to get the new one
      await refreshPosts();
    } catch (err) {
      console.error('Failed to add post:', err);
      setError('Erro ao criar publicação');
      // Fallback to local add for demo
      const newPost: Post = {
        ...postData,
        id: Date.now().toString(),
        user: {
          id: authUser?.id || 'me',
          username: authUser?.google_user_data?.email?.split('@')[0] || 'voce',
          displayName: authUser?.google_user_data?.name || 'Você',
          avatar: authUser?.google_user_data?.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
          bio: '',
          followersCount: 0,
          followingCount: 0,
          isFollowing: false,
        },
        hypeCount: 0,
        isHyped: false,
        status: 'available',
        createdAt: new Date().toISOString(),
      };
      setPosts((prev) => [newPost, ...prev]);
    }
  }, [authUser, refreshPosts]);

  const updatePost = useCallback(async (id: string, updates: Partial<Post>) => {
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: updates.title,
          description: updates.description,
          price: updates.price,
          type: updates.type,
          condition: updates.condition,
          category: updates.category,
          status: updates.status,
          images: updates.images,
        }),
      });

      if (response.ok) {
        await refreshPosts();
      } else {
        throw new Error('Failed to update');
      }
    } catch (err) {
      console.error('Failed to update post:', err);
      // Fallback to local update
      setPosts((prev) =>
        prev.map((post) => (post.id === id ? { ...post, ...updates } : post))
      );
    }
  }, [refreshPosts]);

  const deletePost = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPosts((prev) => prev.filter((post) => post.id !== id));
        setTrendingPosts((prev) => prev.filter((post) => post.id !== id));
      } else {
        throw new Error('Failed to delete');
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
      // Fallback to local delete
      setPosts((prev) => prev.filter((post) => post.id !== id));
    }
  }, []);

  const toggleHype = useCallback(async (id: string) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === id) {
          const newIsHyped = !post.isHyped;
          if (newIsHyped) {
            setHypedPostIds(s => new Set([...s, id]));
          } else {
            setHypedPostIds(s => {
              const newSet = new Set(s);
              newSet.delete(id);
              return newSet;
            });
          }
          return {
            ...post,
            isHyped: newIsHyped,
            hypeCount: newIsHyped ? post.hypeCount + 1 : post.hypeCount - 1,
          };
        }
        return post;
      })
    );

    setTrendingPosts((prev) =>
      prev.map((post) => {
        if (post.id === id) {
          return {
            ...post,
            isHyped: !post.isHyped,
            hypeCount: !post.isHyped ? post.hypeCount + 1 : post.hypeCount - 1,
          };
        }
        return post;
      })
    );

    // API call
    try {
      await fetch(`/api/posts/${id}/hype`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to toggle hype:', err);
    }
  }, []);

  const markAsSold = useCallback(async (id: string) => {
    await updatePost(id, { status: 'sold' });
  }, [updatePost]);

  const markAsDonated = useCallback(async (id: string) => {
    await updatePost(id, { status: 'donated' });
  }, [updatePost]);

  const getPostsByUserId = useCallback((userId: string): Post[] => {
    const targetId = userId === 'me' ? authUser?.id : userId;
    return posts.filter(post => post.user.id === targetId || post.user.id === userId);
  }, [posts, authUser]);

  const getHypedPosts = useCallback((): Post[] => {
    return posts.filter(post => post.isHyped);
  }, [posts]);

  return (
    <PostsContext.Provider
      value={{
        posts,
        trendingPosts,
        isLoading,
        error,
        addPost,
        updatePost,
        deletePost,
        toggleHype,
        markAsSold,
        markAsDonated,
        refreshPosts,
        getPostsByUserId,
        getHypedPosts,
      }}
    >
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  const context = useContext(PostsContext);
  if (!context) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
}
