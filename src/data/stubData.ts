export const categories = [
  { id: 'fitness', name: 'Fitness', icon: 'Dumbbell' },
  { id: 'pet', name: 'Pet', icon: 'PawPrint' },
  { id: 'roupas', name: 'Roupas', icon: 'Shirt' },
  { id: 'calcados', name: 'Calçados', icon: 'Footprints' },
  { id: 'tecnologia', name: 'Tecnologia', icon: 'Smartphone' },
  { id: 'decoracao', name: 'Decoração', icon: 'Lamp' },
  { id: 'comida', name: 'Comida', icon: 'UtensilsCrossed' },
  { id: 'servicos', name: 'Serviços', icon: 'Wrench' },
  { id: 'acessorios', name: 'Acessórios', icon: 'Watch' },
  { id: 'moda', name: 'Moda', icon: 'Sparkles' },
  { id: 'perfumes', name: 'Perfumes', icon: 'Droplets' },
  { id: 'brinquedos', name: 'Brinquedos', icon: 'Gamepad2' },
  { id: 'livros', name: 'Livros', icon: 'BookOpen' },
  { id: 'moveis', name: 'Móveis', icon: 'Sofa' },
  { id: 'eletrodomesticos', name: 'Eletrodomésticos', icon: 'Refrigerator' },
] as const;

export type Category = typeof categories[number]['id'];

export type PostType = 'donation' | 'sale';
export type Condition = 'new' | 'like_new' | 'good' | 'fair';
export type PostStatus = 'available' | 'sold' | 'donated';

export interface UserLocation {
  state: string;
  city: string;
  neighborhood: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  email?: string;
  phone?: string;
  location?: UserLocation;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
}

export interface Post {
  id: string;
  user: User;
  type: PostType;
  title: string;
  description: string;
  price?: number;
  category: Category;
  condition: Condition;
  status: PostStatus;
  images: string[];
  location?: UserLocation;
  hypeCount: number;
  isHyped: boolean;
  createdAt: string;
}

export const stubUsers: User[] = [
  { 
    /*
    id: '1',
    username: 'mariasantos',
    displayName: 'Maria Santos',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    bio: 'Apaixonada por moda sustentável 🌱',
    email: 'maria@email.com',
    phone: '(11) 99999-1234',
    location: { state: 'SP', city: 'São Paulo', neighborhood: 'Pinheiros' },
    followersCount: 1234,
    followingCount: 567,
    isFollowing: true,
    */
  },
  {
    /*
    id: '2',
    username: 'joaosilva',
    displayName: 'João Silva',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    bio: 'Tech enthusiast | Minimalista',
    email: 'joao@email.com',
    phone: '(21) 98888-5678',
    location: { state: 'RJ', city: 'Rio de Janeiro', neighborhood: 'Botafogo' },
    followersCount: 890,
    followingCount: 234,
    isFollowing: true,
    */
  },
  {
  /*
    id: '3',
    username: 'analuiza',
    displayName: 'Ana Luiza',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    bio: 'Decoração e lifestyle ✨',
    email: 'ana@email.com',
    phone: '(31) 97777-9012',
    location: { state: 'MG', city: 'Belo Horizonte', neighborhood: 'Savassi' },
    followersCount: 2345,
    followingCount: 123,
    isFollowing: false,
    */
  },
  {
  /*
    id: '4',
    username: 'pedrocosta',
    displayName: 'Pedro Costa',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    bio: 'Fitness lover 💪',
    email: 'pedro@email.com',
    phone: '(41) 96666-3456',
    location: { state: 'PR', city: 'Curitiba', neighborhood: 'Batel' },
    followersCount: 567,
    followingCount: 890,
    isFollowing: true,
    */
  },
];

export const stubPosts: Post[] = [
  {
  /*
    id: '1',
    user: stubUsers[0],
    type: 'donation',
    title: 'Vestido floral vintage',
    description: 'Lindo vestido vintage em perfeito estado. Tamanho M. Não uso mais e quero que alguém aproveite!',
    category: 'roupas',
    condition: 'like_new',
    status: 'available',
    images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=600&fit=crop'],
    location: { state: 'SP', city: 'São Paulo', neighborhood: 'Pinheiros' },
    hypeCount: 47,
    isHyped: false,
    createdAt: '2024-01-15T10:30:00Z',
    */
  },
  {
  /*
    id: '2',
    user: stubUsers[1],
    type: 'sale',
    title: 'iPhone 13 Pro 256GB',
    description: 'iPhone 13 Pro em excelente estado. Acompanha caixa original e carregador.',
    price: 3500,
    category: 'tecnologia',
    condition: 'like_new',
    status: 'available',
    images: ['https://images.unsplash.com/photo-1632633173522-47456de71b76?w=600&h=600&fit=crop'],
    location: { state: 'RJ', city: 'Rio de Janeiro', neighborhood: 'Botafogo' },
    hypeCount: 128,
    isHyped: true,
    createdAt: '2024-01-14T15:45:00Z',
    */
  },
  {
  /*
    id: '3',
    user: stubUsers[2],
    type: 'donation',
    title: 'Kit decoração minimalista',
    description: 'Conjunto de vasos e porta-retratos. Mudei de decoração e não combina mais.',
    category: 'decoracao',
    condition: 'good',
    status: 'available',
    images: ['https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=600&h=600&fit=crop'],
    location: { state: 'MG', city: 'Belo Horizonte', neighborhood: 'Savassi' },
    hypeCount: 89,
    isHyped: false,
    createdAt: '2024-01-14T09:20:00Z',
    */
  },
  {
  /*
    id: '4',
    user: stubUsers[3],
    type: 'sale',
    title: 'Halteres 10kg par',
    description: 'Par de halteres emborrachados 10kg cada. Pouco uso.',
    price: 180,
    category: 'fitness',
    condition: 'like_new',
    status: 'available',
    images: ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=600&fit=crop'],
    location: { state: 'PR', city: 'Curitiba', neighborhood: 'Batel' },
    hypeCount: 34,
    isHyped: false,
    createdAt: '2024-01-13T18:00:00Z',
    */
  },
  {
  /*
    id: '5',
    user: stubUsers[0],
    type: 'sale',
    title: 'Bolsa de couro italiana',
    description: 'Bolsa autêntica de couro italiano. Linda e elegante.',
    price: 450,
    category: 'acessorios',
    condition: 'good',
    status: 'available',
    images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop'],
    location: { state: 'SP', city: 'São Paulo', neighborhood: 'Pinheiros' },
    hypeCount: 156,
    isHyped: true,
    createdAt: '2024-01-13T14:30:00Z',
    */
  },
  {
  /*
    id: '6',
    user: stubUsers[2],
    type: 'donation',
    title: 'Livros de romance',
    description: 'Coleção com 10 livros de romance. Todos em ótimo estado.',
    category: 'livros',
    condition: 'good',
    status: 'available',
    images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=600&fit=crop'],
    location: { state: 'MG', city: 'Belo Horizonte', neighborhood: 'Savassi' },
    hypeCount: 23,
    isHyped: false,
    createdAt: '2024-01-12T11:15:00Z',
    */
  },
];

export const conditionLabels: Record<Condition, string> = {
  new: 'Novo',
  like_new: 'Como novo',
  good: 'Bom estado',
  fair: 'Usado',
};
