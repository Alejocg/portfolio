/**
 * The exhibition catalogue.
 *
 * Each project hangs on a wall in the museum, so alongside the usual portfolio
 * fields every entry carries a `frame`: where the canvas sits in world space and
 * which way it looks. Rotations follow the wall it is mounted on --
 * 0 = faces +z (north wall), PI/2 = faces +x (west wall),
 * -PI/2 = faces -x (east wall), PI = faces -z (south wall).
 *
 * Four pieces in a single hall: two facing you as you walk in, one on each side
 * wall so the room has a circuit. The frames are deliberately large -- with
 * this few works, small canvases on a long wall read as a room that is missing
 * something rather than a room that is edited.
 *
 * A frame declares its height and takes its width from the screenshot's own
 * aspect ratio (see `frameSize`). Declaring both by hand is how you end up with
 * four canvases that all look right until you notice every screenshot in the
 * room is subtly stretched: these five range from 1.50:1 to 1.87:1, and nothing
 * about a hand-written `[4.6, 2.7]` complains when they do not match.
 */

import { IMAGE_SIZES } from "./image-sizes";

export type Vec3 = [number, number, number];

export interface Project {
  id: string;
  title: string;
  /** One-line placard text, as it reads on the wall. */
  description: string;
  /** The longer note, shown when a visitor steps up to the piece. */
  note: string;
  /** Museum-placard style credit, standing in for "oil on canvas". */
  medium: string;
  tags: [string, string];
  /** Three short facts, shown as figures on the portfolio page. */
  highlights: [string, string][];
  /** Shown as a status pill; some of these are still being worked on. */
  status: "Live" | "In progress";
  githubLink?: string;
  webLink: string;
  /**
   * The shipped WebP, served straight from public/. Built from the original in
   * `src/media/projects/` by `npm run images`, which is also where its
   * intrinsic size comes from.
   */
  image: string;
  /** Accent colour used for the frame glow and the panel. */
  accent: string;
  frame: {
    position: Vec3;
    rotationY: number;
    /** Canvas height in metres. The width follows the screenshot's aspect. */
    height: number;
  };
}

