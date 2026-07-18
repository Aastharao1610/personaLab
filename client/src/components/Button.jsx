import PropTypes from 'prop-types';

const variants = {
  primary:
    'bg-white text-black shadow-[0_0_0_1px_rgba(255,255,255,0.16),0_20px_60px_rgba(255,255,255,0.18)] hover:bg-zinc-200',
  secondary:
    'bg-white/[0.03] text-white ring-1 ring-white/10 hover:bg-white/[0.07] hover:ring-white/20',
};

export function Button({ children, href = '#', variant = 'primary' }) {
  return (
    <a
      href={href}
      className={`inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-medium transition duration-200 ${variants[variant]}`}
    >
      {children}
    </a>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  href: PropTypes.string,
  variant: PropTypes.oneOf(['primary', 'secondary']),
};
