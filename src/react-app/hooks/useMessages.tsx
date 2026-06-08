import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useAuth } from '@getmocha/users-service/react';
import { Post, User, stubUsers, stubPosts, PostType, Condition, Category, PostStatus } from '@/data/stubData';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  post: Post;
  otherUser: User;
  messages: Message[];
  lastMessageAt: string;
  unreadCount?: number;
  lastMessage?: string;
}

interface MessagesContextType {
  conversations: Conversation[];
  isLoading: boolean;
  getConversation: (id: string) => Conversation | undefined;
  getConversationByPostAndUser: (postId: string, userId: string) => Conversation | undefined;
  sendMessage: (conversationId: string, text: string) => Promise<void>;
  startConversation: (postId: string, initialMessage?: string) => Promise<Conversation>;
  markAsRead: (conversationId: string) => Promise<void>;
  getUnreadCount: () => number;
  fetchConversations: () => Promise<void>;
  fetchConversationMessages: (conversationId: string) => Promise<void>;
}

// Stub conversations for fallback
const initialConversations: Conversation[] = [
  {
    id: 'conv-1',
    post: stubPosts[0],
    otherUser: stubUsers[0],
    lastMessageAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    messages: [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'me',
        text: 'Olá! Vi o vestido e achei lindo. Ainda está disponível?',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        isRead: true,
      },
      {
        id: 'msg-2',
        conversationId: 'conv-1',
        senderId: '1',
        text: 'Olá! Sim, ainda está disponível! 😊',
        createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        isRead: true,
      },
      {
        id: 'msg-3',
        conversationId: 'conv-1',
        senderId: 'me',
        text: 'Que ótimo! Qual o tamanho?',
        createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        isRead: true,
      },
      {
        id: 'msg-4',
        conversationId: 'conv-1',
        senderId: '1',
        text: 'É tamanho M. Posso enviar mais fotos se quiser!',
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        isRead: false,
      },
    ],
  },
  {
    id: 'conv-2',
    post: stubPosts[1],
    otherUser: stubUsers[1],
    lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    messages: [
      {
        id: 'msg-5',
        conversationId: 'conv-2',
        senderId: '2',
        text: 'Oi! Vi que você se interessou pelo iPhone. Alguma dúvida?',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        isRead: true,
      },
      {
        id: 'msg-6',
        conversationId: 'conv-2',
        senderId: 'me',
        text: 'Sim! A bateria está em bom estado?',
        createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
        isRead: true,
      },
      {
        id: 'msg-7',
        conversationId: 'conv-2',
        senderId: '2',
        text: 'Perfeita! 92% de saúde da bateria. Tenho a nota fiscal também.',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        isRead: true,
      },
    ],
  },
  {
    id: 'conv-3',
    post: stubPosts[4],
    otherUser: stubUsers[0],
    lastMessageAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    messages: [
      {
        id: 'msg-8',
        conversationId: 'conv-3',
        senderId: 'me',
        text: 'A bolsa ainda está disponível?',
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
        isRead: true,
      },
      {
        id: 'msg-9',
        conversationId: 'conv-3',
        senderId: '1',
        text: 'Sim! Está sim. Você gostaria de ver pessoalmente?',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        isRead: true,
      },
    ],
  },
];

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

