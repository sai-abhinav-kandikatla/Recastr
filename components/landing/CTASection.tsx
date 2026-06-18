import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="border-t border-[#232323] py-36">

      <div className="mx-auto max-w-5xl px-6 text-center">

        <h2 className="text-6xl font-bold">
          Ready To Create
          <br />
          30 Days Of Content?
        </h2>

        <p className="mx-auto mt-8 max-w-2xl text-lg text-[#8A8A8A]">
          Generate platform-ready content in minutes.
        </p>

        <Button size="lg" className="mt-12">
          Start Free
        </Button>

      </div>
    </section>
  );
}
