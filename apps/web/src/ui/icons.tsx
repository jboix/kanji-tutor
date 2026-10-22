/** Stroke icons from the mockups. Decorative unless given a label by the caller. */
import type { ReactNode } from 'react';

function Svg({
  size = 22,
  width = 1.5,
  children,
}: {
  size?: number;
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

/** Home (IA3): a house. */
export const HomeIcon = () => (
  <Svg>
    <path d="M4 10.5L12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />
  </Svg>
);
export const BookIcon = () => (
  <Svg>
    <path d="M3 6c3-1.5 6-1.5 9 0v13c-3-1.5-6-1.5-9 0z" />
    <path d="M21 6c-3-1.5-6-1.5-9 0v13c3-1.5 6-1.5 9 0z" />
  </Svg>
);
export const CameraIcon = () => (
  <Svg>
    <path d="M4 8.5C4 7.7 4.7 7 5.5 7H8l1.5-2h5L16 7h2.5c.8 0 1.5.7 1.5 1.5v9c0 .8-.7 1.5-1.5 1.5h-13C4.7 19 4 18.3 4 17.5z" />
    <circle cx="12" cy="13" r="3.2" />
  </Svg>
);
export const NoteIcon = () => (
  <Svg>
    <path d="M6 3h9l4 4v14H6z" />
    <path d="M9 11h7M9 15h5" />
  </Svg>
);
export const CloseIcon = () => (
  <Svg size={20} width={1.6}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);
export const BackIcon = () => (
  <Svg size={20} width={1.6}>
    <path d="M20 12H5M11 6l-6 6 6 6" />
  </Svg>
);
export const ChevronIcon = () => (
  <Svg size={18} width={1.6}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);
/** An arrow out of a box: a link that opens another site (R9). */
export const ExternalIcon = () => (
  <Svg size={16} width={1.7}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </Svg>
);
export const ArrowIcon = () => (
  <Svg size={18} width={1.8}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);
/** The bare send arrow of the answer and ask fields (W-read): no circle around it (D106). */
export const SendIcon = ({ size = 24 }: { size?: number }) => (
  <Svg size={size} width={2}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </Svg>
);
export const MicIcon = ({ size = 18 }: { size?: number }) => (
  <Svg size={size} width={1.6}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0014 0M12 18v3" />
  </Svg>
);
export const SpeakerIcon = () => (
  <Svg size={16} width={1.6}>
    <path d="M4 10v4h4l5 4V6L8 10z" />
    <path d="M16 9a4 4 0 010 6" />
  </Svg>
);
export const PenIcon = () => (
  <Svg size={20} width={1.6}>
    <path d="M4 20l4-1 11-11-3-3L5 16z" />
  </Svg>
);
export const UndoIcon = () => (
  <Svg size={20} width={1.6}>
    <path d="M9 14L4 9l5-5" />
    <path d="M4 9h11a5 5 0 010 10h-3" />
  </Svg>
);
export const GearIcon = () => (
  <Svg size={20} width={1.6}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 00-2-1.2L14.2 3h-4l-.4 2.6a7 7 0 00-2 1.2l-2.3-.9-2 3.4 2 1.5a7 7 0 000 2.4l-2 1.5 2 3.4 2.3-.9a7 7 0 002 1.2l.4 2.6h4l.4-2.6a7 7 0 002-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z" />
  </Svg>
);
/** The iOS Share symbol: a box with an arrow out of the top (install help, N1b). */
export const ShareIcon = ({ size = 16 }: { size?: number }) => (
  <Svg size={size}>
    <path d="M12 3v12M8 7l4-4 4 4" />
    <path d="M8 11H6.5c-.8 0-1.5.7-1.5 1.5v6c0 .8.7 1.5 1.5 1.5h11c.8 0 1.5-.7 1.5-1.5v-6c0-.8-.7-1.5-1.5-1.5H16" />
  </Svg>
);
/** Add (IA3): a plus. */
export const PlusIcon = () => (
  <Svg width={1.8}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
/** Start (IA3): a filled play triangle. */
export const PlayIcon = () => (
  <svg width={26} height={26} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8 5.5v13l10.5-6.5z" />
  </svg>
);
/** Settings in the bar (IA3): a cog. */
export const SettingsIcon = () => (
  <Svg width={1.8}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Svg>
);
/** Look up (IA4): a magnifier. */
export const SearchIcon = () => (
  <Svg size={18} width={1.8}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4 4" />
  </Svg>
);
/** What you've learned (IA4): bars. */
export const BarsIcon = () => (
  <Svg width={1.8}>
    <path d="M5 19V9M10 19V5M15 19v-7M20 19v-4" />
  </Svg>
);
/** Draw a kanji (IA4): a brush stroke. */
export const BrushIcon = () => (
  <Svg width={1.8}>
    <path d="M4 20c3-1 5-4 7-7l6-6 3 3-6 6c-3 2-6 4-7 7" />
  </Svg>
);

/* The Settings categories (IA5, D122): line icons in place of the kanji squares. */

/** Sessions: a stopwatch. */
export const TimerIcon = () => (
  <Svg size={20} width={1.8}>
    <circle cx="12" cy="13.5" r="7" />
    <path d="M12 13.5V10M10 3h4M18.5 6.5l-1.5 1.5" />
  </Svg>
);
/** AI tutor: a speech bubble. */
export const ChatIcon = () => (
  <Svg size={20} width={1.8}>
    <path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-4 3.5V16H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
    <path d="M8.5 9.5h7M8.5 12.5h4.5" />
  </Svg>
);
/** Language: a globe. */
export const GlobeIcon = () => (
  <Svg size={20} width={1.8}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.2 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.2-3.5-8.5S9.6 5.9 12 3.5z" />
  </Svg>
);
/** Appearance: a circle half filled, light and dark. */
export const ContrastIcon = () => (
  <Svg size={20} width={1.8}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor" />
  </Svg>
);
/** Your words: a list with ticks. */
export const ListIcon = () => (
  <Svg size={20} width={1.8}>
    <path d="M4 7l1.5 1.5L8 6M4 13l1.5 1.5L8 12M11 7.5h9M11 13.5h9M11 19h9M5 19h1" />
  </Svg>
);
/** Backup and storage: an arrow into a tray. */
export const TrayIcon = () => (
  <Svg size={20} width={1.8}>
    <path d="M12 4v10M8 10l4 4 4-4" />
    <path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
  </Svg>
);
/** Install: a phone with an arrow onto its screen. */
export const PhoneIcon = () => (
  <Svg size={20} width={1.8}>
    <rect x="6.5" y="3" width="11" height="18" rx="2.5" />
    <path d="M12 7.5v6M9.5 11l2.5 2.5 2.5-2.5M11 18h2" />
  </Svg>
);
/** About: an i in a circle. */
export const InfoIcon = () => (
  <Svg size={20} width={1.8}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5M12 7.8v.2" />
  </Svg>
);
/** Done: a check in a circle. */
export const CheckIcon = () => (
  <Svg size={18} width={1.8}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12.5 2.8 2.8L16 9.8" />
  </Svg>
);
/** Sound off: a speaker with a cross. */
export const SpeakerOffIcon = () => (
  <Svg size={16} width={1.6}>
    <path d="M4 10v4h4l5 4V6L8 10z" />
    <path d="m16 10 4 4M20 10l-4 4" />
  </Svg>
);
/** Log in with a passkey: a key. */
export const KeyIcon = () => (
  <Svg size={20} width={1.8}>
    <circle cx="8" cy="12" r="3.5" />
    <path d="M11.5 12H20M17 12v3M20 12v2.5" />
  </Svg>
);
/** Log in with an emailed code: an envelope. */
export const MailIcon = () => (
  <Svg size={20} width={1.8}>
    <rect x="3.5" y="6" width="17" height="12" rx="2" />
    <path d="m4 7 8 6 8-6" />
  </Svg>
);
