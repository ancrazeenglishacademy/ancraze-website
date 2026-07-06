import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, token } = body;

    if (!userId || !token) {
      return NextResponse.json(
        { success: false, message: 'User ID and token are required' },
        { status: 400 }
      );
    }

    await adminDb.collection('users').doc(userId).update({
      expoPushToken: token,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, message: 'Push token saved successfully' });
  } catch (error: any) {
    console.error('Error saving push token:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save push token', error: error.message },
      { status: 500 }
    );
  }
}
