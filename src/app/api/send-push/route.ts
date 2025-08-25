// esurat/src/app/api/send-push/route.ts
import { NextResponse } from 'next/server';
import webpush from 'web-push';

// Konfigurasi web-push
// Ganti dengan VAPID Keys Anda sendiri
webpush.setVapidDetails(
  'mailto:ngluyo@gmail.com',
  'BN_UAu9QcPIM4kvoi_Szhcu6DgywWVHw1g6kozsadKMcb_b2JUc0uICRoDkmuFUdLcbWhSqWN3c5rnU4Rj4IDII',
  'ioD4RDUStieIpgQx5rgcN7O7fa9Qz1IZ8tZ0KXpbUxw'
);

export async function POST(request: Request) {
  const { subscription, title, body } = await request.json();

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title,
        body
      })
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending push notification:', error);
    return NextResponse.json({ success: false, error: 'Failed to send push notification' }, { status: 500 });
  }
}
