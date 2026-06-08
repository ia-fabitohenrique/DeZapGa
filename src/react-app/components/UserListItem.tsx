import { useNavigate } from 'react-router';
import { UserPlus, UserMinus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/react-app/components/ui/avatar';
import { Button } from '@/react-app/components/ui/button';
import { User } from '@/data/stubData';
import { useUsers } from '@/react-app/hooks/useUsers';

interface UserListItemProps {
  user: User;
  showFollowButton?: boolean;
}

export function UserListItem({ user, showFollowButton = true }: UserListItemProps) {
  const navigate = useNavigate();
  const { toggleFollow } = useUsers();

  const handleClick = () => {
    if (user.id === 'me') {
      navigate('/profile');
    } else {
      navigate(`/user/${user.id}`);
    }
  };

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFollow(user.id);
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-3 p-3 hover:bg-secondary/50 rounded-xl cursor-pointer transition-colors"
    >
      <Avatar className="h-12 w-12 ring-2 ring-primary/20">
        <AvatarImage src={user.avatar} alt={user.displayName} />
        <AvatarFallback>{user.displayName[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{user.displayName}</p>
        <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{user.bio}</p>
      </div>
      {showFollowButton && user.id !== 'me' && (
        <Button
          onClick={handleFollowClick}
          size="sm"
          variant={user.isFollowing ? 'outline' : 'default'}
          className={!user.isFollowing ? 'bg-primary hover:bg-primary/90' : ''}
        >
          {user.isFollowing ? (
            <UserMinus size={16} />
          ) : (
            <UserPlus size={16} />
          )}
        </Button>
      )}
    </div>
  );
}
