// Service Worker for PWA (Empty)
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  console.log('Service Worker activated.');
});
