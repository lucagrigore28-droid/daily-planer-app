
self.addEventListener('push', function(event) {
  const body = event.data?.text() ?? 'Nu ai mesaje noi';
  event.waitUntil(
    self.registration.showNotification('Daily Planner Pro', {
      body: body,
      icon: '/icon-192x192.png'
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
