import { ArrowUpRight, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { AnimatedGridPattern } from "../ui/animated-grid-pattern";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function BlogCTA() {
  return (
    <section className="px-6 my-20">
      <div className="dark:border relative overflow-hidden w-full dark bg-background text-foreground max-w-screen-lg mx-auto rounded-3xl py-12 md:py-16 px-8 md:px-16 border-2">
        <AnimatedGridPattern
          numSquares={30}
          maxOpacity={0.1}
          duration={3}
          className={cn(
            "[mask-image:radial-gradient(400px_circle_at_right,white,rgba(255,255,255,0.6),transparent)]",
            "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12"
          )}
        />
        <AnimatedGridPattern
          numSquares={30}
          maxOpacity={0.1}
          duration={3}
          className={cn(
            "[mask-image:radial-gradient(400px_circle_at_top_left,white,rgba(255,255,255,0.6),transparent)]",
            "inset-x-0 inset-y-0 h-[200%] skew-y-12"
          )}
        />
        <div className="relative z-0 flex flex-col gap-4 max-w-2xl">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            Join 10,000+ accounting professionals who save hours every week with BS Convert. Start converting for free today—no credit card required.
          </p>
        </div>
        <div className="relative z-0 mt-10 flex flex-col sm:flex-row gap-3">
          <Button size="lg" className="text-base" asChild>
            <Link href="/auth/signup">
              Start Converting Free <ArrowUpRight className="h-5 w-5 ml-1.5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="text-base" asChild>
            <Link href="/landing#pricing">
              <Sparkles className="h-5 w-5 mr-2" /> View Pricing
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
