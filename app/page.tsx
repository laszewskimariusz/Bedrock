import Link from 'next/link';
import { Button } from '../components/ui/button';
import { FileText, Users, Calendar, Star, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6">
        <div className="flex items-center gap-2">
          <FileText className="h-8 w-8" />
          <span className="text-2xl font-bold">Bedrock</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/auth/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Your connected workspace for everything
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Write, plan, and get organized. Bedrock is the connected workspace where 
            better, faster work happens.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/dashboard">
              <Button size="lg" className="gap-2">
                Try Demo
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="lg" variant="outline">
                Sign up for free
              </Button>
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <div className="p-6 rounded-xl bg-card border shadow-sm">
              <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Write & Plan</h3>
              <p className="text-muted-foreground">
                Express ideas clearly with rich text editing, links, and embeds.
              </p>
            </div>
            
            <div className="p-6 rounded-xl bg-card border shadow-sm">
              <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Collaborate</h3>
              <p className="text-muted-foreground">
                Work together in real-time with comments, mentions, and sharing.
              </p>
            </div>
            
            <div className="p-6 rounded-xl bg-card border shadow-sm">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Organize</h3>
              <p className="text-muted-foreground">
                Structure your work with databases, calendars, and workflows.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
