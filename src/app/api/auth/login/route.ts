
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePassword } from '@/lib/authUtils';
// In a real app, you'd use a library like 'jsonwebtoken' for session tokens
// and 'cookies-next' or similar for cookie management.

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const passwordMatch = await comparePassword(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // IMPORTANT: This is a simplified login.
    // In a real application, you would:
    // 1. Generate a session token (e.g., JWT).
    // 2. Store the session token securely (e.g., in an HTTP-only cookie).
    // 3. Return user information (without the password).

    // For this example, we'll just return the user (excluding password).
    // The frontend will need to manage this "session" (e.g., in AuthContext).
    const { password: _, ...userWithoutPassword } = user;
    
    // Create a basic session object to simulate a real session
    const session = {
        user: {
            id: userWithoutPassword.id,
            username: userWithoutPassword.username,
            role: userWithoutPassword.role,
        }
    };

    // This response would typically set a cookie with a session token.
    // For now, we just send back user data.
    // The client-side AuthContext will have to store this.
    return NextResponse.json({ message: 'Login successful', user: session.user });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
