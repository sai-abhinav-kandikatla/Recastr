import { Sparkles } from "lucide-react";

export function ContentEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[280px] gap-4 text-center px-8">
      {/* Icon */}
      <div className="w-12 h-12 rounded-full bg-neutral-800/80 flex items-center justify-center border border-neutral-700/50">
        <Sparkles className="h-5 w-5 text-neutral-400" />
      </div>

      {/* Text */}
      <div>
        <h3 className="text-base font-semibold text-white mb-1">Ready to Generate</h3>
        <p className="text-sm text-neutral-400 max-w-xs leading-relaxed">
          Select at least one platform above, choose your rewrite mode, then click{" "}
          <span className="text-white font-medium">Generate Content</span>.
        </p>
      </div>

      {/* Quick tip */}
      <div className="flex items-center gap-1.5 text-xs text-neutral-600 bg-neutral-900 px-3 py-1.5 rounded-full border border-neutral-800">
        <span>💡 Tip:</span>
        <span>Try <strong className="text-neutral-400">Viral</strong> mode for the highest engagement rate</span>
      </div>
    </div>
  );
}
