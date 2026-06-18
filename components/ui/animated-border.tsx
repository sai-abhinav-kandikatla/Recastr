import React from "react";

export function AnimatedBorderCard({ children }: { children: React.ReactNode }) {
  return (
    // 1. The outer container: Needs hidden overflow and p-[1px] to define border thickness
    <div className="relative overflow-hidden rounded-xl p-[1px] shadow-2xl shadow-violet-500/10">
      
      {/* 2. The spinning light beam: A massive element spinning infinitely */}
      <span className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_75%,#8b5cf6_100%)]" />
      
      {/* 3. The inner card: Solid dark background to mask the middle of the spinning circle */}
      <div className="relative h-full w-full rounded-xl bg-[#0B1020]">
        {children}
      </div>
      
    </div>
  );
}
