import { Header } from "@/components/Header";
import { Hero } from "@/components/sections/Hero";
import { IntroStory } from "@/components/sections/IntroStory";
import { Steps } from "@/components/sections/Steps";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex w-full flex-col items-start bg-grayscale-10">
      <Header />
      <main className="flex w-full flex-col items-start">
        <Hero />
        <IntroStory />
        <Steps />
      </main>
      <Footer />
    </div>
  );
}
