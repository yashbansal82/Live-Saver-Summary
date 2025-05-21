import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Link from '@/models/Link';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

function isPromise<T>(value: any): value is Promise<T> {
  return !!value && typeof value.then === 'function';
}

export async function DELETE(request: Request, contextOrPromise: { params: { id: string } } | Promise<{ params: { id: string } }>) {
  try {
    let params: { id: string };
    if (isPromise(contextOrPromise)) {
      params = (await contextOrPromise).params;
    } else {
      params = contextOrPromise.params;
    }
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId?: string };
      if (!decoded || typeof decoded !== 'object' || !('userId' in decoded) || !decoded.userId) {
        return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
      }
      userId = decoded.userId;
    } catch (error: any) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    await connectDB();

    const link = await Link.findOneAndDelete({ _id: params.id, userId });

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Update order of remaining links
    await Link.updateMany(
      { userId, order: { $gt: link.order } },
      { $inc: { order: -1 } }
    );

    return NextResponse.json({ message: 'Link deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting link:', error);
    return NextResponse.json({ error: error.message || 'Something went wrong' }, { status: 500 });
  }
}
