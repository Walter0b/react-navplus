// Written as a bare `process.env.NODE_ENV` read so bundlers can replace it, and wrapped in
// try/catch so it still works where `process` does not exist.
const isDev = ((): boolean => {
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
})();

const warned = new Set<string>();

export const warnOnce = (message: string): void => {
  if (!isDev || warned.has(message)) return;
  warned.add(message);
  console.warn(`[react-navplus] ${message}`);
};
