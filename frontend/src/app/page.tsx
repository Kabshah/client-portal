import SiteNavbar from "@/components/shared/site-navbar";
import { buttonVariants } from "@/components/ui/button";
import { getUserInfo } from "@/lib/api/auth";
import { publicApiBaseUrl } from "@/lib/config";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Sparkles,
  Zap,
  ShieldCheck,
  Calendar,
  Layers,
  Link2,
  Paperclip,
  TrendingUp,
  Cpu,
  MailCheck,
  ChevronRight,
} from "lucide-react";

export default async function Home() {
  const user = await getUserInfo();

  if (user) {
    redirect(user.role === "admin" ? "/admin" : "/submissions");
  }

  const loginHref = `${publicApiBaseUrl}/auth/google`;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden selection:bg-emerald-500/20 selection:text-emerald-800">
      <SiteNavbar user={user} />

      <main className="flex-1" id="overview">
        {/* Enterprise Hero Section */}
        <section className="relative pt-10 pb-16 lg:pt-16 lg:pb-24 border-b border-border/60 bg-gradient-to-b from-muted/40 via-background to-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto gap-6">
              


              {/* Main Headline */}
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground leading-[1.12]">
                Client Onboarding Built for{" "}
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 bg-clip-text text-transparent">
                  High-Output Agencies
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-normal max-w-2xl">
                Collect structured briefs, analyze technical readiness with automated AI scoring, and trigger kickoff meeting invites — all in one unified portal.
              </p>

              {/* CTA Group */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 w-full sm:w-auto">
                <a
                  href={loginHref}
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "h-11 sm:h-12 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-7 text-sm sm:text-base font-semibold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                  )}
                >
                  <span>Start Onboarding Request</span>
                  <ArrowRight className="h-4 w-4" />
                </a>

                <a
                  href="#how-it-works"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "h-11 sm:h-12 rounded-lg border-border bg-card hover:bg-muted px-6 text-sm sm:text-base font-medium text-foreground transition-all w-full sm:w-auto"
                  )}
                >
                  Explore Workflow
                </a>
              </div>

              {/* Metrics strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 text-left border-t border-border/60 w-full max-w-xl text-xs">
                <div>
                  <p className="font-bold text-base text-foreground">100% Automated</p>
                  <p className="text-muted-foreground">Automated AI Readiness Review</p>
                </div>
                <div>
                  <p className="font-bold text-base text-foreground">&lt; 2 Min Setup</p>
                  <p className="text-muted-foreground">Client Submission Flow</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="font-bold text-base text-foreground">Direct Gmail</p>
                  <p className="text-muted-foreground">Kickoff Email Triggers</p>
                </div>
              </div>
            </div>

            {/* High-Fidelity Interactive UI Mockup Showcase */}
            <div className="mt-12 lg:mt-16 rounded-xl sm:rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden max-w-5xl mx-auto">
              {/* Window Header */}
              <div className="bg-muted/60 px-4 py-3 border-b border-border/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400/80"></div>
                  <div className="h-3 w-3 rounded-full bg-amber-400/80"></div>
                  <div className="h-3 w-3 rounded-full bg-emerald-400/80"></div>
                </div>
                <div className="bg-background border border-border/60 rounded-md px-3 py-1 text-[11px] font-mono text-muted-foreground text-center truncate max-w-[260px] sm:max-w-md">
                  onboarding.agency.com/submissions/sub_8f92a1
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  LIVE ENGINE
                </div>
              </div>

              {/* Window Dashboard Mockup Content */}
              <div className="p-4 sm:p-6 lg:p-8 bg-background grid gap-6 lg:grid-cols-12">
                {/* Left Side: Client Intake Overview */}
                <div className="lg:col-span-7 flex flex-col gap-4 text-left border-b lg:border-b-0 lg:border-r border-border/60 pb-6 lg:pb-0 lg:pr-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                        Client Proposal
                      </span>
                      <h3 className="text-lg font-bold text-foreground">
                        Acme Digital Studios
                      </h3>
                    </div>
                    <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-500/20">
                      Pending Review
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-muted/30 p-3 rounded-lg border border-border/40">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Service Package</span>
                      <span className="font-semibold text-foreground">Enterprise Web App</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Timeline</span>
                      <span className="font-semibold text-foreground">4-6 Weeks</span>
                    </div>
                  </div>

                  <div className="text-xs space-y-1">
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Attached Assets & Brief</span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="inline-flex items-center gap-1 bg-background border border-border px-2.5 py-1 rounded-md text-[11px] text-foreground font-medium shadow-xs">
                        <Paperclip className="h-3 w-3 text-muted-foreground" /> brand_guidelines.pdf
                      </span>
                      <span className="inline-flex items-center gap-1 bg-background border border-border px-2.5 py-1 rounded-md text-[11px] text-foreground font-medium shadow-xs">
                        <Paperclip className="h-3 w-3 text-muted-foreground" /> wireframes.png
                      </span>
                      <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md text-[11px] text-emerald-700 font-medium">
                        <Link2 className="h-3 w-3 text-emerald-600" /> drive.google.com/folder
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: AI Readiness Score Card */}
                <div className="lg:col-span-5 flex flex-col justify-between text-left gap-4 bg-emerald-950/5 dark:bg-emerald-950/30 p-4 sm:p-5 rounded-xl border border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-bold text-foreground">AI Technical Audit</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                      94 / 100
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-foreground">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Project Scope Clarity
                      </span>
                      <span className="font-semibold text-emerald-600">100%</span>
                    </div>
                    <div className="flex items-center justify-between text-foreground">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Technical Assets Uploaded
                      </span>
                      <span className="font-semibold text-emerald-600">95%</span>
                    </div>
                    <div className="flex items-center justify-between text-foreground">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Timeline Realism
                      </span>
                      <span className="font-semibold text-emerald-600">90%</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <MailCheck className="h-3.5 w-3.5 text-emerald-600" /> Auto-Gmail Ready
                    </span>
                    <button className="bg-emerald-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-sm">
                      Approve & Send Email
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* How It Works Workflow Section */}
        <section className="py-16 sm:py-20 border-b border-border/60 bg-muted/20" id="how-it-works">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Automated 3-Step Client Intake
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                From initial request to kickoff meeting — zero manual email tag or lost documents.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {/* Step 1 */}
              <div className="relative flex flex-col items-start text-left bg-background p-6 rounded-xl border border-border/80 shadow-xs hover:border-emerald-500/40 transition-all">
                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-md mb-4">
                  STEP 01
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white mb-4 shadow-sm">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1.5">
                  Client Intake Form
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Clients fill out service requirements, project goals, timeline, and attach PNGs, PDFs, DOCXs, or Google Drive links with auto-draft save support.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative flex flex-col items-start text-left bg-background p-6 rounded-xl border border-border/80 shadow-xs hover:border-emerald-500/40 transition-all">
                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-md mb-4">
                  STEP 02
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white mb-4 shadow-sm">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1.5">
                  AI Readiness Engine
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Our automated AI engine audits the proposal, flags missing requirements, generates a readiness score, and presents action items to the agency.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative flex flex-col items-start text-left bg-background p-6 rounded-xl border border-border/80 shadow-xs hover:border-emerald-500/40 transition-all">
                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-md mb-4">
                  STEP 03
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white mb-4 shadow-sm">
                  <Calendar className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1.5">
                  Approval & Kickoff Email
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  When the admin clicks Approve, a personalized Gmail welcome email is automatically sent to the client with kickoff meeting scheduling options.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 sm:py-20" id="features">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Engineered for Enterprise Reliability
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Built with precision data validation, draft recovery, and automated SMTP email delivery.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="p-6 rounded-xl border border-border/80 bg-card text-left space-y-3 hover:border-emerald-500/40 transition-all">
                <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Paperclip className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-sm text-foreground">Multi-Format Vault</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Accept PNG, JPEG, PDF, DOCX, PPTX files and Google Drive links simultaneously.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-border/80 bg-card text-left space-y-3 hover:border-emerald-500/40 transition-all">
                <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Layers className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-sm text-foreground">Draft Persistence</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Clients can save progress anytime or auto-save when closing the proposal modal.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-border/80 bg-card text-left space-y-3 hover:border-emerald-500/40 transition-all">
                <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-sm text-foreground">Readiness Analytics</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  AI-calculated readiness scores give your team instant clarity on project viability.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-border/80 bg-card text-left space-y-3 hover:border-emerald-500/40 transition-all">
                <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-sm text-foreground">Secure Gmail SMTP</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Asynchronous email dispatch powered by TLS encryption and customizable meeting links.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Enterprise Footer */}
      <footer className="border-t border-border/80 bg-muted/30 py-8 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              AC
            </div>
            <span className="font-semibold text-foreground">Agency Client Portal</span>
          </div>
          <p>© {new Date().getFullYear()} Agency Client Portal Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-foreground transition-colors cursor-pointer">Privacy</span>
            <span className="hover:text-foreground transition-colors cursor-pointer">Terms</span>
            <span className="hover:text-foreground transition-colors cursor-pointer">System Status</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
