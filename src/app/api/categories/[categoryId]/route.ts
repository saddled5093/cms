
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// import { getAuth } from '@clerk/nextjs/server'; // Example for Clerk auth
// import { getServerSession } from "next-auth/next" // Example: if using NextAuth
// import { authOptions } from "@/app/api/auth/[...nextauth]/route" // Example

export async function PUT(
  request: Request,
  { params }: { params: { categoryId: string } }
) {
  // TODO: Add authentication and authorization (e.g., only admin can update categories)
  // const session = await getServerSession(authOptions) // Example
  // if (!session || session.user.role !== 'ADMIN') {
  //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  // }

  const categoryId = params.categoryId;
  if (!categoryId) {
    return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
  }

  try {
    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Category name is required and must be a non-empty string' }, { status: 400 });
    }

    // Check if another category with the new name already exists (excluding the current one)
    const existingCategoryWithName = await prisma.category.findFirst({
        where: {
            name: name.trim(),
            id: { not: categoryId }
        }
    });

    if (existingCategoryWithName) {
        return NextResponse.json({ error: `A category with the name "${name.trim()}" already exists.` }, { status: 409 });
    }


    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: { name: name.trim() },
    });

    return NextResponse.json({
        ...updatedCategory,
        createdAt: updatedCategory.createdAt.toISOString(),
        updatedAt: updatedCategory.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to update category:', error);
    if (error.code === 'P2025') { // Record to update not found
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    // P2002 for unique constraint on name is handled by the explicit check above for better error message
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE handler can be added here later if needed
// export async function DELETE(
//   request: Request,
//   { params }: { params: { categoryId: string } }
// ) { ... }
