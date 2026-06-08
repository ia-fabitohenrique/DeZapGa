import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/react-app/components/ui/button';
import { CreatePostModal } from '@/react-app/components/CreatePostModal';
import { LoginPromptModal } from '@/react-app/components/LoginPromptModal';
import { useAuth } from '@getmocha/users-service/react';

interface HeaderProps {
  title?: string;
  showLogo?: boolean;
}

export function Header({ title, showLogo = false }: HeaderProps) {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handlePublishClick = () => {
    if (user) {
      setShowCreateModal(true);
    } else {
      setShowLoginPrompt(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto flex items-center justify-between h-14 px-4">
          {showLogo ? (
            <h1 className="font-display font-bold text-2xl bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
              DeZapGa
            </h1>
          ) : (
            <h1 className="font-display font-semibold text-lg">{title}</h1>
          )}
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handlePublishClick}
              className="gap-1.5 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 shadow-lg shadow-primary/25"
            >
              <Plus size={18} />
              <span className="font-semibold">Publicar</span>
            </Button>
          </div>
        </div>
      </header>

      <CreatePostModal open={showCreateModal} onOpenChange={setShowCreateModal} />
      <LoginPromptModal 
        open={showLoginPrompt} 
        onOpenChange={setShowLoginPrompt}
        title="Entre para publicar"
        description="Faça login para criar e publicar seus anúncios no DeZapGa."
      />
    </>
  );
}
