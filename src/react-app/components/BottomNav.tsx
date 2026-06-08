import { NavLink } from 'react-router';
import { Home, Flame, Search, MessageCircle, User } from 'lucide-react';
import { useMessages } from '@/react-app/hooks/useMessages';

const navItems = [
  { to: '/', icon: Home, label: 'Feed', key: 'home' },
  { to: '/hypes', icon: Flame, label: 'Hypes', key: 'hypes' },
  { to: '/search', icon: Search, label: 'Buscar', key: 'search' },
  { to: '/messages', icon: MessageCircle, label: 'Mensagens', key: 'messages' },
  { to: '/profile', icon: User, label: 'Perfil', key: 'profile' },
];

export function BottomNav() {
  const { getUnreadCount } = useMessages();
  const unreadCount = getUnreadCount();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-4 py-2 transition-all duration-200 relative ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <item.icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={isActive ? 'drop-shadow-[0_0_8px_hsl(var(--primary))]' : ''}
                  />
                  {item.key === 'messages' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card" />
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