// Transform API conversation to local format
function transformApiConversation(conv: any, currentUserId: string): Conversation | null {
  // Determine other user (seller or buyer, whichever is not us)
  const isBuyer = conv.buyer_user_id === currentUserId;
  const otherUser: User = {
    id: isBuyer ? conv.seller_user_id : conv.buyer_user_id,
    username: isBuyer ? (conv.seller_name || '').toLowerCase().replace(/\s/g, '') : (conv.buyer_name || '').toLowerCase().replace(/\s/g, ''),
    displayName: isBuyer ? (conv.seller_name || 'Vendedor') : (conv.buyer_name || 'Comprador'),
    avatar: isBuyer 
      ? (conv.seller_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face')
      : (conv.buyer_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'),
    bio: '',
    followersCount: 0,
    followingCount: 0,
    isFollowing: false,
  };

  // Parse images from JSON string if needed
  let images: string[] = ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'];
  if (conv.post_images) {
    try {
      const parsed = typeof conv.post_images === 'string' ? JSON.parse(conv.post_images) : conv.post_images;
      if (Array.isArray(parsed) && parsed.length > 0) {
        images = parsed;
      }
    } catch {
      // Use default
    }
  }

  // Build post object
  const post: Post = {
    id: String(conv.post_id || '1'),
    title: conv.post_title || 'Item',
    description: '',
    images,
    price: conv.post_price || 0,
    type: (conv.post_type as PostType) || 'sale',
    condition: 'good' as Condition,
    category: 'roupas' as Category,
    status: 'available' as PostStatus,
    user: otherUser,
    hypeCount: 0,
    isHyped: false,
    createdAt: conv.created_at || new Date().toISOString(),
  };

  return {
    id: String(conv.id),
    post,
    otherUser,
    messages: [],
    lastMessageAt: conv.last_message_at || conv.updated_at || new Date().toISOString(),
    unreadCount: conv.unread_count || 0,
    lastMessage: conv.last_message || '',
  };
}

function transformApiMessage(msg: any, conversationId: string): Message {
  return {
    id: String(msg.id),
    conversationId,
    senderId: msg.sender_id,
    text: msg.content || '',
    createdAt: msg.created_at || new Date().toISOString(),
    isRead: msg.is_read === 1 || msg.is_read === true,
  };
}

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth();
  const currentUserId = authUser?.id || 'me';
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all conversations from API
  const fetchConversations = useCallback(async () => {
    if (!authUser) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const transformed = data
            .map(c => transformApiConversation(c, currentUserId))
            .filter((c): c is Conversation => c !== null);
          if (transformed.length > 0) {
            setConversations(transformed);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [authUser, currentUserId]);

  // Fetch messages for a specific conversation
  const fetchConversationMessages = useCallback(async (conversationId: string) => {
    if (!authUser) return;

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        // API returns { conversation, messages }
        const messagesArray = data.messages || data;
        if (Array.isArray(messagesArray)) {
          const messages = messagesArray.map((m: any) => transformApiMessage(m, conversationId));
          setConversations(prev => prev.map(conv => {
            if (conv.id === conversationId) {
              return { ...conv, messages, unreadCount: 0 };
            }
            return conv;
          }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  }, [authUser]);

  // Load conversations on mount when authenticated
  useEffect(() => {
    if (authUser) {
      fetchConversations();
    }
  }, [authUser, fetchConversations]);

  const getConversation = useCallback((id: string) => {
    return conversations.find(c => c.id === id);
  }, [conversations]);

  const getConversationByPostAndUser = useCallback((postId: string, userId: string) => {
    return conversations.find(c => c.post.id === postId && c.otherUser.id === userId);
  }, [conversations]);

  const sendMessage = useCallback(async (conversationId: string, text: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: currentUserId,
      text,
      createdAt: new Date().toISOString(),
      isRead: true,
    };

    // Optimistic update
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          messages: [...conv.messages, newMessage],
          lastMessageAt: newMessage.createdAt,
        };
      }
      return conv;
    }));

    // API call
    try {
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  }, [currentUserId]);

  const startConversation = useCallback(async (postId: string, initialMessage?: string): Promise<Conversation> => {
    // Check if conversation already exists for this post
    const existing = conversations.find(c => c.post.id === postId);
    if (existing) return existing;

    // Try to create via API
    try {
      const response = await fetch(`/api/posts/${postId}/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: initialMessage }),
      });

      if (response.ok) {
        const data = await response.json();
        // API returns { conversation_id } for new conversations
        const conversationId = data.conversation_id || data.id;
        if (conversationId) {
          // Create a minimal conversation object - we'll fetch full details later
          const post = stubPosts.find(p => p.id === postId);
          const newConv: Conversation = {
            id: String(conversationId),
            post: post || {
              id: postId,
              title: 'Item',
              description: '',
              images: [],
              price: 0,
              type: 'sale' as PostType,
              condition: 'good' as Condition,
              category: 'roupas' as Category,
              status: 'available' as PostStatus,
              user: stubUsers[0],
              hypeCount: 0,
              isHyped: false,
              createdAt: new Date().toISOString(),
            },
            otherUser: post?.user || stubUsers[0],
            messages: initialMessage ? [{
              id: `msg-${Date.now()}`,
              conversationId: String(conversationId),
              senderId: currentUserId,
              text: initialMessage,
              createdAt: new Date().toISOString(),
              isRead: true,
            }] : [],
            lastMessageAt: new Date().toISOString(),
          };
          setConversations(prev => [newConv, ...prev]);
          
          // Send initial message if provided
          if (initialMessage) {
            await fetch(`/api/conversations/${conversationId}/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: initialMessage }),
            });
          }
          
          return newConv;
        }
      }
    } catch (err) {
      console.error('Failed to start conversation:', err);
    }

    // Fallback: create locally with stub data
    const post = stubPosts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');

    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      post,
      otherUser: post.user,
      lastMessageAt: new Date().toISOString(),
      messages: initialMessage ? [{
        id: `msg-${Date.now()}`,
        conversationId: `conv-${Date.now()}`,
        senderId: currentUserId,
        text: initialMessage,
        createdAt: new Date().toISOString(),
        isRead: true,
      }] : [],
    };

    setConversations(prev => [newConversation, ...prev]);
    return newConversation;
  }, [conversations, currentUserId]);

  const markAsRead = useCallback(async (conversationId: string) => {
    // API call first - mark all unread messages as read in database
    try {
      await fetch(`/api/conversations/${conversationId}/read`, {
        method: 'PUT',
      });
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }

    // Update local state
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          unreadCount: 0,
          messages: conv.messages.map(msg => ({ ...msg, isRead: true })),
        };
      }
      return conv;
    }));
  }, []);

  const getUnreadCount = useCallback(() => {
    return conversations.reduce((count, conv) => {
      // Use unreadCount from API if available, otherwise check messages
      if (conv.unreadCount !== undefined && conv.unreadCount > 0) {
        return count + 1;
      }
      const unread = conv.messages.filter(m => !m.isRead && m.senderId !== currentUserId).length;
      return count + (unread > 0 ? 1 : 0);
    }, 0);
  }, [conversations, currentUserId]);

  return (
    <MessagesContext.Provider value={{
      conversations,
      isLoading,
      getConversation,
      getConversationByPostAndUser,
      sendMessage,
      startConversation,
      markAsRead,
      getUnreadCount,
      fetchConversations,
      fetchConversationMessages,
    }}>
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error('useMessages must be used within MessagesProvider');
  }
  return context;
}

export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
