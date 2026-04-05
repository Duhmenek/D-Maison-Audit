import { NextResponse } from 'next/server';
import { dbService } from '@/app/lib/db';

export async function GET() {
  try {
    const logs = await dbService.getVerificationLogs();
    return NextResponse.json({ 
      success: true, 
      data: logs
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Database fetch failed' }, { status: 500 });
  }
}
