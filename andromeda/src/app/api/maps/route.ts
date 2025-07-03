import { NextRequest, NextResponse } from 'next/server';
import { getMaps, createMap } from '@/services/map-service';

export async function GET() {
  try {
    const maps = await getMaps();
    return NextResponse.json(maps);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch maps.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    const map = await createMap(name);
    return NextResponse.json(map, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create map.' }, { status: 500 });
  }
} 