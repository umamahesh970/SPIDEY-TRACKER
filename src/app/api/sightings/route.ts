import { NextResponse } from 'next/server';
import { getSightings, addSighting, updateVotes } from '@/lib/store';

export async function GET() {
  try {
    const sightings = await getSightings();
    return NextResponse.json(sightings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load sightings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { latitude, longitude, description, status, creatorId } = body;
    
    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Missing latitude or longitude' }, { status: 400 });
    }

    const newSighting = await addSighting({ 
      latitude, 
      longitude, 
      description: description || 'Spider-Man spotted!',
      status: status === 'confirmed' ? 'confirmed' : 'rumoured',
      creatorId
    });

    return NextResponse.json(newSighting, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add sighting' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id || (action !== 'upvote' && action !== 'downvote')) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const updatedSighting = await updateVotes(id, action);
    if (!updatedSighting) {
      return NextResponse.json({ error: 'Sighting not found' }, { status: 404 });
    }

    return NextResponse.json(updatedSighting, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update votes' }, { status: 500 });
  }
}
