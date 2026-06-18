import {
  Sparkles,
  Calendar,
  BarChart3,
  Share2,
  Zap,
  FileOutput
} from "lucide-react";

export function FeatureGrid() {
  const features = [
    {
      icon: Sparkles,
      title: "AI Repurposing",
      description:
        "Turn one source into dozens of platform-native posts."
    },
    {
      icon: Zap,
      title: "Viral Hook Intelligence",
      description:
        "Discover engaging ideas automatically."
    },
    {
      icon: Share2,
      title: "Multi Platform",
      description:
        "Generate content for LinkedIn, X and Instagram."
    },
    {
      icon: Calendar,
      title: "Scheduling",
      description:
        "Plan content weeks ahead."
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description:
        "Measure performance and optimize growth."
    },
    {
      icon: FileOutput,
      title: "Export Anywhere",
      description:
        "Copy, download or publish directly."
    }
  ];

  return (
    <section
      id="features"
      className="border-t border-[#232323] py-36"
    >
      <div className="mx-auto max-w-7xl px-6">

        <div className="mb-20 text-center">

          <p className="text-sm uppercase tracking-[0.3em] text-[#8A8A8A]">
            Features
          </p>

          <h2 className="mt-6 text-5xl font-bold">
            Built For Modern Creators
          </h2>

        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="rounded-[32px] border border-[#232323] bg-[#151515] p-10 transition hover:bg-[#1B1B1B]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#232323] bg-[#111111]">
                  <Icon className="h-6 w-6 text-white" />
                </div>

                <h3 className="mt-8 text-2xl font-semibold">
                  {feature.title}
                </h3>

                <p className="mt-5 leading-8 text-[#8A8A8A]">
                  {feature.description}
                </p>
              </div>
            );
          })}

        </div>
      </div>
    </section>
  );
}
