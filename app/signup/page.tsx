import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { SignupForm } from "./signup-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

// Honest value points — each maps to a feature that's actually built.
const VALUE_POINTS = [
  {
    t: "Reports & daily call boards",
    d: "Send the day's rehearsal report and tomorrow's call in minutes.",
  },
  {
    t: "Schedule & shared calendar",
    d: "Plan rehearsals, publish the calendar, and keep everyone aligned.",
  },
  {
    t: "Script, cues & blocking",
    d: "Break down the script, place cues, and save blocking on the page.",
  },
  {
    t: "Cast, crew & announcements",
    d: "Your whole company, documents, and updates in one workspace.",
  },
];

export default function SignupPage() {
  return (
    <div className="auth-split">
      <aside className="auth-aside">
        <div className="auth-aside-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand-paper.svg" alt="" width={32} height={32} />
          <span className="auth-aside-wordmark">
            Pro<em>scene</em>
          </span>
        </div>

        <div>
          <h2 className="auth-aside-head">
            Run your whole production from one place.
          </h2>
          <ul className="auth-aside-list" role="list">
            {VALUE_POINTS.map((p) => (
              <li key={p.t}>
                <span className="auth-aside-check" aria-hidden>
                  <Icon name="Check" size={13} />
                </span>
                <span className="auth-aside-pt">
                  <b className="auth-aside-t">{p.t}</b>
                  <span className="auth-aside-d">{p.d}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="auth-aside-foot">
          Your first production is free — a 60-day full-access trial, no card
          required.
        </p>
      </aside>

      <div className="auth-main">
        <div className="auth-card-wrap">
          <div className="auth-head">
            <div className="auth-brand">
              <span className="auth-mark">
                <img className="brand-badge is-light" src="/brand-ink.svg" alt="" width={30} height={30} />
                <img className="brand-badge is-dark" src="/brand-paper.svg" alt="" width={30} height={30} />
              </span>
              <span className="auth-wordmark">
                Pro<em>scene</em>
              </span>
            </div>
            <h1 className="auth-title">Create your workspace</h1>
            <p className="auth-sub">
              Set up a new Proscene workspace for your theatre company or
              production team. You&apos;ll be the admin.
            </p>
          </div>
          <SignupForm />
          <OAuthButtons />
          <p className="auth-foot">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
          <p className="auth-foot" style={{ marginTop: 6, opacity: 0.75 }}>
            Been invited to an existing workspace? Use the link in your invite
            email instead of signing up here.
          </p>
        </div>
      </div>
    </div>
  );
}
