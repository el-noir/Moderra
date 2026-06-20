import Link from 'next/link';
import { Shield, Settings, Users, Activity, ArrowRight, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InteractiveHero } from '@/components/home/InteractiveHero';
import { HomeNavAuth } from '@/components/home/HomeNavAuth';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500/30 overflow-x-hidden flex flex-col">
      {/* Background Mesh */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none -z-10"></div>
      
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Moderra</span>
          </div>
          <div className="flex items-center gap-4">
            <HomeNavAuth />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-40">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10">
              <div className="space-y-8 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mx-auto lg:mx-0">
                  <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  Moderra Engine v2 is live
                </div>
                
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                  Intelligent content <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                    moderation at scale.
                  </span>
                </h1>
                
                <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  Automate your trust and safety operations with zero-shot AI screening. Enforce granular policies, process human appeals, and protect your community without slowing down.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
                  <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 h-12 px-8 text-base" asChild>
                    <Link href="/register">
                      Start Moderating <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="border-slate-700 hover:bg-slate-800 text-slate-300 transition-all hover:scale-105 h-12 px-8 text-base" asChild>
                    <Link href="https://github.com" target="_blank">
                      <Code className="mr-2 w-5 h-5" /> View Source
                    </Link>
                  </Button>
                </div>
              </div>
              
              <div className="lg:pl-12 mt-12 lg:mt-0 max-w-lg mx-auto lg:max-w-none w-full">
                <InteractiveHero />
              </div>
            </div>
          </div>
        </section>

        {/* Bento Feature Grid */}
        <section className="relative py-24 border-t border-white/5 bg-slate-900/20">
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Enterprise-grade safety infrastructure</h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">Everything you need to build, enforce, and iterate on your community guidelines.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <Card className="p-8 bg-slate-900/50 backdrop-blur-sm border-slate-800 hover:bg-slate-800/50 hover:border-indigo-500/50 transition-all duration-300 group">
                <div className="w-14 h-14 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all">
                  <Activity className="w-7 h-7 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-200 mb-3">Zero-Shot AI Engine</h3>
                <p className="text-slate-400 leading-relaxed">Instantly analyze images against multiple policy categories simultaneously with cutting-edge vision models.</p>
              </Card>

              <Card className="p-8 bg-slate-900/50 backdrop-blur-sm border-slate-800 hover:bg-slate-800/50 hover:border-purple-500/50 transition-all duration-300 group md:translate-y-4">
                <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all">
                  <Settings className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-200 mb-3">Granular Policy Control</h3>
                <p className="text-slate-400 leading-relaxed">Adjust confidence thresholds and enforcement actions (Auto-block vs Flag) in real-time. Changes are versioned automatically.</p>
              </Card>

              <Card className="p-8 bg-slate-900/50 backdrop-blur-sm border-slate-800 hover:bg-slate-800/50 hover:border-emerald-500/50 transition-all duration-300 group">
                <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
                  <Users className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-200 mb-3">Human Appeals Loop</h3>
                <p className="text-slate-400 leading-relaxed">Give users a structured way to dispute verdicts. Provide admins with a streamlined queue for manual review and overrides.</p>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950 py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 opacity-50">
            <Shield className="w-5 h-5" />
            <span className="font-semibold tracking-tight">Moderra</span>
          </div>
          <p className="text-sm text-slate-500 text-center md:text-left">
            © {new Date().getFullYear()} AI Content Moderation Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
