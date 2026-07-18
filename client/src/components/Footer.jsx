const links = [
  ['Simulated Users', '#thinking'],
  ['Attention Map', '#heatmap-story'],
  ['Demo Flow', '#simulation'],
  ['Contact', '#contact'],
];

export function Footer() {
  return (
    <footer id="contact" className="border-t border-white/[0.08] px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <a href="#" className="font-medium text-white">
          PersonaLab
        </a>
        <nav className="flex flex-wrap gap-x-6 gap-y-3">
          {links.map(([label, href]) => (
            <a key={label} href={href} className="transition hover:text-white">
              {label}
            </a>
          ))}
        </nav>
        <p>© 2026 PersonaLab. All rights reserved.</p>
      </div>
    </footer>
  );
}
