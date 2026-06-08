import { useNavigate } from 'react-router';
import { Header } from '@/react-app/components/Header';
import { Avatar, AvatarFallback, AvatarImage } from '@/react-app/components/ui/avatar';
import { MessageCircle } from 'lucide-react';
import { useMessages, formatMessageTime } from '@/react-app/hooks/useMessages';
import { useAuth } from '@getmocha/users-service/react';
import { Button } from '@/react-app/components/ui/button';

export default function MessagesPage() {
  const navigate = useNavigate();
  const { conversations } = useMessages();
  const { user, redirectToLogin, isPending } = useAuth();

  // Show login prompt if not authenticated
  if (!isPending && !user) {
    return (
      <div className="min-h-screen pb-20">
        <Header title="Mensagens" />
        <div className="max-w-lg mx-auto text-center py-16 px-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-orange-500/20 flex items-center justify-center">
            <span className="text-4xl">🔐</span>
          </div>
          <h2 className="font-display text-xl font-semibold mb-2">Entre para ver suas mensagens</h2>
          <p className="text-muted-foreground mb-6">
            Faça login para acessar suas conversas e negociar com outros usuários.
          </p>
          <Button
            onClick={redirectToLogin}
            className="bg-white text-gray-800 hover:bg-gray-100"
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
    );
  }

  // Sort by most recent message
  const sortedConversations = [...conversations].sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );

  return (
    <div className="min-h-screen pb-20">
      <Header title="Mensagens" />
      
      <main className="max-w-lg mx-auto">
        {sortedConversations.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              <MessageCircle className="text-muted-foreground" size={28} />
            </div>
            <p className="text-muted-foreground">
              Suas conversas aparecerão aqui.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Inicie uma conversa a partir de um produto.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sortedConversations.map((conversation) => {
              const lastMessage = conversation.messages[conversation.messages.length - 1];
              const hasUnread = conversation.messages.some(
                m => !m.isRead && m.senderId !== 'me'
              );

              return (
                <button
                  key={conversation.id}
                  onClick={() => navigate(`/chat/${conversation.id}`)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors text-left"
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conversation.otherUser.avatar} />
                      <AvatarFallback>{conversation.otherUser.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <img
                      src={conversation.post.images[0]}
                      alt=""
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded object-cover ring-2 ring-background"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`font-semibold text-sm truncate ${hasUnread ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {conversation.otherUser.displayName}
                      </p>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatMessageTime(conversation.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-xs text-primary truncate mb-0.5">
                      {conversation.post.title}
                    </p>
                    {lastMessage && (
                      <p className={`text-sm truncate ${hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {lastMessage.senderId === 'me' ? 'Você: ' : ''}{lastMessage.text}
                      </p>
                    )}
                  </div>
                  {hasUnread && (
                    <span className="w-2.5 h-2.5 bg-primary rounded-full flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
