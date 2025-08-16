# PWA Implementation for MI Campus

## Overview

This implementation adds Progressive Web App (PWA) functionality to the MI Campus frontend, with a focus on offline caching for the schedule view.

## Features

### ✅ PWA Core Features

- **Service Worker**: Handles offline caching and background sync
- **Web App Manifest**: Enables app installation and provides app metadata
- **Install Prompt**: Automatic installation prompt for supported browsers
- **Offline Support**: Schedule data cached for offline access

### ✅ Schedule Offline Functionality

- **Network-First Strategy**: Schedule API calls use network-first caching
- **Offline Indicators**: Visual feedback when app is offline
- **Cached Data Display**: Shows cached schedule data when offline
- **Error Handling**: Graceful fallback when network is unavailable

### ✅ User Experience

- **Loading States**: Skeleton loading for better perceived performance
- **Offline Notifications**: Clear indicators when viewing cached data
- **Responsive Design**: Works on mobile and desktop devices
- **Dark/Light Mode**: Full support for theme switching
- **Internationalization**: Full i18n support for offline messages

## Technical Implementation

### Service Worker Strategy

```typescript
// Schedule data: Network-first with 24-hour cache
registerRoute(
  ({ url }) => url.pathname.includes('/api/schedule'),
  new NetworkFirst({
    cacheName: 'schedule-cache',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
  }),
);
```

### Caching Strategy

- **Schedule Data**: Network-first (3s timeout, 24h cache)
- **Static Assets**: Stale-while-revalidate
- **Images**: Cache-first (30 days)
- **Pages**: Network-first for navigation

### React Query Configuration

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: queryKeys.schedule.all,
  queryFn: async () => (await api.get('/schedule/student/demo')).data,
  staleTime: 1000 * 60 * 5, // 5 minutes
  gcTime: 1000 * 60 * 30, // 30 minutes for offline access
});
```

## Installation & Usage

### Development

```bash
cd apps/frontend
yarn install
yarn dev
```

### Production Build

```bash
yarn build
```

The build generates:

- `dist/sw.js` - Service worker
- `dist/manifest.webmanifest` - Web app manifest
- `dist/registerSW.js` - Service worker registration

### Testing PWA Features

1. **Installation**: Look for the install prompt in supported browsers
2. **Offline Testing**:
   - Open DevTools → Network tab
   - Check "Offline" checkbox
   - Navigate to schedule page
   - Verify cached data displays
3. **Cache Inspection**: DevTools → Application → Storage → Cache Storage

## Browser Support

- ✅ Chrome/Edge (full PWA support)
- ✅ Firefox (basic PWA support)
- ✅ Safari (limited PWA support)
- ⚠️ Mobile browsers (varies by platform)

## Configuration

### Vite PWA Plugin

```typescript
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 24 * 60 * 60,
          },
        },
      },
    ],
  },
  manifest: {
    name: 'MI Campus',
    short_name: 'MI Campus',
    description: 'School management system',
    theme_color: '#3b82f6',
    background_color: '#ffffff',
    display: 'standalone',
    start_url: '/',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
});
```

## Future Enhancements

- [ ] Background sync for offline actions
- [ ] Push notifications
- [ ] Advanced offline-first strategies
- [ ] Offline data synchronization
- [ ] Performance monitoring and analytics

## Dependencies

- `vite-plugin-pwa`: PWA plugin for Vite
- `workbox-build`: Service worker generation
- `workbox-window`: Service worker management
