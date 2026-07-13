"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { motion } from "framer-motion";

const MotionLink = motion.create(Link);

export function UserMenu() {
  return (
    <div className="flex items-center gap-4">
      <MotionLink
        aria-label="Profile Settings"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#232323] bg-[#151515] text-[#8A8A8A] transition-colors hover:text-white"
        href="/settings"
        transition={{ type: "spring", stiffness: 450, damping: 15 }}
        whileHover={{ scale: 1.12, rotate: 4 }}
        whileTap={{ scale: 0.92 }}
      >
        <User className="h-5 w-5" />
      </MotionLink>
    </div>
  );
}
