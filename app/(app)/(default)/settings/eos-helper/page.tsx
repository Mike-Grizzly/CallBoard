import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { requireCurrentUser } from "@/lib/auth";

// Repo folder that holds the helper app source (ships with Proscene). For
// testing, the helper is run from source; signed installers are a later step.
const HELPER_REPO_URL =
  "https://github.com/Mike-Grizzly/CallBoard/tree/main/tools/eos-helper";

export default async function EosHelperSettingsPage() {
  await requireCurrentUser();

  return (
    <div
      className="page-narrow anim-in"
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <Link
        href="/settings"
        className="more-item"
        style={{ alignSelf: "flex-start", gap: 6, padding: "6px 0" }}
      >
        <Icon name="ChevronLeft" className="ico" aria-hidden />
        <span style={{ fontSize: 13 }}>Settings</span>
      </Link>

      <div>
        <div className="h-eyebrow">Integrations</div>
        <h1 className="h-section" style={{ marginTop: 2 }}>
          Lighting console (ETC Eos)
        </h1>
        <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>
          Make your script follow the show live: as the board op bounces through
          cues on an ETC Eos console, Proscene jumps to the matching cue. A small
          helper app on your booth computer listens to Eos and relays the active
          cue to Proscene.
        </p>
      </div>

      <div
        className="card card-pad"
        style={{
          fontSize: 13,
          color: "var(--ink-3)",
          borderColor: "var(--accent)",
        }}
      >
        <b style={{ color: "var(--ink-1)" }}>Prototype.</b> This is an early
        testing build. The helper isn&apos;t a signed installer yet — you run it
        from source (below). Cue-following is one-way (Eos → Proscene).
      </div>

      <div className="card card-pad">
        <div className="h-eyebrow">Step 1</div>
        <h2 className="h-section" style={{ marginTop: 2, marginBottom: 8 }}>
          Install the helper app
        </h2>
        <p style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 12 }}>
          Get the helper onto the computer that&apos;s on your lighting network
          (usually the booth laptop). It needs Node.js installed.
        </p>
        <a
          href={HELPER_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn primary"
          style={{ gap: 6 }}
        >
          <Icon name="Download" aria-hidden />
          <span>Get the Eos helper app</span>
        </a>
        <pre
          style={{
            marginTop: 12,
            padding: "10px 12px",
            background: "var(--bg-muted)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
            overflowX: "auto",
          }}
        >
          {`cd tools/eos-helper\nnpm install\nnpm start`}
        </pre>
        <p style={{ fontSize: 12, color: "var(--ink-4)", marginTop: 8 }}>
          A small window opens with a single status page and its own Stop / Quit
          buttons.
        </p>
      </div>

      <div className="card card-pad">
        <div className="h-eyebrow">Step 2</div>
        <h2 className="h-section" style={{ marginTop: 2, marginBottom: 8 }}>
          Pair it with your show
        </h2>
        <ol
          style={{
            fontSize: 13,
            color: "var(--ink-3)",
            paddingLeft: 18,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <li>
            Open your production → <b>Script</b> → <b>Cue sheet</b> →{" "}
            <b>Copy pairing code</b>.
          </li>
          <li>Paste the code into the helper app and press Start.</li>
          <li>
            In Proscene&apos;s cue sheet, turn on <b>Follow Eos</b>. When it shows
            “live”, you&apos;re connected.
          </li>
        </ol>
      </div>

      <div className="card card-pad">
        <div className="h-eyebrow">Step 3</div>
        <h2 className="h-section" style={{ marginTop: 2, marginBottom: 8 }}>
          Point Eos at the helper
        </h2>
        <p style={{ fontSize: 13, color: "var(--ink-3)" }}>
          On the Eos console: <b>Settings → Network</b> → enable <b>OSC</b> and{" "}
          <b>OSC UDP TX</b>, set the <b>TX IP Address</b> to the helper
          computer&apos;s IP and the <b>TX Port</b> to <code>8000</code> (the
          helper&apos;s default). Eos then sends the active cue on every GO. The
          helper&apos;s status page confirms when cues are arriving.
        </p>
      </div>
    </div>
  );
}
