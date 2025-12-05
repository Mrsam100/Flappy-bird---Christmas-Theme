import React, { useEffect, useState } from 'react';
import { Rocket, Zap } from 'lucide-react';

interface RetroLoaderProps {
  onComplete: () => void;
}

export const RetroLoader: React.FC<RetroLoaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("INITIALIZING ENGINE");

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 800); // Slight delay at 100% for satisfaction
          return 100;
        }
        // Non-linear loading for realism
        const increment = Math.random() * 2 + (prev > 80 ? 0.5 : 1.5);
        return Math.min(prev + increment, 100); 
      });
    }, 50);

    // Dynamic status text updates
    const statusPoints = [
      { p: 20, t: "LOADING ASSETS..." },
      { p: 40, t: "CALIBRATING PHYSICS..." },
      { p: 60, t: "GENERATING LEVELS..." },
      { p: 80, t: "OPTIMIZING PARTICLES..." },
      { p: 95, t: "READY FOR TAKEOFF" }
    ];

    const statusInterval = setInterval(() => {
        setProgress(current => {
            const match = statusPoints.find(s => Math.abs(current - s.p) < 5);
            if (match) setStatus(match.t);
            return current;
        });
    }, 100);

    return () => {
      clearInterval(interval);
      clearInterval(statusInterval);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center z-50 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black opacity-80"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      
      {/* Content Container */}
      <div className="relative z-10 w-full max-w-md px-8 flex flex-col items-center">
        
        {/* Logo / Icon Area */}
        <div className="mb-12 relative group">
          <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000 animate-pulse"></div>
          <div className="relative bg-gradient-to-br from-slate-800 to-black p-6 rounded-2xl border border-slate-700 shadow-2xl flex items-center justify-center transform transition-transform duration-700 hover:scale-105">
            <Rocket size={48} className="text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          </div>
          
          {/* Orbiting Dot */}
          <div className="absolute top-0 left-0 w-full h-full animate-[spin_3s_linear_infinite]">
             <div className="w-2 h-2 bg-white rounded-full absolute -top-2 left-1/2 shadow-[0_0_10px_white]"></div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-white to-blue-300 tracking-wider mb-2 drop-shadow-lg font-sans">
          SKY RUNNER
        </h1>
        <div className="flex items-center gap-2 text-blue-400/80 text-xs font-mono tracking-[0.3em] mb-12">
           <Zap size={12} /> ULTIMATE EDITION <Zap size={12} />
        </div>

        {/* Progress Bar Container */}
        <div className="w-full relative">
            <div className="flex justify-between text-xs font-mono text-blue-300/70 mb-2">
                <span>{status}</span>
                <span>{Math.floor(progress)}%</span>
            </div>
            
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700 shadow-inner">
                <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 relative transition-all duration-100 ease-out"
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute inset-0 bg-white/30 animate-[shimmer_1s_infinite] w-full" style={{ backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', backgroundSize: '20px 100%' }}></div>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-slate-600 text-[10px] font-mono tracking-widest uppercase">
           Systems Online • V9.2.0 • Secure Connection
        </div>
      </div>
    </div>
  );
};
