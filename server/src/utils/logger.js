export const logger = {
  info(message, meta) {
    if (meta) {
      console.log(message, meta);
      return;
    }

    console.log(message);
  },
  error(message, meta) {
    if (meta) {
      console.error(message, meta);
      return;
    }

    console.error(message);
  },
  warn(message, meta) {
    if (meta) {
      console.warn(message, meta);
      return;
    }

    console.warn(message);
  },
};
