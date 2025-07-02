"use client";
import React from 'react';
import { Home, Map, BrainCircuit } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarHeader,
} from '@/components/ui/sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getHeaderTitle = () => {
    // If on a specific map page, try to get the name from the query params.
    if (pathname.startsWith('/maps/') && pathname.split('/').length > 2) {
      const mapName = searchParams.get('name');
      if (mapName) {
        return decodeURIComponent(mapName);
      }
      return 'Map'; // Fallback if name is not in URL
    }

    // Default behavior for other pages like /home or /maps
    return pathname.split('/').pop()?.replace('-', ' ') || 'Home';
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
            <Link href="/home" className="flex items-center gap-3">
                 <BrainCircuit className="w-8 h-8 text-primary"/>
                <span className="text-xl font-semibold">Andromeda</span>
            </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/home'} tooltip={{children: 'Home', side: 'right'}}>
                <Link href="/home">
                  <Home />
                  <span>Home</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/maps')} tooltip={{children: 'Maps', side: 'right'}}>
                <Link href="/maps">
                  <Map />
                  <span>Maps</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="p-4 border-b flex items-center gap-4 sticky top-0 bg-background/95 backdrop-blur-sm z-20">
          <SidebarTrigger />
          <h2 className="text-xl font-semibold capitalize">
            {getHeaderTitle()}
          </h2>
        </header>
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
