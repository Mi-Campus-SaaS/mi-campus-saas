// PWA registration will be handled by vite-plugin-pwa
// This file is kept for potential future customization

export const registerPWA = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration);
        })
        .catch((error) => {
          console.error('SW registration error:', error);
        });
    });
  }
};
