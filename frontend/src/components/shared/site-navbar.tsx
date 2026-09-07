import { cn } from "@/lib/utils";
import { buttonVariants } from "../ui/button";
import { User } from "@/types/auth";
import Link from "next/link";
import { publicApiBaseUrl } from "@/lib/config";
import LogoutButton from "./logout-button";
import { Briefcase, ArrowUpRight } from "lucide-react";

function SiteNavbar({ user }: { user: User | null }) {
  const workspaceHref = user?.role === "admin" ? "/admin" : "/submissions";

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 h-16">
        {/* Brand */}
        <Link className="flex items-center gap-3 group" href="/">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-600 to-teal-500 text-white shadow-sm shadow-emerald-600/20 group-hover:scale-105 transition-transform">
            <Briefcase className="h-4.5 w-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-foreground">
              Agency Portal
            </span>
            <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline-block">
              Client Onboarding System
            </span>
          </div>
        </Link>

        {/* Center Nav Links (Only when logged out on public landing page) */}
        {!user && (
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#overview" className="hover:text-foreground transition-colors">
              Overview
            </a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              Workflow
            </a>
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
          </nav>
        )}

        {/* Action Buttons */}
        {user ? (
          <div className="flex items-center gap-3">
            {user.email && (
              <span className="text-xs font-medium text-muted-foreground hidden sm:inline-block border border-border/60 bg-muted/40 px-2.5 py-1 rounded-md">
                {user.email}
              </span>
            )}
            <LogoutButton />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href={`${publicApiBaseUrl}/auth/google`}
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 text-sm font-semibold shadow-sm transition-all flex items-center gap-1.5"
              )}
            >
              <span>Sign In</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export default SiteNavbar;
