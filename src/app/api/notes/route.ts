
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
      orderBy: { updatedAt: 'desc' }, // Changed from eventDate to updatedAt for more reliable sorting
      include: {
        categories: { select: { id: true, name: true }}, // Fetch related categories
        author: { select: { username: true }} // Fetch author's username
      },
    });
    return NextResponse.json(notes.map(note => {
      let parsedTags: string[] = [];
      try {
        if (note.tags) {
          parsedTags = JSON.parse(note.tags);
        }
      } catch (e) {
        console.error(`Failed to parse tags for note ${note.id}:`, note.tags, e);
        // Keep parsedTags as empty array on error
      }

      let parsedPhoneNumbers: string[] = [];
      try {
        if (note.phoneNumbers) {
          parsedPhoneNumbers = JSON.parse(note.phoneNumbers);
        }
      } catch (e) {
        console.error(`Failed to parse phoneNumbers for note ${note.id}:`, note.phoneNumbers, e);
        // Keep parsedPhoneNumbers as empty array on error
      }

      return {
        ...note,
        eventDate: note.eventDate ? note.eventDate.toISOString() : null,
        createdAt: note.createdAt ? note.createdAt.toISOString() : new Date().toISOString(), // Added fallback
        updatedAt: note.updatedAt ? note.updatedAt.toISOString() : new Date().toISOString(), // Added fallback
        tags: parsedTags,
        phoneNumbers: parsedPhoneNumbers,
      };
    }));
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
        tags: JSON.stringify(tags || []),
        province,
        phoneNumbers: JSON.stringify(phoneNumbers || []),
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

    let parsedTagsNew: string[] = [];
    try {
      if (newNote.tags) {
        parsedTagsNew = JSON.parse(newNote.tags);
      }
    } catch (e) {
        console.error(`Failed to parse tags for newly created note ${newNote.id}:`, newNote.tags, e);
    }

    let parsedPhoneNumbersNew: string[] = [];
    try {
      if (newNote.phoneNumbers) {
        parsedPhoneNumbersNew = JSON.parse(newNote.phoneNumbers);
      }
    } catch (e) {
         console.error(`Failed to parse phoneNumbers for newly created note ${newNote.id}:`, newNote.phoneNumbers, e);
    }

    return NextResponse.json({
        ...newNote,
        eventDate: newNote.eventDate ? newNote.eventDate.toISOString() : null,
        createdAt: newNote.createdAt ? newNote.createdAt.toISOString() : new Date().toISOString(), // Added fallback
        updatedAt: newNote.updatedAt ? newNote.updatedAt.toISOString() : new Date().toISOString(), // Added fallback
        tags: parsedTagsNew,
        phoneNumbers: parsedPhoneNumbersNew,
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
