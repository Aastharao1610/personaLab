import PropTypes from 'prop-types';

export function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-medium text-zinc-500">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-semibold tracking-normal text-white sm:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-base leading-7 text-zinc-400">{description}</p>
    </div>
  );
}

SectionHeader.propTypes = {
  eyebrow: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};
