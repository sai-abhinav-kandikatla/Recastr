import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Footer() {
  const links = [
    { name: "Workflow", href: "/#workflow" },
    { name: "Outputs", href: "/#outputs" },
    { name: "Pricing", href: "/#pricing" },
    { name: "Docs", href: "/docs" },
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <footer className="border-t border-[#232323] bg-[#090909] py-16">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-10 px-6 md:flex-row">
        <div>
          <Logo size="md" className="text-white" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#8A8A8A]">
            Built for creators who publish consistently.
          </p>
          <div className="flex gap-4 mt-6">
            <a href="https://x.com/recastr" target="_blank" rel="noopener noreferrer" className="text-[#8a8a8a] hover:text-white transition-colors" aria-label="X (Twitter)">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="https://linkedin.com/company/recastr" target="_blank" rel="noopener noreferrer" className="text-[#8a8a8a] hover:text-white transition-colors" aria-label="LinkedIn">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-[#8a8a8a] hover:text-white transition-colors" aria-label="YouTube">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.5 12 3.5 12 3.5s-7.518 0-9.388.553a3.002 3.002 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.553 9.388.553 9.388.553s7.518 0 9.388-.553a3.002 3.002 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-[#8a8a8a] hover:text-white transition-colors" aria-label="Instagram">
              <svg className="h-4 w-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-[#8a8a8a] hover:text-white transition-colors" aria-label="Facebook">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a href="https://threads.net" target="_blank" rel="noopener noreferrer" className="text-[#8a8a8a] hover:text-white transition-colors" aria-label="Threads">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.502 17.5c1.782 0 3.258-1.258 3.465-2.923.639.467 1.428.723 2.235.723 1.63 0 2.8-1.07 2.8-2.8v-1C21 7.215 16.785 3 12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c2.122 0 4.07-.736 5.617-1.968l-1.013-1.127C15.343 18.995 13.738 19.5 12 19.5c-4.143 0-7.5-3.357-7.5-7.5s3.357-7.5 7.5-7.5 7.5 3.357 7.5 7.5v1c0 1.045-.555 1.7-1.3 1.7-.551 0-.9-.335-.9-.97v-4.13c0-2.26-1.54-3.6-3.8-3.6h-2C7.24 7.5 5.5 9.24 5.5 11.5v2c0 2.193 1.807 4 4 4h2z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-[#8A8A8A]">
          {links.map((link) => (
            <Link key={link.name} href={link.href} className="transition-colors hover:text-white">
              {link.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-3 border-t border-[#232323] px-6 pt-8 text-sm text-[#52525b] md:flex-row">
        <span>© 2026 Recastr Labs. All rights reserved.</span>
        <span className="italic">by kandikatla sai abhinav</span>
      </div>
    </footer>
  );
}
