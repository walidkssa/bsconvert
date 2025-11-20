import { TooltipProvider } from "@/components/ui/tooltip";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      {children}
    </TooltipProvider>
  );
}
