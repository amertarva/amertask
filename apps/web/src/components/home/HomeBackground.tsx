import React from "react";

export default function HomeBackground() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] mix-blend-screen animate-pulse duration-1000" />
      <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[120px] mix-blend-screen" />
    </div>
  );
}
