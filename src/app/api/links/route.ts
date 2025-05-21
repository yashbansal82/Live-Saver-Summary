import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Link from '@/models/Link';
import { fetchMetadata, generateSummary } from '@/lib/linkUtils';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

export async function POST(request: Request) {
  try {
    const { url, tags } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid URL' },
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

    // Check if link already exists for this user
    const existingLink = await Link.findOne({ url, userId });
    if (existingLink) {
      return NextResponse.json(
        { error: 'Link already saved' },
        { status: 400 }
      );
    }

    // Get the highest order number
    const lastLink = await Link.findOne({ userId }).sort({ order: -1 });
    const order = lastLink ? lastLink.order + 1 : 0;

    // Fetch metadata and generate summary
    const metadata = await fetchMetadata(url);
    const summary = await generateSummary(url, metadata.description);

    // Create new link
    const link = await Link.create({
      url,
      title: metadata.title,
      favicon: metadata.favicon,
      summary,
      userId,
      tags: tags || [],
      order,
    });

    return NextResponse.json(link);
  } catch (error: any) {
    console.error('Error saving link:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
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

    const links = await Link.find({ userId })
      .sort({ order: 1 })
      .lean();

    return NextResponse.json(links);
  } catch (error: any) {
    console.error('Error fetching links:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
} 