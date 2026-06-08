import { useEffect, useRef, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Send, ImageIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/react-app/components/ui/avatar';
import { Button } from '@/react-app/components/ui/button';
import { useMessages, formatMessageTime, Conversation } from '@/react-app/hooks/useMessages';
import { usePosts } from '@/react-app/hooks/usePosts';

export default function ChatPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { getConversation, sendMessage, markAsRead, startConversation, conversations } = useMessages();
  const { posts } = usePosts();
  const [newMessage, setNewMessage] = useState('');
  const [localConversation, setLocalConversation] = useState<Conversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Find conversation by conversation ID or by post ID
  const conversation = useMemo(() => {
    // First, check if localConversation exists (for newly created ones)
    if (localConversation) return localConversation;
    
    // Try to find by conversation ID
    const byConvId = getConversation(conversationId || '');
    if (byConvId) return byConvId;

    // Try to find by post ID (when coming from a post's chat button)
    const byPostId = conversations.find(c => c.post.id === conversationId);
    if (byPostId) return byPostId;

    return null;
  }, [conversationId, getConversation, conversations, localConversation]);

  // Get the post if we're starting a new conversation
  const post = useMemo(() => {
    if (conversation) return conversation.post;
    return posts.find(p => p.id === conversationId);
  }, [conversation, posts, conversationId]);

  useEffect(() => {
    if (conversation) {
      markAsRead(conversation.id);
    }
  }, [conversation?.id, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  // Update local conversation when conversations change
  useEffect(() => {
    if (localConversation) {
      const updated = conversations.find(c => c.id === localConversation.id);
      if (updated) {
        setLocalConversation(updated);
      }
    }
  }, [conversations, localConversation]);

  // No conversation and no post found
  if (!conversation && !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground text-center">Conversa não encontrada</p>
        <Button variant="outline" onClick={() => navigate('/messages')}>
          Voltar para mensagens
        </Button>
      </div>
    );
  }

  const handleSend = () => {
    if (!newMessage.trim()) return;

    if (conversation) {
      // Send to existing conversation
      sendMessage(conversation.id, newMessage.trim());
    } else if (post) {
      // Start new conversation with this post
      startConversation(post.id, newMessage.trim()).then(newConv => {
        setLocalConversation(newConv);
      });
    }
    setNewMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Determine user to show (from conversation or from post owner)
  const otherUser = conversation?.otherUser || post?.user;
  const displayPost = conversation?.post || post;

  if (!otherUser || !displayPost) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground text-center">Erro ao carregar conversa</p>
        <Button variant="outline" onClick={() => navigate('/messages')}>
          Voltar para mensagens
        </Button>
      </div>
    );
  }

  const messages = conversation?.messages || [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 py-3">
          <button 
            onClick={() => navigate('/messages')}
            className="p-1 -ml-1 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          
          <button 
            onClick={() => navigate(`/user/${otherUser.id}`)}
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser.avatar} />
              <AvatarFallback>{otherUser.displayName[0]}</AvatarFallback>
            </Avatar>
            <div className="text-left min-w-0">
              <p className="font-semibold text-sm truncate">{otherUser.displayName}</p>
              <p className="text-xs text-muted-foreground truncate">@{otherUser.username}</p>
            </div>
          </button>
        </div>
      </header>

      {/* Product Banner */}
      <div className="bg-secondary/50 border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-2">
          <button 
            className="flex items-center gap-3 w-full text-left"
            onClick={() => {/* TODO: Open post modal */}}
          >
            <img 
              src={displayPost.images[0]} 
              alt={displayPost.title}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayPost.title}</p>
              <p className="text-xs text-muted-foreground">
                {displayPost.type === 'donation' ? (
                  <span className="text-emerald-500">Doação</span>
                ) : (
                  <span className="text-primary">R$ {displayPost.price?.toLocaleString('pt-BR')}</span>
                )}
                {' · '}
                {displayPost.status === 'available' ? 'Disponível' : 
                 displayPost.status === 'sold' ? 'Vendido' : 'Doado'}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">
                Inicie uma conversa sobre este item
              </p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const isMe = message.senderId === 'me';
                const showAvatar = !isMe && (
                  index === 0 || 
                  messages[index - 1]?.senderId !== message.senderId
                );
                const showTime = 
                  index === messages.length - 1 ||
                  messages[index + 1]?.senderId !== message.senderId;

                return (
                  <div 
                    key={message.id}
                    className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMe && (
                      <div className="w-8 flex-shrink-0">
                        {showAvatar && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={otherUser.avatar} />
                            <AvatarFallback>{otherUser.displayName[0]}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )}
                    <div className={`max-w-[75%] ${isMe ? 'order-first' : ''}`}>
                      <div 
                        className={`px-4 py-2 rounded-2xl ${
                          isMe 
                            ? 'bg-primary text-primary-foreground rounded-br-md' 
                            : 'bg-secondary rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                      </div>
                      {showTime && (
                        <p className={`text-[10px] text-muted-foreground mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                          {formatMessageTime(message.createdAt)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </main>

      {/* Input */}
      <footer className="sticky bottom-0 bg-background border-t border-border pb-20">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-end gap-2">
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <ImageIcon size={24} />
            </button>
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                rows={1}
                className="w-full px-4 py-2.5 bg-secondary rounded-2xl resize-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 max-h-32"
                style={{ minHeight: '42px' }}
              />
            </div>
            <Button 
              size="icon"
              onClick={handleSend}
              disabled={!newMessage.trim()}
              className="rounded-full h-10 w-10 flex-shrink-0"
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
