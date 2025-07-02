import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Starfield from '@/components/landing/starfield';

export default function LandingPage() {
  return (
    <div className="bg-background h-screen w-screen relative overflow-hidden">
      <Starfield />
      <main className="absolute inset-0 z-10 flex flex-col items-center justify-center">
        <div className="relative text-center">
          <h1 className="font-headline text-7xl md:text-9xl font-bold text-white animate-fade-in-down select-none">
            Andromeda
          </h1>
          <p className="mt-4 text-lg text-muted-foreground animate-fade-in-up [animation-delay:250ms]">Visually organize your ideas and bring them to life.</p>
        </div>
        <div className="mt-8 animate-fade-in-up [animation-delay:500ms]">
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 text-lg font-semibold">
            <Link href="/home">Get Started</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
