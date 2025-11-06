import { NextResponse } from 'next/server';
import { checkFirebaseConnection } from '@/lib/firebase';

export async function GET() {
  try {
    console.log('Checking Firebase connection...');

    const isConnected = await checkFirebaseConnection();

    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: 'Firebase connection is working properly',
        connected: true,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Firebase connection failed',
        connected: false,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Connection check error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error checking Firebase connection',
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}