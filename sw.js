// esurat/sw.js
self.addEventListener('push', function(event) {
  const data = event.data.json();
  const title = data.title;
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
