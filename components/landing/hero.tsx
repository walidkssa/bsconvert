import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, CirclePlay, Sparkles } from "lucide-react";
import Link from "next/link";
import AccountingToolsCloud from "./accounting-tools-cloud";

const Hero = () => {
  return (
    <div className="min-h-[calc(100vh-6rem)] flex flex-col items-center py-20 px-6">
      <div className="md:mt-6 flex items-center justify-center">
        <div className="text-center max-w-3xl">
          <Badge className="bg-primary rounded-full py-1 border-none">
            <Sparkles className="h-3 w-3 mr-1" />
            Powered by Grok AI - Extract with 99% Accuracy
          </Badge>
          <h1 className="mt-6 max-w-[24ch] mx-auto text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold !leading-[1.2] tracking-tight">
            Transform Bank Statements into{" "}
            <span className="text-muted-foreground">
              Accounting Files
            </span>
            {" "}in Seconds
          </h1>
          <p className="mt-6 max-w-[60ch] mx-auto xs:text-lg text-muted-foreground">
            Convert your PDF bank statements to FEC, Sage, Cegid, QuickBooks, and Xero formats instantly. AI-powered extraction with 99% accuracy. Trusted by 10,000+ accountants and businesses worldwide.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row items-center sm:justify-center gap-4">
            <Button
              size="lg"
              className="w-full sm:w-auto rounded-full text-base"
              asChild
            >
              <Link href="/auth/signup">
                Start Converting Free <ArrowUpRight className="!h-5 !w-5 ml-1" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto rounded-full text-base shadow-none"
              asChild
            >
              <Link href="#demo">
                <CirclePlay className="!h-5 !w-5 mr-2" /> See How It Works
              </Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>10,000+ conversions</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>First credit totally free</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No credit card required</span>
            </div>
          </div>
        </div>
      </div>
      <AccountingToolsCloud className="mt-24 max-w-4xl mx-auto" />
    </div>
  );
};

export default Hero;
