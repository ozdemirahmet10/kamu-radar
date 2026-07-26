import { pushApi } from './api-client';

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

function urlBase64ToUint8Array(base64Url: string): BufferSource {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0))) as BufferSource;
}

async function getExistingSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration('/sw.js');
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

export async function getPushSubscriptionStatus(): Promise<boolean> {
  if (!isPushSupported()) return false;
  const subscription = await getExistingSubscription();
  return subscription !== null;
}

export async function enablePushNotifications(accessToken: string): Promise<void> {
  if (!isPushSupported()) {
    throw new Error('Bu tarayıcı push bildirimlerini desteklemiyor.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Bildirim izni verilmedi.');
  }

  const registration = await navigator.serviceWorker.register('/sw.js');
  const { publicKey } = await pushApi.getPublicKey();

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  const json = subscription.toJSON();
  await pushApi.subscribe(
    {
      endpoint: subscription.endpoint,
      keys: { p256dh: json.keys?.p256dh ?? '', auth: json.keys?.auth ?? '' },
    },
    accessToken,
  );
}

export async function disablePushNotifications(accessToken: string): Promise<void> {
  const subscription = await getExistingSubscription();
  if (!subscription) return;

  await subscription.unsubscribe();
  await pushApi.unsubscribe(subscription.endpoint, accessToken);
}
