import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useAuth } from '@getmocha/users-service/react';
import { User, UserLocation, stubUsers } from '@/data/stubData';

export interface CurrentUserData extends User {
  email: string;
  phone: string;
  location: UserLocation;
}

const defaultCurrentUser: CurrentUserData = {
  id: 'me',
  username: 'voce',
  displayName: 'Você',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
  bio: 'Desapegando com consciência ✨',
  email: '',
  phone: '',
  location: { state: '', city: '', neighborhood: '' },
  followersCount: 0,
  followingCount: 0,
  isFollowing: false,
};

interface UsersContextType {
  users: User[];
  currentUser: CurrentUserData;
  isLoading: boolean;
  toggleFollow: (userId: string) => Promise<void>;
  getUserById: (userId: string) => User | undefined;
  getFollowingUsers: () => User[];
  getFollowersOfUser: (userId: string) => Promise<User[]>;
  getFollowingOfUser: (userId: string) => Promise<User[]>;
  getFollowersCount: (userId: string) => number;
  updateCurrentUser: (updates: Partial<CurrentUserData>) => Promise<void>;
  isUserFollowingMe: (userId: string) => boolean;
  areMutualFollowers: (userId: string) => boolean;
  fetchUserProfile: (userId: string) => Promise<User | null>;
  checkFollowStatus: (userId: string) => Promise<boolean>;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

// Transform API profile to User format
function transformApiProfile(profile: any): User {
  return {
    id: profile.user_id,
    username: profile.username || 'usuario',
    displayName: profile.display_name || 'Usuário',
    avatar: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
    bio: profile.bio || '',
    followersCount: profile.followers_count || 0,
    followingCount: profile.following_count || 0,
    isFollowing: profile.is_following || false,
  };
}

export function UsersProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth();
  const [baseUsers, setBaseUsers] = useState<User[]>(stubUsers);
  const [currentUser, setCurrentUser] = useState<CurrentUserData>(defaultCurrentUser);
  const [isLoading] = useState(false);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());

  // Compute users with correct isFollowing status based on followingSet
  const users = useMemo(() => {
    return baseUsers.map(user => ({
      ...user,
      isFollowing: followingSet.has(user.id),
    }));
  }, [baseUsers, followingSet]);

  // Fetch the list of users the current user is following
  const fetchMyFollowing = useCallback(async () => {
    if (!authUser) return;
    
    try {
      const response = await fetch('/api/follows/my-following');
      if (response.ok) {
        const data = await response.json();
        if (data.followingIds && Array.isArray(data.followingIds)) {
          setFollowingSet(new Set(data.followingIds));
        }
      }
    } catch (err) {
      console.error('Failed to fetch following list:', err);
    }
  }, [authUser]);

  // Fetch current user profile from API
  const fetchCurrentUserProfile = useCallback(async () => {
    if (!authUser) return;
    
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const profile = await response.json();
        setCurrentUser({
          id: authUser.id,
          username: profile.username || authUser.email?.split('@')[0] || 'usuario',
          displayName: profile.display_name || authUser.google_user_data?.name || 'Usuário',
          avatar: profile.avatar_url || authUser.google_user_data?.picture || defaultCurrentUser.avatar,
          bio: profile.bio || '',
          email: authUser.email || '',
          phone: profile.phone || '',
          location: {
            state: profile.location_state || '',
            city: profile.location_city || '',
            neighborhood: profile.location_neighborhood || '',
          },
          followersCount: profile.followers_count || 0,
          followingCount: profile.following_count || 0,
          isFollowing: false,
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  }, [authUser]);

  // Sync current user with authenticated user
  useEffect(() => {
    if (authUser) {
      const googleData = authUser.google_user_data;
      setCurrentUser(prev => ({
        ...prev,
        id: authUser.id,
        displayName: googleData.name || googleData.given_name || 'Usuário',
        username: googleData.email?.split('@')[0] || 'usuario',
        avatar: googleData.picture || prev.avatar,
        email: authUser.email,
      }));
      fetchCurrentUserProfile();
      fetchMyFollowing();
    } else {
      setCurrentUser(defaultCurrentUser);
      setFollowingSet(new Set());
    }
  }, [authUser, fetchCurrentUserProfile, fetchMyFollowing]);

  // Fetch user profile from API
  const fetchUserProfile = useCallback(async (userId: string): Promise<User | null> => {
    try {
      const response = await fetch(`/api/users/${userId}/profile`);
      if (response.ok) {
        const profile = await response.json();
        const user = transformApiProfile(profile);
        
        // Check follow status if logged in
        if (authUser) {
          const isFollowing = followingSet.has(userId);
          user.isFollowing = isFollowing;
        }
        
        return user;
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
    
    // Fallback to stub users
    return users.find(u => u.id === userId) || null;
  }, [authUser, users, followingSet]);

  // Check follow status
  const checkFollowStatus = useCallback(async (userId: string): Promise<boolean> => {
    if (!authUser) return false;
    
    try {
      const response = await fetch(`/api/follows/${userId}/status`);
      if (response.ok) {
        const data = await response.json();
        if (data.following) {
          setFollowingSet(prev => new Set([...prev, userId]));
        }
        return data.following;
      }
    } catch (err) {
      console.error('Failed to check follow status:', err);
    }
    return false;
  }, [authUser]);

  const toggleFollow = useCallback(async (userId: string) => {
    const isCurrentlyFollowing = followingSet.has(userId);
    
    // Optimistic update
    setFollowingSet(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyFollowing) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });

    setBaseUsers((prev) =>
      prev.map((user) => {
        if (user.id === userId) {
          return {
            ...user,
            followersCount: isCurrentlyFollowing
              ? user.followersCount - 1
              : user.followersCount + 1,
          };
        }
        return user;
      })
    );

    setCurrentUser((prev) => ({
      ...prev,
      followingCount: isCurrentlyFollowing
        ? prev.followingCount - 1
        : prev.followingCount + 1,
    }));

    // API call
    try {
      const method = isCurrentlyFollowing ? 'DELETE' : 'POST';
      await fetch(`/api/follows/${userId}`, { method });
    } catch (err) {
      console.error('Failed to toggle follow:', err);
      // Revert on error
      setFollowingSet(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyFollowing) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    }
  }, [followingSet]);

  const getUserById = useCallback((userId: string): User | undefined => {
    if (userId === 'me' || userId === authUser?.id) {
      return currentUser;
    }
    const user = users.find((user) => user.id === userId);
    if (user) {
      return { ...user, isFollowing: followingSet.has(userId) };
    }
    return undefined;
  }, [users, currentUser, authUser, followingSet]);

  const getFollowingUsers = useCallback((): User[] => {
    return users.filter((user) => followingSet.has(user.id));
  }, [users, followingSet]);

  const getFollowersOfUser = useCallback(async (userId: string): Promise<User[]> => {
    const targetId = userId === 'me' ? authUser?.id : userId;
    if (!targetId) return users.slice(0, 3);

    try {
      const response = await fetch(`/api/users/${targetId}/followers`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map(transformApiProfile);
        }
      }
    } catch (err) {
      console.error('Failed to fetch followers:', err);
    }
    
    // Fallback
    return users.slice(0, 3);
  }, [authUser, users]);

  const getFollowingOfUser = useCallback(async (userId: string): Promise<User[]> => {
    const targetId = userId === 'me' ? authUser?.id : userId;
    if (!targetId) return getFollowingUsers();

    try {
      const response = await fetch(`/api/users/${targetId}/following`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map(transformApiProfile);
        }
      }
    } catch (err) {
      console.error('Failed to fetch following:', err);
    }
    
    // Fallback
    return getFollowingUsers();
  }, [authUser, getFollowingUsers]);

  const isUserFollowingMe = useCallback((userId: string): boolean => {
    // This would need a separate API call in production
    // For now, assume mutual following
    return followingSet.has(userId);
  }, [followingSet]);

  const areMutualFollowers = useCallback((userId: string): boolean => {
    return followingSet.has(userId) && isUserFollowingMe(userId);
  }, [followingSet, isUserFollowingMe]);

  const getFollowersCount = useCallback((userId: string): number => {
    if (userId === 'me' || userId === authUser?.id) {
      return currentUser.followersCount;
    }
    const user = users.find((u) => u.id === userId);
    return user?.followersCount ?? 0;
  }, [users, currentUser, authUser]);

  const updateCurrentUser = useCallback(async (updates: Partial<CurrentUserData>) => {
    // Optimistic update
    setCurrentUser((prev) => ({ ...prev, ...updates }));

    // API call
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: updates.username,
          display_name: updates.displayName,
          bio: updates.bio,
          avatar_url: updates.avatar,
          phone: updates.phone,
          location_state: updates.location?.state,
          location_city: updates.location?.city,
          location_neighborhood: updates.location?.neighborhood,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  }, []);

  return (
    <UsersContext.Provider
      value={{
        users,
        currentUser,
        isLoading,
        toggleFollow,
        getUserById,
        getFollowingUsers,
        getFollowersOfUser,
        getFollowingOfUser,
        getFollowersCount,
        updateCurrentUser,
        isUserFollowingMe,
        areMutualFollowers,
        fetchUserProfile,
        checkFollowStatus,
      }}
    >
      {children}
    </UsersContext.Provider>
  );
}

export function useUsers() {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error('useUsers must be used within a UsersProvider');
  }
  return context;
}
