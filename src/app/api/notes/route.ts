
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// Proper session/auth checking should be implemented here
// For example, using a middleware or a session utility.

export async function GET(request: Request) {
  // TODO: Implement proper authentication and authorization
  // For now, fetching all notes. In a real app, filter by authorId based on session.
  // const { searchParams } = new URL(request.url);
  // const userId = searchParams.get('userId'); // Example: if you want to fetch for a specific user as admin

  try {
    const notes = await prisma.note.findMany({
      orderBy: { eventDate: 'desc' },
      include: { 
        categories: { select: { id: true, name: true }}, // Fetch related categories
        author: { select: { username: true }} // Fetch author's username
      },
    });
    return NextResponse.json(notes.map(note => ({
      ...note,
      eventDate: note.eventDate ? note.eventDate.toISOString() : null,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    })));
  } catch (error: any) {
    console.error('Failed to fetch notes API:', error); // Log the actual error on the server
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred on the server.';
    return NextResponse.json({ error: 'Failed to fetch notes from API', details: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // TODO: Implement proper authentication and authorization
  // Ensure the authorId is set to the ID of the logged-in user.
  try {
    const data = await request.json();
    const { title, content, eventDate, categoryIds, tags, province, phoneNumbers, isArchived, isPublished, authorId } = data;

    // Basic validation (use Zod for robust validation)
    if (!title || !content || !eventDate || !authorId || !province) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const newNote = await prisma.note.create({
      data: {
        title,
        content,
        eventDate: new Date(eventDate),
        tags: tags || [],
        province,
        phoneNumbers: phoneNumbers || [],
        isArchived: isArchived || false,
        isPublished: isPublished || false,
        authorId: authorId, // This should come from the authenticated user's session
        categories: categoryIds ? {
          connect: categoryIds.map((id: string) => ({ id: id }))
        } : undefined,
      },
      include: {
        categories: { select: { id: true, name: true }},
        author: { select: { username: true }}
      }
    });
    return NextResponse.json({
        ...newNote,
        eventDate: newNote.eventDate ? newNote.eventDate.toISOString() : null,
        createdAt: newNote.createdAt.toISOString(),
        updatedAt: newNote.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create note API:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('title')) {
      // Example: Handle unique constraint violation for title if you add one
      return NextResponse.json({ error: 'A note with this title already exists.' }, { status: 409 });
    }
    if (error.code === 'P2025') {
        // Foreign key constraint failed (e.g. authorId or categoryId does not exist)
        return NextResponse.json({ error: 'Invalid author or category ID.' }, { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred on the server.';
    return NextResponse.json({ error: 'Failed to create note', details: errorMessage }, { status: 500 });
  }
}

