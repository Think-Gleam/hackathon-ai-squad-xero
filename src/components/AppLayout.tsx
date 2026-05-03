import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { BookOpen, Bot, Gauge, GraduationCap, LogOut, Menu, Moon, Search, Settings, Sun, UserCircle2 } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";

type ThemeMode = "light" | "dark";

const navigation = [
  { label: "Dashboard", to: "/", icon: Gauge },
  { label: "My Learning", to: "/my-learning", icon: GraduationCap },
  { label: "Courses", to: "/courses", icon: BookOpen },
  { label: "AI Tutor", to: "/ai-tutor", icon: Bot },
  { label: "Settings", to: "/settings", icon: Settings },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${
    isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
  }`;

const AppLayout = () => {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [loggingOut, setLoggingOut] = useState(false);
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const firstName = profile?.full_name?.trim().split(" ")[0] ?? "Learner";

  useEffect(() => {
    const savedTheme = localStorage.getItem("edumentor-theme") as ThemeMode | null;
    const nextTheme: ThemeMode = savedTheme ?? "light";
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    setTheme(nextTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("edumentor-theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      toast({ title: "Logged out", description: "Your session has been securely closed." });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden border-r border-border/70 bg-card/65 p-5 backdrop-blur lg:block">
          <div className="mb-6 rounded-md border border-border/70 bg-background/70 p-3">
            <p className="text-xs text-muted-foreground">Profile</p>
            <p className="mt-1 text-sm font-semibold text-foreground">Good morning, {firstName}! 👋</p>
          </div>

          <Link to="/" className="mb-8 flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 text-primary">E</span>
            <div>
              <p className="font-display text-lg">EduMentor</p>
              <p className="text-xs text-muted-foreground">Learning Companion</p>
            </div>
          </Link>

          <nav className="space-y-1">
            {navigation.map((item) => (
              <NavLink key={item.label} to={item.to} className={navLinkClass} end={item.to === "/"}>
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <Button variant="outline" className="mt-6 w-full justify-start gap-2" onClick={() => void handleLogout()} disabled={loggingOut}>
            <LogOut className="h-4 w-4" />
            {loggingOut ? "Logging out..." : "Log Out"}
          </Button>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 px-4 py-3 backdrop-blur md:px-6">
            <div className="flex items-center gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[84vw] max-w-xs p-5">
                  <div className="mb-6 rounded-md border border-border/70 bg-background/70 p-3">
                    <p className="text-xs text-muted-foreground">Profile</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">Good morning, {firstName}! 👋</p>
                  </div>

                  <Link to="/" className="mb-8 flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 text-primary">E</span>
                    <div>
                      <p className="font-display text-lg">EduMentor</p>
                      <p className="text-xs text-muted-foreground">Learning Companion</p>
                    </div>
                  </Link>
                  <nav className="space-y-1">
                    {navigation.map((item) => (
                      <NavLink key={item.label} to={item.to} className={navLinkClass} end={item.to === "/"}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </nav>

                  <Button variant="outline" className="mt-6 w-full justify-start gap-2" onClick={() => void handleLogout()} disabled={loggingOut}>
                    <LogOut className="h-4 w-4" />
                    {loggingOut ? "Logging out..." : "Log Out"}
                  </Button>
                </SheetContent>
              </Sheet>

              <div className="relative hidden flex-1 max-w-xl md:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search lessons, topics, and courses..." className="pl-9" />
              </div>

              <Button variant="outline" size="icon" onClick={toggleTheme} className="ml-auto">
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>

              <div className="hidden items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 sm:flex">
                <UserCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{profile?.full_name ?? "Learner"}</span>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 md:px-6 md:py-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;