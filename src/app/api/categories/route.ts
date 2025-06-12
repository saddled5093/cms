
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// import { getAuth } from '@clerk/nextjs/server'; // Example for Clerk auth
// import { getServerSession } from "next-auth/next" // Example: if using NextAuth
// import { authOptions } from "@/app/api/auth/[...nextauth]/route" // Example

export async function GET(request: Request) {
  // TODO: Add authentication and authorization if needed (e.g., only admin can see all for management)
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(categories.map(category => ({
        ...category,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString(),
    })));
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // TODO: Add authentication and authorization (e.g., only admin can create categories)
  // const session = await getServerSession(authOptions) // Example
  // if (!session || session.user.role !== 'ADMIN') {
  //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  // }

  try {
    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Category name is required and must be a non-empty string' }, { status: 400 });
    }

    const newCategory = await prisma.category.create({
      data: {
        name: name.trim(),
      },
    });
    return NextResponse.json({
        ...newCategory,
        createdAt: newCategory.createdAt.toISOString(),
        updatedAt: newCategory.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create category:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return NextResponse.json({ error: 'A category with this name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
