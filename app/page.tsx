import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <main className="mx-auto max-w-2xl space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-foreground text-4xl font-bold tracking-tight">MatchVibe</h1>
          <p className="text-muted-foreground text-lg">
            Analyze compatibility between X users with AI-driven vibe scoring
          </p>
        </div>

        <Separator />

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="user1">First X Username</Label>
            <Input id="user1" type="text" placeholder="@username1" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user2">Second X Username</Label>
            <Input id="user2" type="text" placeholder="@username2" />
          </div>

          <Button className="w-full" size="lg">
            Analyze Vibe Match
          </Button>
        </div>

        <Separator />

        <div className="text-muted-foreground text-center text-sm">
          <p>Open-source vibe analysis tool</p>
        </div>
      </main>
    </div>
  );
}
