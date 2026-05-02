import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logout successful',
      },
      { status: 200 }
    );

    // Clear authentication cookies with delete method
    response.cookies.delete('authToken');
    response.cookies.delete('role');
    response.cookies.delete('uid');
    response.cookies.delete('userData');
    response.cookies.delete('fullName');
    response.cookies.delete('email');
    response.cookies.delete('photoURL');

    return response;
  } catch (error: any) {
    console.error('Logout error:', error);

    return NextResponse.json(
      { error: error.message || 'Logout failed' },
      { status: 500 }
    );
  }
}
