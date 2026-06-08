import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { exchangeCodeForSessionToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await exchangeCodeForSessionToken();
        navigate('/', { replace: true });
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Falha na autenticação. Por favor, tente novamente.');
      }
    };

    handleCallback();
  }, [exchangeCodeForSessionToken, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">😕</span>
          </div>
          <h1 className="text-xl font-display font-bold mb-2">Ops!</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <Loader2 size={48} className="animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Entrando na sua conta...</p>
    </div>
  );
}
