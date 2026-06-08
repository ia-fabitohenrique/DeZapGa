import { useNavigate } from 'react-router';
import { Avatar, AvatarFallback, AvatarImage } from '@/react-app/components/ui/avatar';
import { User } from '@/data/stubData';

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  showRing?: boolean;
  clickable?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

export function UserAvatar({ user, size = 'md', showRing = true, clickable = true }: UserAvatarProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (clickable && user.id !== 'me') {
      navigate(`/user/${user.id}`);
    } else if (clickable && user.id === 'me') {
      navigate('/profile');
    }
  };

  return (
    <Avatar
      className={`${sizeClasses[size]} ${showRing ? 'ring-2 ring-primary/20' : ''} ${
        clickable ? 'cursor-pointer hover:ring-primary/40 transition-all' : ''
      }`}
      onClick={clickable ? handleClick : undefined}
    >
      <AvatarImage src={user.avatar} alt={user.displayName} />
      <AvatarFallback>{user.displayName[0]}</AvatarFallback>
    </Avatar>
  );
}
