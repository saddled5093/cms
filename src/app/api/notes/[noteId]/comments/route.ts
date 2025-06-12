
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// import { getServerSession } from "next-auth/next" // Example: if using NextAuth
// import { authOptions } from "@/app/api/auth/[...nextauth]/route" // Example

export async function GET(
  request: Request,
  { params }: { params: { noteId: string } }
) {
  const noteId = params.noteId;
  if (!noteId) {
    return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
  }

  try {
    const comments = await prisma.comment.findMany({
      where: { noteId },
      include: {
        author: { select: { username: true, id: true } }, // Include author username and ID
      },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(comments.map(comment => ({
        ...comment,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
    })));
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { noteId: string } }
) {
  const noteId = params.noteId;
  if (!noteId) {
    return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
  }

  // TODO: Implement proper authentication and authorization
  // For now, assuming a mechanism to get the logged-in user's ID
  // const session = await getServerSession(authOptions)
  // if (!session || !session.user?.id) {
  //   return NextResponse.json({ error: 'Unauthorized. Please log in to comment.' }, { status: 401 });
  // }
  // const authorId = session.user.id;

  // For this example, we'll use a placeholder authorId or require it in the body if not using sessions
  
  try {
    const { content, authorId } = await request.json(); // Assuming authorId is sent in body for now

    if (!content || !authorId) {
      return NextResponse.json({ error: 'Content and authorId are required' }, { status: 400 });
    }
    
    // Verify note exists
    const note = await prisma.note.findUnique({ where: { id: noteId } });
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Verify author exists
    const author = await prisma.user.findUnique({ where: { id: authorId } });
    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 400 });
    }

    const newComment = await prisma.comment.create({
      data: {
        content,
        noteId,
        authorId,
      },
      include: {
        author: { select: { username: true, id: true } },
      },
    });
    return NextResponse.json({
        ...newComment,
        createdAt: newComment.createdAt.toISOString(),
        updatedAt: newComment.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create comment:', error);
     if (error.code === 'P2025') { // Foreign key constraint failed
      return NextResponse.json({ error: 'Invalid note or author ID.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create comment', details: error.message }, { status: 500 });
  }
}
