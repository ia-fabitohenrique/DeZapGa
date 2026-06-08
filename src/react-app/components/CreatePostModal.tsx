import { useState, useRef } from 'react';
import { ImagePlus, MapPin, X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/react-app/components/ui/dialog';
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
import { categories, conditionLabels, Post, PostType, Category, Condition, UserLocation } from '@/data/stubData';
import { usePosts } from '@/react-app/hooks/usePosts';
import { useUsers } from '@/react-app/hooks/useUsers';

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editPost?: Post | null;
}

const MAX_IMAGES = 5;

const sampleImages = [
  'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop',
];

export function CreatePostModal({ open, onOpenChange, editPost }: CreatePostModalProps) {
  const { addPost, updatePost } = usePosts();
  const { currentUser } = useUsers();
  const isEditing = !!editPost;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<PostType>(editPost?.type || 'sale');
  const [title, setTitle] = useState(editPost?.title || '');
  const [description, setDescription] = useState(editPost?.description || '');
  const [price, setPrice] = useState(editPost?.price?.toString() || '');
  const [category, setCategory] = useState<Category | ''>(editPost?.category || '');
  const [condition, setCondition] = useState<Condition | ''>(editPost?.condition || '');
  const [images, setImages] = useState<string[]>(editPost?.images || []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const userLocation = currentUser.location;
  const hasLocation = userLocation && (userLocation.city || userLocation.neighborhood);

  const formatLocationString = (loc: UserLocation | undefined) => {
    if (!loc) return '';
    const parts = [];
    if (loc.neighborhood) parts.push(loc.neighborhood);
    if (loc.city) parts.push(loc.city);
    if (loc.state) parts.push(loc.state);
    return parts.join(', ');
  };

  const resetForm = () => {
    setType('sale');
    setTitle('');
    setDescription('');
    setPrice('');
    setCategory('');
    setCondition('');
    setImages([]);
    setUploadError(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      setUploadError(`Máximo de ${MAX_IMAGES} imagens permitido`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    // Validate file types
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const invalidFiles = filesToUpload.filter(f => !validTypes.includes(f.type));
    if (invalidFiles.length > 0) {
      setUploadError('Apenas imagens (JPG, PNG, WebP, GIF) são permitidas');
      return;
    }

    // Validate file sizes (max 10MB each)
    const maxSize = 10 * 1024 * 1024;
    const oversizedFiles = filesToUpload.filter(f => f.size > maxSize);
    if (oversizedFiles.length > 0) {
      setUploadError('Cada imagem deve ter no máximo 10MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      filesToUpload.forEach(file => formData.append('files', file));

      const response = await fetch('/api/upload/post-images', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao enviar imagens');
      }

      const { urls } = await response.json();
      setImages(prev => [...prev, ...urls]);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Erro ao enviar imagens');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !category || !condition) return;
    if (type === 'sale' && !price) return;

    const finalImages = images.length > 0 
      ? images 
      : [sampleImages[Math.floor(Math.random() * sampleImages.length)]];

    const postData = {
      type,
      title,
      description,
      price: type === 'sale' ? parseFloat(price) : undefined,
      category: category as Category,
      condition: condition as Condition,
      images: finalImages,
      location: userLocation,
    };

    if (isEditing && editPost) {
      updatePost(editPost.id, postData);
    } else {
      addPost(postData);
    }

    resetForm();
    onOpenChange(false);
  };

  const handleClose = () => {
    if (!isEditing) resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {isEditing ? 'Editar Publicação' : 'Nova Publicação'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type selector */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('donation')}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                type === 'donation'
                  ? 'bg-donation text-white shadow-lg shadow-donation/30'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              🎁 Doação
            </button>
            <button
              type="button"
              onClick={() => setType('sale')}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                type === 'sale'
                  ? 'bg-sale text-white shadow-lg shadow-sale/30'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              💰 Venda
            </button>
          </div>

          {/* Image upload section */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Imagens ({images.length}/{MAX_IMAGES})
            </Label>
            
            {/* Image previews grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {images.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-secondary">
                    <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                    >
                      <X size={14} />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-primary text-white text-[10px] font-semibold rounded">
                        Principal
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Upload area */}
            {images.length < MAX_IMAGES && (
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`relative aspect-video rounded-xl overflow-hidden bg-secondary border-2 border-dashed transition-colors cursor-pointer ${
                  isUploading ? 'border-primary/50' : 'border-border hover:border-primary/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                  {isUploading ? (
                    <>
                      <Loader2 size={32} className="mb-2 animate-spin text-primary" />
                      <span className="text-sm">Enviando...</span>
                    </>
                  ) : (
                    <>
                      <ImagePlus size={32} className="mb-2" />
                      <span className="text-sm font-medium">Adicionar imagens</span>
                      <span className="text-xs mt-1">
                        Clique para selecionar (até {MAX_IMAGES - images.length} {MAX_IMAGES - images.length === 1 ? 'imagem' : 'imagens'})
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Error message */}
            {uploadError && (
              <p className="text-sm text-red-500 mt-2">{uploadError}</p>
            )}

            {/* Help text */}
            <p className="text-xs text-muted-foreground mt-2">
              JPG, PNG, WebP ou GIF. Máximo 10MB por imagem.
            </p>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium mb-2 block">
              Título *
            </Label>
            <Input
              id="title"
              placeholder="Ex: iPhone 13 Pro em ótimo estado"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium mb-2 block">
              Descrição
            </Label>
            <Textarea
              id="description"
              placeholder="Descreva o produto ou serviço..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Price (only for sale) */}
          {type === 'sale' && (
            <div>
              <Label htmlFor="price" className="text-sm font-medium mb-2 block">
                Preço (R$) *
              </Label>
              <Input
                id="price"
                type="number"
                placeholder="0,00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                step="0.01"
                required
              />
            </div>
          )}

          {/* Category */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Categoria *</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Condition */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Estado *</Label>
            <Select value={condition} onValueChange={(v) => setCondition(v as Condition)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(conditionLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location preview */}
          <div className="p-3 bg-secondary/50 rounded-xl">
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={16} className="text-primary" />
              <span className="text-muted-foreground">Localização:</span>
              {hasLocation ? (
                <span className="font-medium">{formatLocationString(userLocation)}</span>
              ) : (
                <span className="text-muted-foreground italic">
                  Configure sua localização no perfil
                </span>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isUploading}
              className="flex-1 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90"
            >
              {isEditing ? 'Salvar' : 'Publicar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
