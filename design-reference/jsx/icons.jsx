// Lucide-style outline icons. Single 16px stroke set, currentColor.
// One file so I can add as I go without juggling many tiny modules.

const Icon = ({ d, size = 16, stroke = 1.6, fill, children, ...rest }) => (
  <svg className="ico" viewBox="0 0 24 24" width={size} height={size}
       fill={fill || "none"} stroke="currentColor" strokeWidth={stroke}
       strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {d ? <path d={d} /> : children}
  </svg>
);

const I = {
  Home: (p) => <Icon {...p}><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></Icon>,
  Bell: (p) => <Icon {...p}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 21a2 2 0 0 0 4 0"/></Icon>,
  Calendar: (p) => <Icon {...p}><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/></Icon>,
  Settings: (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></Icon>,
  Search: (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></Icon>,
  Plus: (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  Check: (p) => <Icon {...p}><path d="M20 6L9 17l-5-5"/></Icon>,
  X: (p) => <Icon {...p}><path d="M18 6L6 18M6 6l12 12"/></Icon>,
  ChevDown: (p) => <Icon {...p}><path d="M6 9l6 6 6-6"/></Icon>,
  ChevRight: (p) => <Icon {...p}><path d="M9 6l6 6-6 6"/></Icon>,
  ChevLeft: (p) => <Icon {...p}><path d="M15 18l-6-6 6-6"/></Icon>,
  Dots: (p) => <Icon {...p}><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></Icon>,
  // Tab icons
  Layout: (p) => <Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></Icon>,
  Clipboard: (p) => <Icon {...p}><rect x="6" y="4" width="12" height="17" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></Icon>,
  Pencil: (p) => <Icon {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></Icon>,
  Folder: (p) => <Icon {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></Icon>,
  Film: (p) => <Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 8h18M3 16h18M8 3v18M16 3v18"/></Icon>,
  Move: (p) => <Icon {...p}><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/></Icon>,
  // Production / theatre
  Mask: (p) => <Icon {...p}><path d="M5 4c0 8 3 14 7 14s7-6 7-14H5z"/><path d="M9 9c.5.5 1.2.5 2 0M13 9c.8.5 1.5.5 2 0"/></Icon>,
  Star: (p) => <Icon {...p}><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/></Icon>,
  // Content
  File: (p) => <Icon {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></Icon>,
  FilePdf: (p) => <Icon {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 14h.5a1.5 1.5 0 0 1 0 3H9zM14 14v3h2.5M14 15.5h2"/></Icon>,
  FileMusic: (p) => <Icon {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><circle cx="9" cy="17" r="1.5"/><path d="M10.5 17v-4l3-1v4"/></Icon>,
  FileImg: (p) => <Icon {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><circle cx="9" cy="14" r="1.2"/><path d="M8 19l3-3 4 4"/></Icon>,
  Upload: (p) => <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5-5 5 5M12 5v12"/></Icon>,
  Download: (p) => <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></Icon>,
  Filter: (p) => <Icon {...p}><path d="M3 4h18l-7 9v6l-4 2v-8z"/></Icon>,
  // Notes/todos
  CircleEmpty: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/></Icon>,
  CircleCheck: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></Icon>,
  CirclePartial: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/></Icon>,
  Pin: (p) => <Icon {...p}><path d="M12 2l-2 7H6l4 5-1 8 3-3 3 3-1-8 4-5h-4z"/></Icon>,
  Tag: (p) => <Icon {...p}><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="8" cy="8" r="1.4"/></Icon>,
  // Video
  Play: (p) => <Icon {...p}><path d="M6 4l14 8-14 8z" fill="currentColor"/></Icon>,
  Pause: (p) => <Icon {...p}><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></Icon>,
  Fwd: (p) => <Icon {...p}><path d="M5 4l8 8-8 8M13 4l8 8-8 8"/></Icon>,
  Back: (p) => <Icon {...p}><path d="M19 4l-8 8 8 8M11 4l-8 8 8 8"/></Icon>,
  Volume: (p) => <Icon {...p}><path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15 9a4 4 0 0 1 0 6"/><path d="M18 6a8 8 0 0 1 0 12"/></Icon>,
  Full: (p) => <Icon {...p}><path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6"/></Icon>,
  // People
  User: (p) => <Icon {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></Icon>,
  Users: (p) => <Icon {...p}><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-5-6.7"/></Icon>,
  Mail: (p) => <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></Icon>,
  // Misc
  Clock: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>,
  Alert: (p) => <Icon {...p}><path d="M12 2L1 21h22z"/><path d="M12 9v6M12 18v.01"/></Icon>,
  Info: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 8v.01M12 11v6"/></Icon>,
  Sparkle: (p) => <Icon {...p}><path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/></Icon>,
  Mic: (p) => <Icon {...p}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></Icon>,
  Music: (p) => <Icon {...p}><path d="M9 17V5l11-2v12"/><circle cx="6" cy="17" r="3"/><circle cx="17" cy="15" r="3"/></Icon>,
  Lightbulb: (p) => <Icon {...p}><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12c1 1 2 2 2 4h4c0-2 1-3 2-4a7 7 0 0 0-4-12z"/></Icon>,
  Layers: (p) => <Icon {...p}><path d="M12 2l10 6-10 6L2 8z"/><path d="M2 14l10 6 10-6M2 11l10 6 10-6"/></Icon>,
  Hash: (p) => <Icon {...p}><path d="M4 9h16M4 15h16M10 3l-2 18M16 3l-2 18"/></Icon>,
  Send: (p) => <Icon {...p}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></Icon>,
  Trash: (p) => <Icon {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></Icon>,
  Sun: (p) => <Icon {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></Icon>,
  Moon: (p) => <Icon {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></Icon>,
  Drama: (p) => <Icon {...p}><path d="M3 5h7v6a3.5 3.5 0 0 1-7 0z"/><path d="M14 10h7v6a3.5 3.5 0 0 1-7 0z"/><path d="M5 14c.5.4 1.2.5 2 0M16 18c.5.4 1.2.5 2 0"/></Icon>,
  Grip: (p) => <Icon {...p}><circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/></Icon>,
  Bolt: (p) => <Icon {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></Icon>,
  Refresh: (p) => <Icon {...p}><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></Icon>,
  List: (p) => <Icon {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></Icon>,
  ListOrdered: (p) => <Icon {...p}><path d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M4 18a1 1 0 1 1 2 0c0 .8-2 1-2 2h2"/></Icon>,
  Expand: (p) => <Icon {...p}><path d="M15 3h6v6M21 3l-7 7M9 21H3v-6M3 21l7-7"/></Icon>,
};

window.I = I;
