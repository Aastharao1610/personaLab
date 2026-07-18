import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const sectionVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

export function AnimatedSection({ children, className = '', id }) {
  return (
    <motion.section
      id={id}
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.22 }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

AnimatedSection.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  id: PropTypes.string,
};
