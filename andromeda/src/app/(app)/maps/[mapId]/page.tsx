import { MapCanvas } from '@/components/maps/map-canvas';
import { getMap } from '@/services/map-service';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export default async function MapEditorPage({ params }: { params: { mapId: string } }) {
    const map = await getMap(params.mapId);

    if (!map) {
        notFound();
    }
    
    return (
        <div className="w-full h-[calc(100vh-120px)] flex flex-col">
           <MapCanvas map={map} />
        </div>
    );
}
