import { NextRequest, NextResponse } from 'next/server';
import { getMap, updateMap, deleteMap, renameMap } from '@/services/map-service';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const map = await getMap(params.id);
    if (!map) return NextResponse.json({ error: 'Map not found.' }, { status: 404 });
    return NextResponse.json(map);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch map.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { nodes, connections } = await req.json();
    await updateMap({ id: params.id, nodes, connections });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update map.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await deleteMap(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete map.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { newName } = await req.json();
    const map = await renameMap(params.id, newName);
    if (!map) return NextResponse.json({ error: 'Map not found.' }, { status: 404 });
    return NextResponse.json(map);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to rename map.' }, { status: 500 });
  }
} 