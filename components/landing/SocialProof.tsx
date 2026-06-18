export function SocialProof() {
  const companies = [
    "Creators",
    "Founders",
    "Agencies",
    "Podcasters",
    "Startups",
  ];

  return (
    <section className="border-y border-[#232323] bg-[#090909]">
      <div className="mx-auto max-w-7xl px-6 py-16">

        <p className="mb-10 text-center text-sm uppercase tracking-[0.3em] text-[#8A8A8A]">
          Trusted by creators, founders and agencies
        </p>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-5">

          {companies.map((company) => (
            <div
              key={company}
              className="flex h-24 items-center justify-center rounded-3xl border border-[#232323] bg-[#111111]"
            >
              <span className="text-lg font-medium text-white">
                {company}
              </span>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}
