import { useAuth } from '@getmocha/users-service/react';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function LoginPage() {
  const { redirectToLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await redirectToLogin();
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero section */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-black tracking-tight">
            <span className="text-primary">De</span>
            <span className="text-foreground">Zap</span>
            <span className="text-primary">Ga</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Desapegue, conecte, transforme
          </p>
        </div>

        {/* Illustration */}
        <div className="w-64 h-64 mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-orange-500/20 rounded-3xl blur-3xl" />
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="grid grid-cols-2 gap-3">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-orange-500 rounded-2xl flex items-center justify-center text-4xl shadow-lg shadow-primary/30">
                🎁
              </div>
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center text-4xl shadow-lg shadow-emerald-500/30">
                💰
              </div>
              <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center text-4xl shadow-lg shadow-violet-500/30">
                🔥
              </div>
              <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center text-4xl shadow-lg shadow-pink-500/30">
                💬
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-xs text-center mb-8">
          <h2 className="text-xl font-semibold mb-3">Bem-vindo ao DeZapGa!</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            A plataforma que conecta pessoas através do desapego consciente. 
            Doe, venda e descubra itens incríveis na sua comunidade.
          </p>
        </div>

        {/* Login button */}
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full max-w-xs flex items-center justify-center gap-3 px-6 py-4 bg-white text-gray-800 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-70"
        >
          {isLoading ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Entrar com Google
            </>
          )}
        </button>

        {/* Terms */}
        <p className="text-xs text-muted-foreground mt-6 text-center max-w-xs">
          Ao continuar, você concorda com os nossos{' '}
          <span className="text-primary">Termos de Uso</span> e{' '}
          <span className="text-primary">Política de Privacidade</span>
        </p>
      </div>

      {/* Bottom decoration */}
      <div className="h-2 bg-gradient-to-r from-primary via-orange-500 to-primary" />
    </div>
  );
}
