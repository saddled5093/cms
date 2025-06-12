
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// import { getServerSession } from "next-auth/next" // Example: if using NextAuth
// import { authOptions } from "@/app/api/auth/[...nextauth]/route" // Example

export async function PUT(
  request: Request,
  { params }: { params: { noteId: string } }
) {
  // TODO: Implement proper authentication and authorization
  // For now, assuming a mechanism to check if user is ADMIN
  // const session = await getServerSession(authOptions)
  // if (!session || session.user.role !== 'ADMIN') {
  //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  // }
  // For this example, we'll simulate an admin check later or omit for brevity

  const noteId = params.noteId;
  if (!noteId) {
    return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
  }

  try {
    const { rating } = await request.json();

    if (typeof rating !== 'number' || rating < 0 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be a number between 0 and 5' }, { status: 400 });
    }

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: { rating },
      include: {
        categories: { select: { id: true, name: true } },
        author: { select: { username: true } },
        comments: {
          include: { author: { select: { username: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json({
      ...updatedNote,
      eventDate: updatedNote.eventDate ? updatedNote.eventDate.toISOString() : null,
      createdAt: updatedNote.createdAt.toISOString(),
      updatedAt: updatedNote.updatedAt.toISOString(),
      comments: updatedNote.comments.map(comment => ({
        ...comment,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Failed to update note rating:', error);
    if (error.code === 'P2025') { // Record to update not found
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update note rating', details: error.message }, { status: 500 });
  }
}
