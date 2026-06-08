import { X, Lock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/react-app/components/ui/avatar';
import { User } from '@/data/stubData';
import { useNavigate } from 'react-router';

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: User[];
  isLocked?: boolean;
  lockedMessage?: string;
}

export function FollowListModal({ 
  isOpen, 
  onClose, 
  title, 
  users,
  isLocked = false,
  lockedMessage = 'Lista privada'
}: FollowListModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleUserClick = (userId: string) => {
    onClose();
    if (userId === 'me') {
      navigate('/profile');
    } else {
      navigate(`/user/${userId}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-background rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-display font-semibold text-lg">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 hover:bg-secondary rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLocked ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Lock size={28} className="text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">{lockedMessage}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <p className="text-muted-foreground">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserClick(user.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.displayName}</p>
                    <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                  </div>
                  {user.isFollowing && (
                    <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                      Seguindo
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
