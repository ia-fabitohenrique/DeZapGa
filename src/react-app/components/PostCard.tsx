import { useState } from 'react';
import { Flame, MessageCircle, Share2, MapPin, Check } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Badge } from '@/react-app/components/ui/badge';
import { PostOptionsMenu } from '@/react-app/components/PostOptionsMenu';
import { CreatePostModal } from '@/react-app/components/CreatePostModal';
import { LoginPromptModal } from '@/react-app/components/LoginPromptModal';
import { UserAvatar } from '@/react-app/components/UserAvatar';
import type { Post } from '@/data/stubData';
import { conditionLabels } from '@/data/stubData';
import { usePosts } from '@/react-app/hooks/usePosts';
import { useAuth } from '@getmocha/users-service/react';

interface PostCardProps {
  post: Post;
  compact?: boolean;
}

export function PostCard({ post, compact = false }: PostCardProps) {
  const { toggleHype } = usePosts();
  const { user } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginPromptAction, setLoginPromptAction] = useState<'hype' | 'chat'>('hype');
  const [showCopied, setShowCopied] = useState(false);
  const navigate = useNavigate();

  const handleHype = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) {
      setLoginPromptAction('hype');
      setShowLoginPrompt(true);
      return;
    }
    toggleHype(post.id);
  };

  const handleChat = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) {
      setLoginPromptAction('chat');
      setShowLoginPrompt(true);
      return;
    }
    navigate(`/chat/${post.id}`);
  };

  const handleShare = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const postUrl = `${window.location.origin}/post/${post.id}`;
    const shareData = {
      title: post.title,
      text: post.type === 'donation' 
        ? `Confira esta doação no DeZapGa: ${post.title}` 
        : `Confira este anúncio no DeZapGa: ${post.title} - R$ ${post.price?.toLocaleString('pt-BR')}`,
      url: postUrl,
    };

    // Try native share API first (mobile devices)
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // User cancelled or share failed, fall back to clipboard
        if ((err as Error).name === 'AbortError') return;
      }
    }

    // Fallback: copy link to clipboard
    try {
      await navigator.clipboard.writeText(postUrl);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const timeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'agora';
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    return `${Math.floor(diffInDays / 7)}sem`;
  };

  // Compact card for grid view
  if (compact) {
    return (
      <>
        <article 
          onClick={handleChat}
          className="relative bg-card rounded-xl overflow-hidden border border-border/50 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
        >
          <div className="relative aspect-square bg-secondary">
            <img
              src={post.images[0]}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            {post.status !== 'available' && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white font-display font-bold text-sm uppercase tracking-wider">
                  {post.status === 'sold' ? 'Vendido' : 'Doado'}
                </span>
              </div>
            )}
            <Badge
              variant="secondary"
              className={`absolute top-2 left-2 text-[10px] font-semibold ${
                post.type === 'donation'
                  ? 'bg-donation/90 text-white'
                  : 'bg-sale/90 text-white'
              }`}
            >
              {post.type === 'donation' ? 'Doação' : 'Venda'}
            </Badge>
          </div>
          <div className="p-2 space-y-1">
            <h3 className="font-semibold text-xs truncate">{post.title}</h3>
            <div className="flex items-center justify-between">
              {post.price ? (
                <span className="text-primary font-bold text-sm">
                  R$ {post.price.toLocaleString('pt-BR')}
                </span>
              ) : (
                <span className="text-donation font-semibold text-xs">Grátis</span>
              )}
              <div className="flex items-center gap-1 text-muted-foreground">
                <Flame size={12} fill={post.isHyped ? 'currentColor' : 'none'} className={post.isHyped ? 'text-hype' : ''} />
                <span className="text-[10px]">{post.hypeCount}</span>
              </div>
            </div>
          </div>
        </article>
        <CreatePostModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          editPost={post}
        />
        <LoginPromptModal
          open={showLoginPrompt}
          onOpenChange={setShowLoginPrompt}
          title={loginPromptAction === 'hype' ? 'Entre para dar Hype' : 'Entre para conversar'}
          description={loginPromptAction === 'hype' 
            ? 'Faça login para curtir e apoiar este anúncio.'
            : 'Faça login para enviar mensagens ao vendedor.'
          }
        />
      </>
    );
  }

  // Full card for feed view
  return (
    <>
      <article className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-lg shadow-black/5">
        {/* Header */}
        <div className="flex items-center gap-3 p-4">
          <UserAvatar user={post.user} size="md" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{post.user.displayName}</p>
            <p className="text-xs text-muted-foreground">@{post.user.username} · {timeAgo(post.createdAt)}</p>
          </div>
          <Badge
            variant="secondary"
            className={`text-xs font-semibold ${
              post.type === 'donation'
                ? 'bg-donation/15 text-donation border-donation/30'
                : 'bg-sale/15 text-sale border-sale/30'
            }`}
          >
            {post.type === 'donation' ? 'Doação' : 'Venda'}
          </Badge>
          <PostOptionsMenu post={post} onEdit={() => setShowEditModal(true)} />
        </div>

        {/* Image */}
        <div className="relative aspect-square bg-secondary">
          <img
            src={post.images[0]}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          {post.status !== 'available' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-display font-bold text-2xl uppercase tracking-wider">
                {post.status === 'sold' ? 'Vendido' : 'Doado'}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-4">
            <button
              onClick={handleHype}
              className={`flex items-center gap-1.5 transition-all duration-200 ${
                post.isHyped ? 'text-hype' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Flame
                size={24}
                fill={post.isHyped ? 'currentColor' : 'none'}
                className={post.isHyped ? 'animate-[pulse_0.3s_ease-in-out]' : ''}
              />
              <span className="text-sm font-semibold">{post.hypeCount}</span>
            </button>
            <button 
              onClick={handleChat}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageCircle size={22} />
              <span className="text-sm">Chat</span>
            </button>
            <button 
              onClick={handleShare}
              className="ml-auto text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              {showCopied ? (
                <>
                  <Check size={20} className="text-green-500" />
                  <span className="text-xs text-green-500">Copiado!</span>
                </>
              ) : (
                <Share2 size={20} />
              )}
            </button>
          </div>

          {/* Content */}
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <h3 className="font-display font-semibold text-base">{post.title}</h3>
              {post.price && (
                <span className="text-primary font-bold text-lg">
                  R$ {post.price.toLocaleString('pt-BR')}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{post.description}</p>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs capitalize">
              {post.category}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {conditionLabels[post.condition]}
            </Badge>
            {post.location && (post.location.city || post.location.neighborhood) && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <MapPin size={10} />
                {post.location.neighborhood ? `${post.location.neighborhood}, ` : ''}
                {post.location.city}
                {post.location.state ? ` - ${post.location.state}` : ''}
              </Badge>
            )}
          </div>
        </div>
      </article>

      {/* Edit Modal */}
      <CreatePostModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        editPost={post}
      />
      
      {/* Login Prompt */}
      <LoginPromptModal
        open={showLoginPrompt}
        onOpenChange={setShowLoginPrompt}
        title={loginPromptAction === 'hype' ? 'Entre para dar Hype' : 'Entre para conversar'}
        description={loginPromptAction === 'hype' 
          ? 'Faça login para curtir e apoiar este anúncio.'
          : 'Faça login para enviar mensagens ao vendedor.'
        }
      />
    </>
  );
}
