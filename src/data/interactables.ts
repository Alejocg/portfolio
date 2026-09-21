import { projects } from "./projects";

export type InteractableKind = "artwork" | "attendant" | "plinth" | "portrait" | "plaque";

export interface Interactable {
  id: string;
  kind: InteractableKind;
  /** World position used for the proximity test. */
  position: [number, number, number];
  /** Shown in the reticle prompt, e.g. "Agile Vote". */
  label: string;
  /** Verb shown next to the key hint. */
  verb: string;
}

export const INTERACTABLES: Interactable[] = [
  ...projects.map<Interactable>((p) => ({
    id: p.id,
    kind: "artwork",
    position: p.frame.position,
    label: p.title,
    verb: "Examine",
  })),
  {
    id: "attendant",
    kind: "attendant",
    position: [0, 1.75, 0],
    label: "The Attendant",
    verb: "Consult",
  },
  {
    id: "portrait",
    kind: "portrait",
    position: [0, 2.8, 8.7],
    label: "Portrait of the Artist",
    verb: "Examine",
  },
  {
    id: "plinth",
    kind: "plinth",
    position: [8.5, 1.7, 4],
    label: "Toolkit",
    verb: "Inspect",
  },
  {
    id: "plaque",
    kind: "plaque",
    position: [-7.5, 2.1, 8.7],
    label: "Visitor Information",
    verb: "Read",
  },
];

export const byId = (id: string) => INTERACTABLES.find((i) => i.id === id);
