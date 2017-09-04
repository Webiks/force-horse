export function debugLog(...args) {
  if (localStorage.getItem('force-horse')) {
    console.debug(...args);
  }
}