import { useState } from 'react';
import { MoreHorizontal, Pencil, CheckCircle, Gift, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/react-app/components/ui/dropdown-menu';
import { Button } from '@/react-app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/react-app/components/ui/dialog';
import { Post } from '@/data/stubData';
import { usePosts } from '@/react-app/hooks/usePosts';

interface PostOptionsMenuProps {
  post: Post;
  onEdit: () => void;
}

export function PostOptionsMenu({ post, onEdit }: PostOptionsMenuProps) {
  const { markAsSold, markAsDonated, deletePost, updatePost } = usePosts();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState<'sold' | 'donated' | null>(null);

  const isOwner = post.user.id === 'me';
  const isAvailable = post.status === 'available';

  if (!isOwner) return null;

  const handleMarkStatus = () => {
    if (showStatusDialog === 'sold') {
      markAsSold(post.id);
    } else if (showStatusDialog === 'donated') {
      markAsDonated(post.id);
    }
    setShowStatusDialog(null);
  };

  const handleReactivate = () => {
    updatePost(post.id, { status: 'available' });
  };

  const handleDelete = () => {
    deletePost(post.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <MoreHorizontal size={18} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onEdit} className="gap-2">
            <Pencil size={16} />
            Editar
          </DropdownMenuItem>
          
          {isAvailable ? (
            <>
              {post.type === 'sale' ? (
                <DropdownMenuItem onClick={() => setShowStatusDialog('sold')} className="gap-2">
                  <CheckCircle size={16} />
                  Marcar como vendido
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => setShowStatusDialog('donated')} className="gap-2">
                  <Gift size={16} />
                  Marcar como doado
                </DropdownMenuItem>
              )}
            </>
          ) : (
            <DropdownMenuItem onClick={handleReactivate} className="gap-2">
              <CheckCircle size={16} />
              Reativar anúncio
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 size={16} />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status confirmation dialog */}
      <Dialog open={!!showStatusDialog} onOpenChange={() => setShowStatusDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {showStatusDialog === 'sold' ? 'Marcar como vendido?' : 'Marcar como doado?'}
            </DialogTitle>
            <DialogDescription>
              {showStatusDialog === 'sold'
                ? 'Isso indicará que o produto foi vendido e não está mais disponível.'
                : 'Isso indicará que o produto foi doado e não está mais disponível.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowStatusDialog(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleMarkStatus}
              className={showStatusDialog === 'sold' ? 'bg-sale hover:bg-sale/90' : 'bg-donation hover:bg-donation/90'}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir publicação?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O anúncio será removido permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
