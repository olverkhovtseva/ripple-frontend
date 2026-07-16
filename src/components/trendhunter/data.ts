export const TOP_NAV_LINKS = [
  { label: "Trends & Insights", href: "#trends" },
  { label: "Solutions", href: "#solutions" },
  { label: "Events", href: "#events" },
  { label: "About", href: "#about" },
] as const;

export const CATEGORIES = [
  "All",
  "AI",
  "Tech",
  "Life",
  "Culture",
  "Design",
  "Ads",
  "Business",
  "Eco",
  "Good",
  "Luxury",
  "Fashion",
  "Bizarre",
  "Keynotes",
] as const;

export type HeroCard = {
  id: string;
  image: string;
  alt: string;
  date: string;
  title: string;
  description: string;
};

export const HERO_CARDS: HeroCard[] = [
  {
    id: "card-1",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
    alt: "Retro cellphone on a desk",
    date: "JUL 7, 2026",
    title: "SMARTPHONE ALTERNATIVE CELLPHONE MODELS",
    description:
      "Anti-Distraction Devices — Low-tech mobile formats create space for connectivity products that preserve essential communication while reducing attention demands.",
  },
  {
    id: "card-2",
    image:
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=80",
    alt: "Pink ballet-inspired shoes",
    date: "JUL 9, 2026",
    title: "BALLET FOOTWEAR COLLECTION",
    description:
      "Ballet-Inspired Comfortwear — Heritage dance aesthetics paired with ergonomic construction signal opportunities for premium footwear that merges comfort with fashion-led styling.",
  },
  {
    id: "card-3",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
    alt: "Translucent digital watch",
    date: "JUL 11, 2026",
    title: "TRANSPARENT DIGITAL WATCHES",
    description:
      "Transparent Wearables — Translucent materials in watches and accessories create new avenues for products that reveal construction details while delivering a futuristic, collectible aesthetic.",
  },
  {
    id: "card-4",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
    alt: "Sport sneaker on surface",
    date: "JUL 11, 2026",
    title: "ADAPTIVE TRAIL RUNNER FOOTWEAR",
    description:
      "Hybrid Trail Footwear — Blended running and hiking silhouettes signal demand for versatile outdoor products that perform across speed, terrain, and everyday mobility needs.",
  },
  {
    id: "card-5",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80",
    alt: "Plush toys in baskets",
    date: "JUN 17, 2026",
    title: "PATRIOTIC PLUSH COMPANIONS",
    description:
      "Commemorative Comfort Toys — Milestone-themed plush products blend emotional keepsake value with everyday comfort, creating space for collectible soft goods tied to celebrations.",
  },
  {
    id: "card-6",
    image:
      "https://images.unsplash.com/photo-1478131143278-32c718a0fc91?auto=format&fit=crop&w=1200&q=80",
    alt: "Camping setup outdoors",
    date: "JUL 12, 2026",
    title: "INFLATABLE CAMPING TENTS",
    description:
      "Inflatable Shelter Systems — Air-supported structures create faster campsite assembly and reduced component complexity, opening space for compact outdoor products.",
  },
  {
    id: "card-7",
    image:
      "https://images.unsplash.com/photo-1556906781-95a6d5c24fbb?auto=format&fit=crop&w=1200&q=80",
    alt: "Kitchen appliance",
    date: "JUL 9, 2026",
    title: "SPORTSWEAR INNOVATION SUMMITS",
    description:
      "Sensory Performance Branding — Identities built around tangible sensations translate technical benefits into emotionally resonant consumer experiences.",
  },
];

export const EMERGING_ITEMS = [
  {
    date: "JUL 13, 2026",
    category: "Lifestyle",
    title: "Grassroots Football Giveaways",
    kicker: "Grassroots Sports Sponsorship",
    description:
      "Local amateur teams are becoming high-value community media channels where hospitality brands convert modest funding into loyalty and repeat visits.",
  },
  {
    date: "JUL 12, 2026",
    category: "Art & Design",
    title: "Hiking Sandal Sneakers",
    kicker: "Hybrid Outdoor Footwear",
    description:
      "Luxury sneaker-sandal silhouettes merge trail-ready function, ventilation, and fashion-led styling in one premium design.",
  },
  {
    date: "JUL 12, 2026",
    category: "Lifestyle",
    title: "Compact Travel Trailers",
    kicker: "Entry-Level RV Design",
    description:
      "Premium trailer makers create smaller, lower-cost models that preserve brand identity while widening access for first-time owners.",
  },
] as const;

