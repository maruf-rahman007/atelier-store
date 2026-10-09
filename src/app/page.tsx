import { Hero } from "@/components/home/hero";
import {
  Categories,
  FeaturedCollections,
  NewArrivals,
  Services,
  Spotlight,
  Story,
} from "@/components/home/sections";

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <NewArrivals />
      <FeaturedCollections />
      <Spotlight />
      <Story />
      <Categories />
      <Services />
    </main>
  );
}
