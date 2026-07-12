"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    router.push(`/signup?email=${encodeURIComponent(email.trim())}`);
  };

  return (
    <section id="cta" className="border-t border-[#232323] py-36 scroll-mt-20">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-white">
          Ready to repurpose your content?
        </h2>

        <p className="mx-auto mt-8 max-w-2xl text-lg text-[#8A8A8A]">
          Generate LinkedIn posts, X threads, Instagram captions, Facebook updates, Threads and YouTube Community posts without starting from scratch.
        </p>

        <form 
          onSubmit={handleSubmit} 
          className="mx-auto mt-12 max-w-md flex items-center justify-between rounded-full border border-[#232323] bg-[#0E0E0E] p-1.5 pl-6 focus-within:border-white/30 focus-within:shadow-[0_0_20px_rgba(255,255,255,0.02)] transition-all duration-300"
        >
          <input
            type="email"
            placeholder="Enter your email address"
            required
            className="flex-1 bg-transparent py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none border-none pr-4 font-sans"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="rounded-full bg-white hover:bg-zinc-200 text-black shrink-0 active:scale-95 transition-all duration-200"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </section>
  );
}
