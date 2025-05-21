import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Link from '@/models/Link';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

export async function POST(request: Request) {
  try {
    const { orders } = await request.json();

    if (!Array.isArray(orders)) {
      return NextResponse.json(
        { error: 'Invalid orders data' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    await connectDB();

    // Update orders in bulk
    const bulkOps = orders.map(({ id, order }) => ({
      updateOne: {
        filter: { _id: id, userId },
        update: { $set: { order } },
      },
    }));

    await Link.bulkWrite(bulkOps);

    return NextResponse.json({ message: 'Links reordered successfully' });
  } catch (error: any) {
    console.error('Error reordering links:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
} 