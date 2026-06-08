import { LayoutGrid, List } from 'lucide-react';

export type ViewMode = 'feed' | 'grid';

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center bg-secondary rounded-lg p-1">
      <button
        onClick={() => onChange('feed')}
        className={`p-1.5 rounded-md transition-all ${
          mode === 'feed'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Visualização em lista"
      >
        <List size={18} />
      </button>
      <button
        onClick={() => onChange('grid')}
        className={`p-1.5 rounded-md transition-all ${
          mode === 'grid'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Visualização em grade"
      >
        <LayoutGrid size={18} />
      </button>
    </div>
  );
}
