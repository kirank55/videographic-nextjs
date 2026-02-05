import { auth } from "@/lib/auth";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Testimonials } from "@/components/landing/testimonials";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";

export const runtime = "nodejs";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar isLoggedIn={!!session?.user} />
      <Hero isLoggedIn={!!session?.user} />
      <Features />
      <HowItWorks />
      <Testimonials />
      <CTA isLoggedIn={!!session?.user} />
      <Footer />
    </div>
  );
}
