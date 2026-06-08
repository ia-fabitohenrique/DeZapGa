import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Camera, Save, MapPin, Mail, Phone, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/react-app/components/ui/avatar';
import { Button } from '@/react-app/components/ui/button';
import { Input } from '@/react-app/components/ui/input';
import { Textarea } from '@/react-app/components/ui/textarea';
import { Label } from '@/react-app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/react-app/components/ui/select';
import { useUsers } from '@/react-app/hooks/useUsers';

const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { currentUser, updateCurrentUser } = useUsers();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio);
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [state, setState] = useState(currentUser.location?.state || '');
  const [city, setCity] = useState(currentUser.location?.city || '');
  const [neighborhood, setNeighborhood] = useState(currentUser.location?.neighborhood || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar);
  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setAvatarUrl(data.url);
      } else {
        // Fallback to local preview if upload fails
        const reader = new FileReader();
        reader.onload = (event) => {
          setAvatarUrl(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch {
      // Fallback to local preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  const handleSave = () => {
    updateCurrentUser({
      displayName,
      username,
      bio,
      email,
      phone,
      avatar: avatarUrl,
      location: {
        state,
        city,
        neighborhood,
      },
    });
    navigate('/profile');
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto flex items-center h-14 px-4 gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-secondary rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="flex-1 font-display font-semibold text-lg">Editar Perfil</h1>
          <Button
            onClick={handleSave}
            size="sm"
            className="bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90"
          >
            <Save size={16} className="mr-1" />
            Salvar
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Avatar section */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <Avatar className="h-28 w-28 ring-4 ring-primary/20">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-3xl">{displayName[0]}</AvatarFallback>
            </Avatar>
            <button
              onClick={handleAvatarClick}
              disabled={isUploading}
              className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Camera size={18} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {isUploading ? 'Enviando...' : 'Toque para alterar a foto'}
          </p>
        </div>

        {/* Personal info section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <UserIcon size={18} className="text-muted-foreground" />
            <h2 className="font-semibold">Informações Pessoais</h2>
          </div>

          <div>
            <Label htmlFor="displayName" className="text-sm font-medium mb-1.5 block">
              Nome de exibição
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>

          <div>
            <Label htmlFor="username" className="text-sm font-medium mb-1.5 block">
              Nome de usuário
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="seunome"
                className="pl-8"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bio" className="text-sm font-medium mb-1.5 block">
              Bio
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Conte um pouco sobre você..."
              rows={3}
              maxLength={150}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{bio.length}/150</p>
          </div>
        </div>

        {/* Contact info section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Mail size={18} className="text-muted-foreground" />
            <h2 className="font-semibold">Contato</h2>
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium mb-1.5 block">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com"
            />
          </div>

          <div>
            <Label htmlFor="phone" className="text-sm font-medium mb-1.5 block">
              Telefone
            </Label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phone"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(00) 00000-0000"
                className="pl-10"
                maxLength={15}
              />
            </div>
          </div>
        </div>

        {/* Location section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={18} className="text-muted-foreground" />
            <h2 className="font-semibold">Localização</h2>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            Sua localização será exibida nas publicações
          </p>

          <div>
            <Label className="text-sm font-medium mb-1.5 block">Estado</Label>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                {brazilianStates.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="city" className="text-sm font-medium mb-1.5 block">
              Cidade
            </Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Sua cidade"
            />
          </div>

          <div>
            <Label htmlFor="neighborhood" className="text-sm font-medium mb-1.5 block">
              Bairro
            </Label>
            <Input
              id="neighborhood"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Seu bairro"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
