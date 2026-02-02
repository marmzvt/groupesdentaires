import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Force dynamic rendering (no caching)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// POST - Create a new response
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, completed } = body;

    // Extract indexed fields
    const startYear = data.Q1 as number | undefined;
    const affiliationYears = data.Q3 as number | undefined;
    const structureName = data.Q16 as string | undefined;

    const response = await prisma.response.create({
      data: {
        data,
        completed: completed || false,
        startYear,
        affiliationYears,
        structureName,
        surveyVersion: 2,  // v2: 7 segments, new Q21/Q22 options
      },
    });

    return NextResponse.json({ success: true, id: response.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating response:', error);
    return NextResponse.json(
      { error: 'Failed to create response' },
      { status: 500 }
    );
  }
}

// GET - Get all responses (for admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const completed = searchParams.get('completed');

    const where = completed !== null ? { completed: completed === 'true' } : {};

    const [responses, total] = await Promise.all([
      prisma.response.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.response.count({ where }),
    ]);

    return NextResponse.json({
      responses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a response by ID
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Response ID is required' },
        { status: 400 }
      );
    }

    await prisma.response.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting response:', error);
    return NextResponse.json(
      { error: 'Failed to delete response' },
      { status: 500 }
    );
  }
}
