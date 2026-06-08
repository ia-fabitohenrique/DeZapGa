import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/react-app/components/ui/dialog';
import { Button } from '@/react-app/components/ui/button';
import { useAuth } from '@getmocha/users-service/react';

interface LoginPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export function LoginPromptModal({ 
  open, 
  onOpenChange, 
  title = 'Entre para continuar',
  description = 'Você precisa estar logado para realizar esta ação.'
}: LoginPromptModalProps) {
  const { redirectToLogin } = useAuth();

  const handleLogin = async () => {
    onOpenChange(false);
    await redirectToLogin();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-orange-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔐</span>
          </div>
          <DialogTitle className="font-display text-xl">{title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-4">
          <Button
            onClick={handleLogin}
            className="w-full bg-white text-gray-800 hover:bg-gray-100"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Entrar com Google
          </Button>
          
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Cancelar
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          Ao entrar, você concorda com nossos Termos de Uso e Política de Privacidade.
        </p>
      </DialogContent>
    </Dialog>
  );
}
