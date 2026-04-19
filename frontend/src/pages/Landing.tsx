import { Link } from "react-router-dom";
import { BookOpen, Search, BookMarked, Sparkles, Building2, ShieldCheck, ArrowRight, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Search, title: "Smart Search", desc: "Instantly find books across all 3 branches with intelligent filters." },
  { icon: BookMarked, title: "Easy Borrowing", desc: "Issue and return books in seconds with a single click." },
  { icon: Sparkles, title: "Personalised Recs", desc: "Get curated picks based on what you read and love." },
  { icon: Building2, title: "Multi-Branch", desc: "See real-time availability across every CIMAGE library branch." },
  { icon: ShieldCheck, title: "Secure Access", desc: "Role-based access for students, librarians and admins." },
  { icon: GraduationCap, title: "Built for Campus", desc: "Tailored for CIMAGE students, faculty and staff." },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-header text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold">SmartLib</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" className="text-white hover:bg-white/10">Sign in</Button>
            </Link>
            <Link to="/register" className="hidden sm:block">
              <Button className="bg-white text-primary hover:bg-white/90">Get Started</Button>
            </Link>
          </div>
        </div>

        {/* Hero */}
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-2 lg:pb-28 lg:pt-20">
          <div className="animate-fade-in">
            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              CIMAGE College, Patna
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Smart Library,<br /> Smarter Campus
            </h1>
            <p className="mt-5 max-w-lg text-base text-white/85 sm:text-lg">
              The official digital library portal for CIMAGE. Borrow, reserve and discover thousands of titles across all our branches — anytime, anywhere.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                  Sign in to your account <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" className="bg-primary-foreground/10 text-white hover:bg-primary-foreground/20">
                  Create student account
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10">
                  Explore features
                </Button>
              </a>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute inset-0 -z-10 rounded-full bg-white/10 blur-3xl" />
            <div className="relative mx-auto flex h-80 w-80 items-center justify-center animate-float">
              <div className="absolute inset-0 rotate-6 rounded-3xl bg-white/15" />
              <div className="absolute inset-0 -rotate-3 rounded-3xl bg-white/20" />
              <div className="relative flex h-full w-full items-center justify-center rounded-3xl bg-white text-primary shadow-elegant">
                <BookOpen className="h-32 w-32" strokeWidth={1.25} />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="border-t border-white/15 bg-white/5">
          <div className="mx-auto grid max-w-7xl grid-cols-3 gap-4 px-4 py-8 sm:px-6">
            {[
              { v: "50,000+", l: "Books" },
              { v: "10,000+", l: "Students" },
              { v: "3", l: "Branches" },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <p className="text-2xl font-bold sm:text-3xl">{s.v}</p>
                <p className="mt-1 text-xs text-white/80 sm:text-sm">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Everything your library needs</h2>
          <p className="mt-3 text-muted-foreground">Designed for students, librarians and administrators.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card-lift rounded-xl border border-border bg-card p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md gradient-hero text-white">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="font-semibold text-primary">SmartLib</span>
            <span className="text-sm text-muted-foreground">· CIMAGE College, Patna</span>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} CIMAGE Group of Institutions. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
