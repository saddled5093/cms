
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authorFilterUserId = searchParams.get('userId'); // For dashboard, or "view all notes by user X"
  const requestingUserId = searchParams.get('requestingUserId'); // For notes list for the current logged-in user

  try {
    const findManyArgs: any = {
      orderBy: { updatedAt: 'desc' },
      include: {
        categories: { select: { id: true, name: true }},
        author: { select: { username: true }} // author username is enough for list views
      },
    };

    if (authorFilterUserId) {
      // Use case: Dashboard, or "view all notes by user X"
      // Fetches ALL notes (published or not) for the specified authorFilterUserId
      findManyArgs.where = { authorId: authorFilterUserId };
    } else if (requestingUserId) {
      // Use case: General notes list for the logged-in user `requestingUserId`
      // Fetches all globally published notes from ANY author,
      // AND all notes (published or not) by the `requestingUserId`.
      findManyArgs.where = {
        OR: [
          { isPublished: true },
          { authorId: requestingUserId }
        ]
      };
    } else {
      // Use case: Public view, no user context provided (e.g., if an unauthenticated part of an app called this)
      // Show only globally published notes from ANY author.
      findManyArgs.where = { isPublished: true };
    }

    const notes = await prisma.note.findMany(findManyArgs);

    return NextResponse.json(notes.map(note => {
      let parsedTags: string[] = [];
      try {
        if (note.tags && typeof note.tags === 'string') {
          parsedTags = JSON.parse(note.tags);
        } else if (Array.isArray(note.tags)) { 
          parsedTags = note.tags;
        }
      } catch (e) {
        console.error(`Failed to parse tags for note ${note.id}:`, note.tags, e);
      }

      let parsedPhoneNumbers: string[] = [];
      try {
        if (note.phoneNumbers && typeof note.phoneNumbers === 'string') {
          parsedPhoneNumbers = JSON.parse(note.phoneNumbers);
        } else if (Array.isArray(note.phoneNumbers)) {
            parsedPhoneNumbers = note.phoneNumbers;
        }
      } catch (e) {
        console.error(`Failed to parse phoneNumbers for note ${note.id}:`, note.phoneNumbers, e);
      }

      return {
        ...note,
        eventDate: note.eventDate ? note.eventDate.toISOString() : null,
        createdAt: note.createdAt ? note.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: note.updatedAt ? note.updatedAt.toISOString() : new Date().toISOString(),
        tags: parsedTags,
        phoneNumbers: parsedPhoneNumbers,
      };
    }));
  } catch (error: any) {
    console.error('Failed to fetch notes API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred on the server.';
    return NextResponse.json({ error: 'Failed to fetch notes from API', details: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { title, content, eventDate, categoryIds, tags, province, phoneNumbers, isArchived, isPublished, authorId } = data;

    if (!title || !content || !eventDate || !authorId || !province) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newNote = await prisma.note.create({
      data: {
        title,
        content,
        eventDate: new Date(eventDate),
        tags: JSON.stringify(tags || []), // Ensure tags are stringified
        province,
        phoneNumbers: JSON.stringify(phoneNumbers || []), // Ensure phoneNumbers are stringified
        isArchived: isArchived || false,
        isPublished: isPublished || false,
        authorId: authorId,
        categories: categoryIds && categoryIds.length > 0 ? {
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
      if (newNote.tags && typeof newNote.tags === 'string') {
        parsedTagsNew = JSON.parse(newNote.tags);
      }
    } catch (e) {
        console.error(`Failed to parse tags for newly created note ${newNote.id}:`, newNote.tags, e);
    }

    let parsedPhoneNumbersNew: string[] = [];
    try {
      if (newNote.phoneNumbers && typeof newNote.phoneNumbers === 'string') {
        parsedPhoneNumbersNew = JSON.parse(newNote.phoneNumbers);
      }
    } catch (e) {
         console.error(`Failed to parse phoneNumbers for newly created note ${newNote.id}:`, newNote.phoneNumbers, e);
    }

    return NextResponse.json({
        ...newNote,
        eventDate: newNote.eventDate ? newNote.eventDate.toISOString() : null,
        createdAt: newNote.createdAt ? newNote.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: newNote.updatedAt ? newNote.updatedAt.toISOString() : new Date().toISOString(),
        tags: parsedTagsNew,
        phoneNumbers: parsedPhoneNumbersNew,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create note API:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A note with this title/identifier already exists.', details: 'Unique constraint violation.' }, { status: 409 });
    }
    if (error.code === 'P2003') { 
        return NextResponse.json({ error: 'Invalid author or category ID.', details: `Foreign key constraint failed. Ensure author and all categories exist. (Code: ${error.code})` }, { status: 400 });
    }
    if (error.code === 'P2025') { 
        return NextResponse.json({ error: 'Invalid author or category ID.', details: 'One or more referenced authors or categories do not exist.' }, { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred on the server.';
    return NextResponse.json({ error: 'Failed to create note', details: errorMessage }, { status: 500 });
  }
}
