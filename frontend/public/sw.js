// Kamu Radar — Web Push service worker.
// Sadece push bildirimlerini göstermek ve tıklamayı yönetmek için kullanılır;
// önbellekleme/offline desteği kasıtlı olarak yapılmıyor (kapsam dışı).

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Kamu Radar', body: event.data.text() };
  }

  const title = payload.title || 'Kamu Radar';
  const options = {
    body: payload.body || '',
    icon: '/favicon.ico',
    data: { url: payload.url || '/dashboard/bildirimler' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard/bildirimler';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    }),
  );
});
