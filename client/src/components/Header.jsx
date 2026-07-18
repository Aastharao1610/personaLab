import { Button } from './Button.jsx';

const navItems = [
  { label: 'Simulated Users', href: '#thinking' },
  { label: 'Simulation', href: '#simulation' },
  { label: 'Attention Map', href: '#heatmap-story' },
  { label: 'Analyze', href: '#upload' },
];

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.08] bg-black/55 px-6 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between">
        <a href="#" className="flex items-center gap-3" aria-label="PersonaLab home">
          <span className="grid h-7 w-7 place-items-center rounded-md border border-white/10 bg-white text-xs font-semibold text-black">
            P
          </span>
          <span className="text-sm font-medium text-white">PersonaLab</span>
        </a>

        <nav className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden sm:block">
          <Button href="#upload" variant="secondary">
            Analyze page
          </Button>
        </div>
      </div>
    </header>
  );
}