/** Intrinsic pixel size of a project's screenshot, for aspect and layout. */
export function imageSize(project: Project): [number, number] {
  const key = project.image.replace(/^.*\//, "").replace(/\.\w+$/, "");
  return IMAGE_SIZES[key] ?? [16, 9];
}

/** The canvas as hung: declared height, width from the screenshot's aspect. */
export function frameSize(project: Project): [number, number] {
  const [w, h] = imageSize(project);
  return [project.frame.height * (w / h), project.frame.height];
}

export const projects: Project[] = [
  {
    id: "chiikawabiyori",
    title: "Chiikawabiyori",
    description:
      "A community platform for fans of Chiikawa — forums, news and features, grown to over a million visitors.",
    note: "Built and run single-handedly: product, growth and operations. The hard part was never the forum; it was the moderation and content-quality systems that keep user contributions usable once 150,000 people show up on the same day. The roadmap came from the community itself, through polls and surveys.",
    medium: "React, Supabase, Vercel",
    tags: ["React", "Supabase"],
    highlights: [["1M+", "visitors"], ["150K", "in a single day"], ["Solo", "product, growth, ops"]],
    status: "Live",
    webLink: "https://chiikawabiyori.com",
    image: "/projects/chiikawabiyori.webp",
    accent: "#ff9ec4",
    frame: { position: [-5.6, 2.85, -8.94], rotationY: 0, height: 2.5 },
  },
  {
    id: "tegaru",
    title: "Tegaru",
    description:
      "An AI study companion that turns your own documents and notes into interactive study material.",
    note: "Point it at a document and it builds you something you can actually revise from. A community hub lets people share and clone each other's decks, which turned a private study tool into something with a reason to come back to it.",
    medium: "React, Supabase, Gemini",
    tags: ["React", "Gemini"],
    highlights: [["Docs → decks", "AI-generated study material"], ["Community", "share and clone decks"], ["Gemini", "under the hood"]],
    status: "Live",
    webLink: "https://tegaru.app",
    image: "/projects/tegaru.webp",
    accent: "#8affc1",
    frame: { position: [5.6, 2.85, -8.94], rotationY: 0, height: 2.5 },
  },
  {
    id: "play-reversi",
    title: "Play Reversi",
    description:
      "Cross-platform Reversi for web, iOS and Android — ranked matchmaking, real-time multiplayer and AI opponents.",
    note: "One codebase, three platforms, and a game old enough that the rules are not the interesting part. Ranked matchmaking, real-time games against friends, opponents at several strengths, and tutorials for people who have never placed a stone.",
    medium: "Expo, React Native, Supabase",
    tags: ["React Native", "Supabase"],
    highlights: [["3", "platforms, one codebase"], ["Real-time", "multiplayer"], ["Ranked", "matchmaking and AI"]],
    status: "In progress",
    webLink: "https://playreversi.app",
    image: "/projects/play-reversi.webp",
    accent: "#7ec8ff",
    frame: { position: [-12.94, 2.85, 1.4], rotationY: Math.PI / 2, height: 2.5 },
  },
  {
    id: "acelock",
    title: "AceLock",
    description:
      "A digital wellbeing app for iOS and Android, built around the idea that willpower works better with a witness.",
    note: "Focus Mode blocks the apps you keep opening without deciding to. The part that makes it work is Guardian Unlock: only a trusted friend can let you back in early. Discipline is easy to set up and easy to undo, so the app makes undoing it someone else's decision.",
    medium: "Expo, React Native, Kotlin, Swift, Supabase",
    tags: ["React Native", "Swift / Kotlin"],
    highlights: [["iOS + Android", "native modules"], ["Guardian", "friend-approved unlocks"], ["Focus", "app blocking"]],
    status: "In progress",
    webLink: "https://acelock.app",
    image: "/projects/acelock.webp",
    accent: "#ffb347",
    frame: { position: [12.94, 2.85, 1.4], rotationY: -Math.PI / 2, height: 2.5 },
  },
];

export const profile = {
  name: "Alejo",
  fullName: "Alejo M. Cereto",
  /** Deliberately generic: the point is the building, not the job title. */
  role: "Builder",
  location: "Tokyo, Japan",
  headline: "I'm Alejo, and I build things.",
  blurb:
    "By day I shape products; the rest of the time I build my own. This is a collection of the ones that made it out — mobile apps, an AI study tool, and a community that grew far past what I planned for.",
  about:
    "Product Manager with nine years of shipping consumer and B2B products, currently building 0-to-1 AI products at Rakuten's incubator in Tokyo. Everything in this room, though, I built myself — nights and weekends, front to back.",
  portrait: "/projects/portrait.webp",
  /** Fixed-size social card; see scripts/optimize-images.mjs. */
  ogImage: "/og.jpg",
  linkedin: "https://www.linkedin.com/in/alejocg",
  github: "https://github.com/alejocg",
  site: "https://alejoportfolio.vercel.app",
};

/** Short professional line for the portfolio page's hero. */
export const intro = {
  eyebrow: "Product Manager & Builder · Tokyo",
  /** Split so the middle phrase can be set in italics. */
  headline: ["I shape products by day and ", "build my own", " by night."] as const,
  stats: [
    ["9", "years in product"],
    ["1M+", "visitors to a solo-built platform"],
    ["4", "products built end to end"],
  ] as [string, string][],
};

export const skillGroups: { title: string; items: string[] }[] = [
  {
    title: "Build",
    items: ["React & Next.js", "React Native & Expo", "Supabase", "Building with LLM APIs"],
  },
  {
    title: "Product",
    items: [
      "Product strategy & 0-to-1",
      "Experiment design & A/B testing",
      "Success & counter-metrics",
    ],
  },
  { title: "Ship & measure", items: ["PostHog", "Vercel", "GitHub"] },
];

export const skills = [
  "React & Next.js",
  "React Native & Expo",
  "Supabase",
  "Building with LLM APIs",
  "Product strategy & 0-to-1",
  "Experiment design & A/B testing",
  "Success & counter-metrics",
  "PostHog, Vercel, GitHub",
];
