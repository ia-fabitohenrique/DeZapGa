import { useState } from 'react';
import { Search, Users, Gift, Tag } from 'lucide-react';
import { Header } from '@/react-app/components/Header';
import { PostCard } from '@/react-app/components/PostCard';
import { PostGridCard } from '@/react-app/components/PostGridCard';
import { UserListItem } from '@/react-app/components/UserListItem';
import { ViewToggle, ViewMode } from '@/react-app/components/ViewToggle';
import { Input } from '@/react-app/components/ui/input';
import { Badge } from '@/react-app/components/ui/badge';
import { usePosts } from '@/react-app/hooks/usePosts';
import { useUsers } from '@/react-app/hooks/useUsers';
import { categories } from '@/data/stubData';

type SearchTab = 'posts' | 'users';
type TypeFilter = 'all' | 'sale' | 'donation';

export default function SearchPage() {
  const { posts } = usePosts();
  const { users } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<TypeFilter>('all');
  const [activeTab, setActiveTab] = useState<SearchTab>('posts');
  const [viewMode, setViewMode] = useState<ViewMode>('feed');

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      searchTerm === '' ||
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory =
      selectedCategory === null || post.category === selectedCategory;

    const matchesType =
      selectedType === 'all' || post.type === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  const filteredUsers = users.filter((user) => {
    if (searchTerm === '') return true;
    return (
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const typeFilters: { id: TypeFilter; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'Todos', icon: null },
    { id: 'sale', label: 'Venda', icon: <Tag size={12} /> },
    { id: 'donation', label: 'Doação', icon: <Gift size={12} /> },
  ];

  return (
    <div className="min-h-screen pb-20">
      <Header title="Buscar" />
      
      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            type="text"
            placeholder={activeTab === 'posts' ? 'Buscar produtos e serviços...' : 'Buscar usuários...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 bg-secondary border-0 rounded-xl"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'posts'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            Publicações
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'users'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users size={16} />
            Usuários
          </button>
        </div>

        {activeTab === 'posts' && (
          <>
            {/* Type filter */}
            <div className="flex items-center gap-2">
              {typeFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedType(filter.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedType === filter.id
                      ? filter.id === 'donation'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {filter.icon}
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
              <Badge
                variant={selectedCategory === null ? 'default' : 'outline'}
                className="flex-shrink-0 cursor-pointer transition-all"
                onClick={() => setSelectedCategory(null)}
              >
                Todas categorias
              </Badge>
              {categories.slice(0, 8).map((category) => (
                <Badge
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  className="flex-shrink-0 cursor-pointer transition-all"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Badge>
              ))}
            </div>

            {/* Results header with view toggle */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredPosts.length} resultado{filteredPosts.length !== 1 ? 's' : ''}
              </p>
              <ViewToggle mode={viewMode} onChange={setViewMode} />
            </div>

            {/* Results */}
            {filteredPosts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">
                  Nenhum resultado encontrado.
                </p>
              </div>
            ) : viewMode === 'feed' ? (
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredPosts.map((post) => (
                  <PostGridCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'users' && (
          <div className="space-y-2">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-16">
                <Users className="mx-auto text-muted-foreground mb-3" size={32} />
                <p className="text-muted-foreground">
                  Nenhum usuário encontrado.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-3">
                  {filteredUsers.length} usuário{filteredUsers.length !== 1 ? 's' : ''}
                </p>
                {filteredUsers.map((user) => (
                  <UserListItem key={user.id} user={user} />
                ))}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
