import React from "react";
import Image from "next/image";

interface AppLoaderProps {
  text?: string;
}

export function AppLoader({ text = "Memuat..." }: AppLoaderProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <style>{`
        .loader-ring {
          position: absolute;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          border: 3px solid transparent;
          border-top-color: hsl(var(--primary));
          border-right-color: hsl(var(--primary) / 0.5);
          animation: spin 2s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
        }
        .loader-ring-inner {
          position: absolute;
          width: 150px;
          height: 150px;
          border-radius: 50%;
          border: 3px solid transparent;
          border-bottom-color: hsl(var(--primary) / 0.8);
          border-left-color: hsl(var(--primary) / 0.2);
          animation: spin-reverse 2.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
        }
        .loader-ring-outer {
          position: absolute;
          width: 250px;
          height: 250px;
          border-radius: 50%;
          border: 1px dashed hsl(var(--primary) / 0.4);
          animation: spin 15s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        .pulse-text {
          animation: pulse-opacity 2s ease-in-out infinite;
        }
        @keyframes pulse-opacity {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .loader-bar {
          width: 40%;
          animation: slide 1.5s ease-in-out infinite;
        }
        @keyframes slide {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
      
      <div className="relative flex flex-col items-center">
        
        {/* Animated Rings around the Logo */}
        <div className="relative flex items-center justify-center mb-16 w-64 h-64">
          {/* Ambient Glow */}
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-[60px] animate-pulse"></div>
          
          <div className="loader-ring-outer"></div>
          <div className="loader-ring"></div>
          <div className="loader-ring-inner"></div>

          {/* Logo in the center */}
          <div className="relative z-10 flex items-center justify-center bg-background/40 p-4 rounded-full backdrop-blur-sm border border-border/20">
             <Image
               src="/company-logos/amertask.svg"
               alt="Amertask Logo"
               width={130}
               height={38}
               className="drop-shadow-sm"
               priority
             />
          </div>
        </div>

        {/* Loading Text & Bar */}
        <div className="flex flex-col items-center gap-5">
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-foreground font-semibold tracking-wide pulse-text text-lg">{text}</span>
            <p className="text-sm text-text-muted">Mempersiapkan ruang kerja Anda...</p>
          </div>
          
          <div className="w-56 h-1.5 bg-background-secondary overflow-hidden rounded-full border border-border/50 shadow-inner">
            <div className="h-full bg-primary rounded-full loader-bar shadow-[0_0_10px_hsl(var(--primary))]"></div>
          </div>
        </div>

      </div>
    </div>
  );
}
