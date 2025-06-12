
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// import { getServerSession } from "next-auth/next" // Example: if using NextAuth
// import { authOptions } from "@/app/api/auth/[...nextauth]/route" // Example

// GET handler to fetch a single note by ID
export async function GET(
  request: Request,
  { params }: { params: { noteId: string } }
) {
  const noteId = params.noteId;
  if (!noteId) {
    return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
  }

  // TODO: Add authentication and authorization (e.g., ensure user can access this note)

  try {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        categories: { select: { id: true, name: true } },
        author: { select: { username: true, id: true } }, // Include author username and ID
        comments: {
          include: { author: { select: { username: true, id: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...note,
      eventDate: note.eventDate ? note.eventDate.toISOString() : null,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
      tags: note.tags ? JSON.parse(note.tags) : [],
      phoneNumbers: note.phoneNumbers ? JSON.parse(note.phoneNumbers) : [],
      comments: note.comments.map(comment => ({
        ...comment,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Failed to fetch note:', error);
    return NextResponse.json({ error: 'Failed to fetch note', details: error.message }, { status: 500 });
  }
}


// PUT handler to update a note by ID
export async function PUT(
  request: Request,
  { params }: { params: { noteId: string } }
) {
  const noteId = params.noteId;
  if (!noteId) {
    return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
  }

  // TODO: Add authentication and authorization (e.g., ensure user is the author or admin)

  try {
    const data = await request.json();
    const { title, content, eventDate, categoryIds, tags, province, phoneNumbers, isArchived, isPublished /* authorId should not be changed here */ } = data;

    // Basic validation (use Zod for robust validation in a real app)
    if (!title || !content || !eventDate || !province) {
        return NextResponse.json({ error: 'Missing required fields: title, content, eventDate, province' }, { status: 400 });
    }

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: {
        title,
        content,
        eventDate: new Date(eventDate),
        tags: JSON.stringify(tags || []),
        province,
        phoneNumbers: JSON.stringify(phoneNumbers || []),
        isArchived: isArchived || false,
        isPublished: isPublished || false,
        // Do not update authorId here
        categories: {
          set: categoryIds && categoryIds.length > 0 ? categoryIds.map((id: string) => ({ id: id })) : [], // Use set to replace all categories
        },
      },
      include: {
        categories: { select: { id: true, name: true } },
        author: { select: { username: true, id: true } },
        comments: {
          include: { author: { select: { username: true, id: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return NextResponse.json({
      ...updatedNote,
      eventDate: updatedNote.eventDate ? updatedNote.eventDate.toISOString() : null,
      createdAt: updatedNote.createdAt.toISOString(),
      updatedAt: updatedNote.updatedAt.toISOString(),
      tags: updatedNote.tags ? JSON.parse(updatedNote.tags) : [],
      phoneNumbers: updatedNote.phoneNumbers ? JSON.parse(updatedNote.phoneNumbers) : [],
      comments: updatedNote.comments.map(comment => ({
        ...comment,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Failed to update note:', error);
    if (error.code === 'P2025') { // Record to update not found
      return NextResponse.json({ error: 'Note not found for update' }, { status: 404 });
    }
    if (error.code === 'P2003' || error.code === 'P2025') { // Foreign key constraint failed or referenced record not found
        return NextResponse.json({ error: 'Invalid category ID provided for update.', details: `Foreign key constraint failed or category not found. (Details: ${error.meta?.field_name || 'N/A'})` }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update note', details: error.message }, { status: 500 });
  }
}

// DELETE handler to delete a note by ID
export async function DELETE(
  request: Request,
  { params }: { params: { noteId: string } }
) {
  const noteId = params.noteId;
  if (!noteId) {
    return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
  }

  // TODO: Add authentication and authorization (e.g., ensure user is the author or admin)

  try {
    // First, delete related comments (if CASCADE delete is not set up in Prisma schema)
    await prisma.comment.deleteMany({
      where: { noteId: noteId },
    });
    
    // Then, delete the note itself
    await prisma.note.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ message: 'Note deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to delete note:', error);
    if (error.code === 'P2025') { // Record to delete not found
      return NextResponse.json({ error: 'Note not found for deletion' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete note', details: error.message }, { status: 500 });
  }
}
