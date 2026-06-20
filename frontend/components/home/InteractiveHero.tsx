'use client';

import { useEffect, useState } from 'react';
import { Shield, ScanLine, CheckCircle2, AlertTriangle, XCircle, ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const MOCK_CATEGORIES = [
  { name: 'Graphic Violence', score: 0.02, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { name: 'Hate Symbols', score: 0.01, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { name: 'Self-Harm', score: 0.94, color: 'text-rose-500', bg: 'bg-rose-500/10' }, // The triggered one
  { name: 'Nudity', score: 0.05, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
];

export function InteractiveHero() {
  const [step, setStep] = useState(0); // 0: Idle, 1: Scanning, 2: Result
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const cycle = () => {
      setStep(0);
      setProgress(0);
      
      setTimeout(() => {
        setStep(1);
        const interval = setInterval(() => {
          setProgress((p) => {
            if (p >= 100) {
              clearInterval(interval);
              setStep(2);
              return 100;
            }
            return p + 2.5;
          });
        }, 30);
      }, 1000); // Wait 1s before scanning
    };

    cycle();
    const mainInterval = setInterval(cycle, 8000); // Repeat every 8 seconds

    return () => clearInterval(mainInterval);
  }, []);

  return (
    <div className="relative w-full max-w-lg mx-auto transform hover:scale-[1.02] transition-transform duration-500">
      {/* Decorative background glow */}
      <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl blur-2xl opacity-20 animate-pulse"></div>
      
      <Card className="relative border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden rounded-2xl shadow-2xl">
        {/* Mock App Header */}
        <div className="flex items-center gap-2 p-4 border-b border-white/5 bg-white/5">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
          </div>
          <span className="ml-2 text-xs font-mono text-white/40">moderra-engine-v2</span>
        </div>

        <div className="p-6 space-y-6">
          {/* Scanning Box */}
          <div className="relative aspect-video rounded-lg border border-white/10 bg-black/60 flex items-center justify-center overflow-hidden">
            {step === 0 && (
              <div className="flex flex-col items-center gap-2 text-white/40 animate-in fade-in zoom-in duration-500">
                <ImageIcon className="w-10 h-10" />
                <span className="text-sm font-medium">Awaiting input...</span>
              </div>
            )}
            
            {(step === 1 || step === 2) && (
              <>
                {/* Fake Image Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 opacity-50"></div>
                <ImageIcon className="absolute w-20 h-20 text-white/10" />
                
                {/* Scanning overlay */}
                {step === 1 && (
                  <>
                    <div className="absolute inset-0 flex flex-col justify-end">
                      <div 
                        className="w-full h-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,1)]"
                        style={{ transform: `translateY(-${progress}%)` }}
                      ></div>
                      <div 
                        className="w-full bg-indigo-500/20"
                        style={{ height: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <ScanLine className="w-12 h-12 text-indigo-400 animate-pulse" />
                    </div>
                  </>
                )}

                {/* Result overlay */}
                {step === 2 && (
                  <div className="absolute inset-0 bg-rose-500/20 flex items-center justify-center animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 bg-rose-500/90 text-white px-4 py-2 rounded-full font-medium shadow-lg">
                      <AlertTriangle className="w-5 h-5" />
                      Violation Detected
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Results Panel */}
          <div className={`space-y-3 transition-opacity duration-500 ${step === 2 ? 'opacity-100' : 'opacity-30'}`}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60 font-medium">Analysis Results</span>
              {step === 2 ? (
                <Badge variant="outline" className="text-rose-400 border-rose-500/30 bg-rose-500/10">
                  <XCircle className="w-3 h-3 mr-1" />
                  Auto-Blocked
                </Badge>
              ) : (
                <Badge variant="outline" className="text-indigo-400 border-indigo-500/30 bg-indigo-500/10">
                  Processing...
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              {MOCK_CATEGORIES.map((cat, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-white/5 border border-white/5">
                  <span className="text-white/80">{cat.name}</span>
                  <div className="flex items-center gap-3">
                    <Progress 
                      value={step === 2 ? cat.score * 100 : 0} 
                      className={`h-1.5 w-20 ${step === 2 && cat.score > 0.8 ? '*:bg-rose-500' : '*:bg-emerald-500'} bg-white/10`} 
                    />
                    <span className={`w-8 text-right font-mono ${step === 2 ? cat.color : 'text-white/40'}`}>
                      {step === 2 ? `${Math.round(cat.score * 100)}%` : '--%'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
