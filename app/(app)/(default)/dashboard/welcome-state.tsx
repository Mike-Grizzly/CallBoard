import Link from "next/link";
import {
  Plus,
  ClipboardList,
  CalendarDays,
  FolderOpen,
  Layers,
  Users,
} from "lucide-react";

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Rehearsal reports",
    desc: "File a report after every session and keep the whole company in the loop automatically.",
  },
  {
    icon: CalendarDays,
    title: "Call scheduling",
    desc: "Build and send rehearsal calls, track RSVPs, and see the week at a glance.",
  },
  {
    icon: FolderOpen,
    title: "Document center",
    desc: "Upload scripts, designs, and notes. Everything in one place, always signed in.",
  },
  {
    icon: Layers,
    title: "Blocking & staging",
    desc: "Record blocking notation, set the ground plan, and track character positions scene by scene.",
  },
  {
    icon: Users,
    title: "Cast & crew",
    desc: "Invite your team, assign roles, and manage the full company roster from one board.",
  },
];

export function WelcomeState({
  firstName,
  orgName,
  canManage,
}: {
  firstName: string | null;
  orgName: string;
  canManage: boolean;
}) {
  return (
    <div className="ws-wrap">
      <div className="ws-stage-art" aria-hidden>
        <div className="ws-curtain ws-curtain-l" />
        <div className="ws-curtain ws-curtain-r" />
        <div className="ws-spotlight" />
      </div>

      <div className="ws-body">
        <p className="ws-eyebrow">{orgName}</p>
        <h1 className="ws-headline">
          {firstName ? (
            <>
              Welcome, <em>{firstName}</em>.<br />
              The curtain&rsquo;s up.
            </>
          ) : (
            <>The curtain&rsquo;s up.</>
          )}
        </h1>
        <p className="ws-sub">
          Your workspace is ready. Create your first production to unlock
          rehearsal reports, scheduling, blocking, and more — all free for 60
          days.
        </p>

        {canManage ? (
          <div className="ws-actions">
            <Link href="/productions/new" className="btn accent lg ws-cta">
              <Plus size={18} aria-hidden />
              Create your first production
            </Link>
          </div>
        ) : (
          <p className="ws-sub" style={{ marginTop: 8, fontSize: 13 }}>
            Ask your workspace admin to create the first production.
          </p>
        )}

        <div className="ws-features">
          {FEATURES.map((f) => (
            <div key={f.title} className="ws-feat">
              <div className="ws-feat-ico">
                <f.icon size={18} aria-hidden />
              </div>
              <div>
                <div className="ws-feat-title">{f.title}</div>
                <div className="ws-feat-desc">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
