// Minimal OSC parsing for ETC Eos's cue output. No dependencies.
//
// Eos sends /eos/out/active/cue/<list>/<cue> on every GO/jump, plus
// /eos/out/active/cue/text with the cue label. We only need the address (for
// list/cue) and the occasional string arg (label).

// OSC strings are null-terminated and padded to a 4-byte boundary.
function readOscString(buf, offset) {
  let end = offset;
  while (end < buf.length && buf[end] !== 0) end++;
  const str = buf.toString("ascii", offset, end);
  const next = offset + Math.ceil((end - offset + 1) / 4) * 4;
  return { str, next };
}

function parseOscMessage(buf) {
  const { str: address, next: afterAddr } = readOscString(buf, 0);
  let offset = afterAddr;
  const args = [];
  if (offset < buf.length && buf[offset] === 0x2c /* ',' */) {
    const { str: tags, next: afterTags } = readOscString(buf, offset);
    offset = afterTags;
    for (const tag of tags.slice(1)) {
      if (tag === "s") {
        const { str, next } = readOscString(buf, offset);
        args.push(str);
        offset = next;
      } else if (tag === "f" || tag === "i" || tag === "r" || tag === "c") {
        args.push(tag === "f" ? buf.readFloatBE(offset) : buf.readInt32BE(offset));
        offset += 4;
      } else if (tag === "h" || tag === "t" || tag === "d") {
        offset += 8; // 64-bit args we don't use
      }
      // other tags (T/F/N/I) carry no data
    }
  }
  return { address, args };
}

// OSC packets may be bundles ("#bundle\0" + timetag + size-prefixed elements).
function forEachOscMessage(buf, fn) {
  if (buf.length >= 8 && buf.toString("ascii", 0, 8) === "#bundle\0") {
    let offset = 16; // skip "#bundle\0" (8) + timetag (8)
    while (offset + 4 <= buf.length) {
      const size = buf.readInt32BE(offset);
      offset += 4;
      if (size <= 0 || offset + size > buf.length) break;
      forEachOscMessage(buf.subarray(offset, offset + size), fn);
      offset += size;
    }
  } else {
    fn(parseOscMessage(buf));
  }
}

const ACTIVE_CUE_RE = /^\/eos\/out\/active\/cue\/([\d.]+)\/([\d.]+)$/;

/**
 * Feed raw UDP datagrams in; get `{ list, cue, label? }` out via `onCue`.
 * Returns a handler with internal state to merge the cue-number frame with the
 * label-text frame that follows it.
 */
function createCueExtractor(onCue) {
  let pending = null;
  return function handle(buf) {
    forEachOscMessage(buf, ({ address, args }) => {
      const m = ACTIVE_CUE_RE.exec(address);
      if (m) {
        pending = { list: m[1], cue: m[2] };
        onCue({ ...pending });
        return;
      }
      if (address === "/eos/out/active/cue/text" && typeof args[0] === "string") {
        // Text looks like "1/5.5 Label  3.0 100%" — strip the leading number.
        const label = args[0].replace(/^\s*[\d.]+\/[\d.]+\s*/, "").trim();
        if (pending) onCue({ ...pending, label });
      }
    });
  };
}

module.exports = { parseOscMessage, forEachOscMessage, createCueExtractor };
