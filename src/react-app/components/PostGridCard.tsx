import { Heart, Gift, Tag, MapPin } from 'lucide-react';
import { Badge } from '@/react-app/components/ui/badge';
import type { Post } from '@/data/stubData';

interface PostGridCardProps {
  post: Post;
}

export function PostGridCard({ post }: PostGridCardProps) {
  const isDonation = post.type === 'donation';

  return (
    <div className="group relative rounded-xl overflow-hidden bg-card border border-border/50 hover:border-primary/30 transition-all">
      {/* Image */}
      <div className="aspect-square relative overflow-hidden">
        <img
          src={post.images[0]}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <Badge
            className={`text-xs font-semibold ${
              isDonation
                ? 'bg-emerald-500/90 hover:bg-emerald-500'
                : 'bg-primary/90 hover:bg-primary'
            }`}
          >
            {isDonation ? <Gift size={10} className="mr-1" /> : <Tag size={10} className="mr-1" />}
            {isDonation ? 'Doação' : 'Venda'}
          </Badge>
        </div>

        {/* Hype count */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
          <Heart size={12} className={post.isHyped ? 'fill-red-500 text-red-500' : 'text-white'} />
          <span className="text-xs font-medium text-white">{post.hypeCount}</span>
        </div>

        {/* Status overlay */}
        {post.status !== 'available' && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Badge variant="secondary" className="text-xs font-bold">
              {post.status === 'sold' ? 'VENDIDO' : 'DOADO'}
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <h3 className="font-medium text-sm truncate">{post.title}</h3>
        
        <div className="flex items-center justify-between mt-1">
          {post.type === 'sale' && post.price ? (
            <span className="font-bold text-primary text-sm">
              R$ {post.price.toLocaleString('pt-BR')}
            </span>
          ) : (
            <span className="text-emerald-500 font-semibold text-xs">Grátis</span>
          )}
          
          {post.location?.city && (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5 truncate max-w-[50%]">
              <MapPin size={10} />
              {post.location.city}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
