import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth, Role } from "@/context/AuthContext";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password, role);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left — gradient panel */}
      <div className="relative hidden gradient-hero text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold">SmartLib</span>
        </Link>

        <div className="max-w-md">
          <p className="text-2xl font-medium leading-snug">
            “A library is not a luxury but one of the necessities of life.”
          </p>
          <p className="mt-4 text-sm text-white/80">— Henry Ward Beecher</p>
        </div>

        <p className="text-sm text-white/80">CIMAGE College, Patna · Library Portal</p>
      </div>

      {/* Right — form */}
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link to="/" className="flex items-center gap-2 text-primary">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-hero text-white">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold">SmartLib</span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Sign in to access your library account.</p>

          <Tabs value={role} onValueChange={(v) => setRole(v as Role)} className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="student">Student</TabsTrigger>
              <TabsTrigger value="librarian">Librarian</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@cimage.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</>
              ) : (
                <>Sign in as <span className="ml-1 capitalize">{role}</span></>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Trouble signing in? Contact your library administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
