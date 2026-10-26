/**
 * Line icons in one hand: a 24 grid, a 1.7 stroke, round caps and joins, no fill (Play is the
 * one filled glyph). Decorative unless given a label by the caller.
 */
import type { ReactNode } from 'react';

function Svg({
  size = 22,
  width = 1.7,
  children,
}: {
  size?: number | undefined;
  width?: number;
  children: ReactNode;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Drawn 22px in the UI by default; the bottom bar asks for 24. */
interface Sized {
  size?: number;
}

/** Home (IA3): a house. */
export const HomeIcon = ({ size }: Sized) => (
  <Svg size={size}>
    <path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />
  </Svg>
);
/** Learn: an open book. */
export const BookIcon = ({ size }: Sized) => (
  <Svg size={size}>
    <path d="M3 5.5c2.5-1 5.5-1 9 1 3.5-2 6.5-2 9-1v13c-2.5-1-5.5-1-9 1-3.5-2-6.5-2-9-1z" />
    <path d="M12 6.5v13" />
  </Svg>
);
export const CameraIcon = () => (
  <Svg>
    <path d="M4 8h3l2-2.5h6L17 8h3v11H4z" />
    <circle cx="12" cy="13" r="3.5" />
  </Svg>
);
/** A class handout: a sheet with a folded corner. */
export const NoteIcon = () => (
  <Svg>
    <path d="M6 3h9l4 4v14H6z" />
    <path d="M15 3v4h4M9 12h7M9 16h5" />
  </Svg>
);
export const CloseIcon = () => (
  <Svg size={20}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);
export const BackIcon = () => (
  <Svg size={20}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Svg>
);
export const ChevronIcon = () => (
  <Svg size={18}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);
/** An arrow out of a box: a link that opens another site (R9). */
export const ExternalIcon = () => (
  <Svg size={16}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </Svg>
);
export const ArrowIcon = () => (
  <Svg size={20}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);
/** Send, in the answer and ask fields: a paper plane. */
export const SendIcon = ({ size = 24 }: Sized) => (
  <Svg size={size}>
    <path d="M4 12l16-8-6 16-2.5-6.5z" />
    <path d="M11.5 13.5L20 4" />
  </Svg>
);
export const MicIcon = ({ size = 18 }: Sized) => (
  <Svg size={size}>
    <rect x="9" y="3.5" width="6" height="11" rx="3" />
    <path d="M6 11a6 6 0 0 0 12 0M12 17v3.5" />
  </Svg>
);
export const SpeakerIcon = () => (
  <Svg size={16}>
    <path d="M5 10v4h3l4 3V7L8 10z" />
    <path d="M16 9.5a3.5 3.5 0 0 1 0 5" />
    <path d="M18.5 7a7 7 0 0 1 0 10" />
  </Svg>
);
export const PenIcon = () => (
  <Svg size={20}>
    <path d="M15 5l4 4L9 19H5v-4z" />
    <path d="M13 7l4 4" />
  </Svg>
);
export const UndoIcon = () => (
  <Svg size={20}>
    <path d="M9 14L4 9l5-5" />
    <path d="M4 9h11a5 5 0 0 1 0 10h-3" />
  </Svg>
);
export const GearIcon = () => (
  <Svg size={20}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z" />
  </Svg>
);
/** The iOS Share symbol: a box with an arrow out of the top (install help, N1b). */
export const ShareIcon = ({ size = 16 }: Sized) => (
  <Svg size={size}>
    <path d="M12 3v12M8 7l4-4 4 4" />
    <path d="M8 11H6.5c-.8 0-1.5.7-1.5 1.5v6c0 .8.7 1.5 1.5 1.5h11c.8 0 1.5-.7 1.5-1.5v-6c0-.8-.7-1.5-1.5-1.5H16" />
  </Svg>
);
/** Add (IA3): a plus. */
export const PlusIcon = () => (
  <Svg>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
/** Start (IA3): the one filled glyph, a play triangle. */
export const PlayIcon = ({ size = 24 }: Sized) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M9 6.5v11l9-5.5z" />
  </svg>
);
/** Settings in the bar (IA3): two sliders. */
export const SettingsIcon = ({ size }: Sized) => (
  <Svg size={size}>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </Svg>
);
/** Look up (IA4): a magnifier. */
export const SearchIcon = () => (
  <Svg size={18}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4 4" />
  </Svg>
);
/** What you've learned (IA4): bars. */
export const BarsIcon = () => (
  <Svg>
    <path d="M5 19V9M10 19V5M15 19v-7M20 19v-4" />
  </Svg>
);
/** Draw a kanji (IA4): a brush stroke. */
export const BrushIcon = () => (
  <Svg>
    <path d="M4 20c3-1 5-3 7-6l6-9 2 1.5-6 9c-2 3-4.5 4.5-9 4.5z" />
  </Svg>
);

/* The Settings categories (IA5): line icons in place of the kanji squares. */

/** Sessions: a stopwatch. */
export const TimerIcon = () => (
  <Svg size={20}>
    <circle cx="12" cy="13.5" r="7" />
    <path d="M12 13.5V10M10 3h4M18.5 6.5l-1.5 1.5" />
  </Svg>
);
/** AI tutor: a speech bubble. */
export const ChatIcon = () => (
  <Svg size={20}>
    <path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-4 3.5V16H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
    <path d="M8.5 9.5h7M8.5 12.5h4.5" />
  </Svg>
);
/** Language: a globe. */
export const GlobeIcon = () => (
  <Svg size={20}>
    <circle cx="12" cy="12" r="8" />
    <path d="M4 12h16" />
    <path d="M12 4c2.2 2.3 3.3 5 3.3 8s-1.1 5.7-3.3 8c-2.2-2.3-3.3-5-3.3-8S9.8 6.3 12 4z" />
  </Svg>
);
/** Appearance: a circle half filled, light and dark. */
export const ContrastIcon = () => (
  <Svg size={20}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 4v16a8 8 0 0 0 0-16z" fill="currentColor" />
  </Svg>
);
/** Your words: a list. */
export const ListIcon = () => (
  <Svg size={20}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" strokeWidth="2.4" />
  </Svg>
);
/** Backup and storage: an arrow into a tray. */
export const TrayIcon = () => (
  <Svg size={20}>
    <path d="M12 4v10M8 10l4 4 4-4" />
    <path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
  </Svg>
);
/** A new version: an arrow down onto a line. */
export const DownloadIcon = () => (
  <Svg size={20}>
    <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
  </Svg>
);
/** Install: a phone with an arrow onto its screen. */
export const PhoneIcon = () => (
  <Svg size={20}>
    <rect x="6.5" y="3" width="11" height="18" rx="2.5" />
    <path d="M12 7.5v6M9.5 11l2.5 2.5 2.5-2.5M11 18h2" />
  </Svg>
);
/** About: an i in a circle. */
export const InfoIcon = () => (
  <Svg size={20}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 11v5.5M12 7.8v.2" />
  </Svg>
);
/** Done: a check in a circle. */
export const CheckIcon = () => (
  <Svg size={18}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.5l2.8 2.8L16 9.8" />
  </Svg>
);
/** Sound off: a speaker with a cross. */
export const SpeakerOffIcon = () => (
  <Svg size={16}>
    <path d="M5 10v4h3l4 3V7L8 10z" />
    <path d="M16 10l4 4M20 10l-4 4" />
  </Svg>
);
/** Log in with a passkey: a key. */
export const KeyIcon = () => (
  <Svg size={20}>
    <circle cx="8" cy="12" r="3.5" />
    <path d="M11.5 12H20M17 12v3M20 12v2.5" />
  </Svg>
);
/** Log in with an emailed code: an envelope. */
export const MailIcon = () => (
  <Svg size={20}>
    <rect x="3.5" y="6" width="17" height="12" rx="2" />
    <path d="M4 7l8 6 8-6" />
  </Svg>
);
/** Settings → Cloud saves: a cloud. */
export const CloudIcon = () => (
  <Svg size={20}>
    <path d="M7 18.5h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7 9.5a4.5 4.5 0 0 0 0 9z" />
  </Svg>
);
/** The daily mix: two arrows passing each other. */
export const MixIcon = () => (
  <Svg>
    <path d="M4 7h11l-3-3M20 17H9l3 3" />
  </Svg>
);
/** A clock with a turning arrow: an earlier conversation, to carry on. */
export const HistoryIcon = () => (
  <Svg>
    <path d="M4 12a8 8 0 1 0 2.3-5.6" />
    <path d="M4 4.5V8h3.5" />
    <path d="M12 8v4l2.5 2" />
  </Svg>
);
/** Selected or right: a bare check. */
export const TickIcon = () => (
  <Svg size={16} width={2.2}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);

/** Kanji: a writing square with its dashed centre cross. */
export const KanjiIcon = () => (
  <Svg>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M12 4v16M4 12h16" strokeDasharray="1.5 2.5" />
  </Svg>
);

/** Grammar: three lines of a sentence pattern. */
export const GrammarIcon = () => (
  <Svg>
    <path d="M5 6h14M5 12h9M5 18h12" />
  </Svg>
);

/** Reading: two open pages. */
export const ReadIcon = () => (
  <Svg>
    <path d="M4 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4z" />
    <path d="M20 5h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6z" />
  </Svg>
);
