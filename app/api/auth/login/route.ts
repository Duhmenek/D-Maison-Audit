import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { accessCode } = await req.json();
    const correctCode = process.env.ACCESS_CODE || 'maison2024';

    if (accessCode === correctCode) {
      const response = NextResponse.json({ success: true });
      response.cookies.set('auth_token', 'authorized', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      });
      return response;
    }

    return NextResponse.json({ error: 'Invalid access code' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
  }
}
