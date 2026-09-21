import { useEffect, useRef } from "react";
import { useMuseum } from "../museum/store";
import { profile, projects, skills } from "../../data/projects";
import { ATTENDANT_LINES, PLAQUE_TEXT, PLINTH_TEXT, PORTRAIT_TEXT } from "../../data/dialogue";

/**
 * Every overlay the visitor can open. One component so that focus handling,
 * escape behaviour and the shared chrome only exist in a single place.
 */
export default function Panels() {
  const phase = useMuseum((s) => s.phase);
  const activeId = useMuseum((s) => s.activeId);
  const close = useMuseum((s) => s.close);
  const panelRef = useRef<HTMLDivElement>(null);

  // Move focus into the panel when it opens so keyboard and screen-reader users
  // land on the content rather than being stranded behind the canvas.
  useEffect(() => {
    if (phase === "reading") panelRef.current?.focus();
  }, [phase, activeId]);

  if (phase !== "reading" || !activeId) return null;

  const project = projects.find((p) => p.id === activeId);

  return (
    <>
      {/* The scrim reaches the edges of the glass; the panel does not. Tinting
          only the safe box would leave a bright band across the notch. */}
      <button
        type="button"
        aria-label="Close and return to the museum"
        onClick={close}
        className="fixed inset-0 z-30 cursor-default bg-ink-950/70 backdrop-blur-sm"
      />

      <div className="pointer-events-none fixed inset-safe z-30 flex items-center justify-center p-4 sm:p-8">
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
        className="animate-rise glass pointer-events-auto relative max-h-full w-full max-w-2xl overflow-y-auto overscroll-contain rounded-lg p-5 outline-none sm:p-9"
      >
        {activeId === "attendant" ? (
          <AttendantDialogue />
        ) : project ? (
          <ProjectPanel id={activeId} />
        ) : activeId === "plinth" ? (
          <ToolkitPanel />
        ) : activeId === "portrait" ? (
          <PortraitPanel />
        ) : (
          <ContactPanel />
        )}

        <button
          type="button"
          onClick={close}
          className="control mt-8 w-full rounded border border-brass-500/30 px-4 py-3.5 text-[0.7rem] uppercase tracking-[0.2em] text-paper-500 transition-colors hover:border-brass-400/60 hover:text-paper-100"
        >
          Return to the gallery
          <span className="ml-2 text-paper-700">Esc</span>
        </button>
      </div>
      </div>
    </>
  );
}

function PanelHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header>
      <p className="text-[0.65rem] uppercase tracking-[0.3em] text-brass-400">{subtitle}</p>
      <h2
        id="panel-title"
        className="mt-2 font-display text-4xl leading-tight text-paper-100 sm:text-5xl"
      >
        {title}
      </h2>
      <div className="hairline mt-5 h-px w-full" />
    </header>
  );
}

function ProjectPanel({ id }: { id: string }) {
  const project = projects.find((p) => p.id === id)!;

  return (
    <article>
      <PanelHeading title={project.title} subtitle={project.medium} />

      <p className="mt-3 inline-flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.18em] text-paper-500">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: project.status === "Live" ? "#8affc1" : "#ffb347" }}
        />
        {project.status}
      </p>

      <img
        src={project.image}
        alt={`Screenshot of ${project.title}`}
        loading="lazy"
        className="mt-6 w-full rounded border border-ink-600 shadow-2xl"
      />

      <p className="mt-6 font-display text-xl leading-relaxed text-paper-300">
        {project.description}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-paper-500">{project.note}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border px-3 py-1 text-[0.7rem] uppercase tracking-[0.12em]"
            style={{
              borderColor: `${project.accent}55`,
              color: project.accent,
              backgroundColor: `${project.accent}12`,
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <a
          href={project.webLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded bg-brass-400 px-5 py-3 text-center text-sm font-medium text-ink-950 transition-transform hover:scale-[1.02] hover:bg-brass-300"
        >
          Visit the live site →
        </a>
        {project.githubLink && (
          <a
            href={project.githubLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded border border-paper-700/50 px-5 py-3 text-center text-sm text-paper-300 transition-colors hover:border-paper-300 hover:text-paper-100"
          >
            Source on GitHub
          </a>
        )}
      </div>
    </article>
  );
}

function AttendantDialogue() {
  const line = useMuseum((s) => s.dialogueLine);
  const advance = useMuseum((s) => s.advanceDialogue);
  const isLast = line >= ATTENDANT_LINES.length - 1;

  return (
    <article>
      <PanelHeading title="The Attendant" subtitle="Gallery systems · online" />

      <p className="mt-7 min-h-[7rem] font-display text-2xl leading-relaxed text-paper-100 sm:text-3xl">
        {ATTENDANT_LINES[line]}
      </p>

      <div className="mt-6 flex items-center gap-1.5" aria-hidden="true">
        {ATTENDANT_LINES.map((_, i) => (
          <span
            key={i}
            className={`h-0.5 flex-1 rounded-full transition-colors duration-500 ${
              i <= line ? "bg-brass-400" : "bg-paper-700/30"
            }`}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => advance(ATTENDANT_LINES.length)}
        className="mt-7 w-full rounded bg-brass-400 px-5 py-3 text-sm font-medium text-ink-950 transition-colors hover:bg-brass-300"
      >
        {isLast ? "End the briefing" : "Go on…"}
        <span className="ml-2 opacity-60">E</span>
      </button>
    </article>
  );
}

function ToolkitPanel() {
  return (
    <article>
      <PanelHeading title={PLINTH_TEXT.title} subtitle={PLINTH_TEXT.subtitle} />
      <p className="mt-6 font-display text-xl leading-relaxed text-paper-300">
        {PLINTH_TEXT.body}
      </p>
      <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {skills.map((skill) => (
          <li
            key={skill}
            className="rounded border border-ink-600 bg-ink-800/60 px-4 py-2.5 text-sm text-paper-300"
          >
            {skill}
          </li>
        ))}
      </ul>
    </article>
  );
}

function PortraitPanel() {
  return (
    <article>
      <PanelHeading title={PORTRAIT_TEXT.title} subtitle={PORTRAIT_TEXT.subtitle} />
      <img
        src={profile.portrait}
        alt={`Portrait of ${profile.name}`}
        className="mt-6 w-40 rounded border border-brass-500/40"
      />
      <p className="mt-6 font-display text-2xl leading-relaxed text-paper-100">
        {profile.headline}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-paper-300">{profile.about}</p>
      <p className="mt-4 text-sm leading-relaxed text-paper-500">{profile.blurb}</p>
      <p className="mt-5 text-xs uppercase tracking-[0.2em] text-paper-700">
        {profile.fullName} · {profile.location}
      </p>
      <p className="mt-4 text-sm italic leading-relaxed text-paper-700">{PORTRAIT_TEXT.body}</p>
    </article>
  );
}

function ContactPanel() {
  return (
    <article>
      <PanelHeading title={PLAQUE_TEXT.title} subtitle="Before you go" />
      <p className="mt-6 font-display text-xl leading-relaxed text-paper-300">
        {PLAQUE_TEXT.body}
      </p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <a
          href={profile.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded bg-brass-400 px-5 py-3 text-center text-sm font-medium text-ink-950 transition-colors hover:bg-brass-300"
        >
          Get in touch on LinkedIn →
        </a>
        <a
          href={profile.github}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded border border-paper-700/50 px-5 py-3 text-center text-sm text-paper-300 transition-colors hover:border-paper-300 hover:text-paper-100"
        >
          GitHub
        </a>
      </div>
    </article>
  );
}
