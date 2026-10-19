# Accessibility

Kanji Tutor aims to meet [WCAG 2.2](https://www.w3.org/TR/WCAG22/) at level AA. It has not been
audited by hand, so this is a goal we test against, not a claim of conformance.

## How it is checked

Every change runs these checks in CI:

- [axe-core](https://github.com/dequelabs/axe-core) on every screen and its main states, in the
  light and the dark theme, for WCAG 2.0, 2.1 and 2.2 A and AA.
- Every text colour against its background, in both themes, for AA contrast.
- Every tap target at least 44 × 44 px, and no screen that scrolls sideways, at 390 and 360 px wide.
- Biome's accessibility lint rules on the code.

The app also:

- Follows the system's reduce motion setting: nothing animates.
- Shows a visible focus ring for keyboard use.
- Pairs every chart with a text table.
- Never relies on colour alone: a right or wrong answer also has a word and a mark.
- Lets you answer by typing at any time, instead of by voice or by drawing.

## Supported environments

- Safari on iPhone, in the browser or added to the home screen.
- Chrome on Android, in the browser or installed.
- Current Chrome, Firefox and Safari on a computer.

## Known limitations

- VoiceOver and TalkBack have not been tested by hand. Japanese text with furigana may be read
  poorly by a screen reader.
- Drawing a kanji needs a pointer and fine motor control. **Learn → Look up** finds a kanji by its
  reading or meaning instead, and **Describe** (with a Gemini key) from a description.
- Voice answers need speech, and listening exercises need hearing. Typing always works instead, and
  with **Settings → Appearance → Sound** off, sessions leave listening exercises out.
- Spoken sentences use the device's own Japanese voice, which varies in quality.
- Answers from the AI tutor vary and are not checked for plain language.

## Report a barrier

[Open an accessibility issue](https://github.com/jboix/kanji-reader/issues/new?template=03_accessibility.yml)
and say what stopped you, on which screen, with which device, browser and assistive technology.
This is a personal project: every report is read and fixed when possible, with no fixed timeline.
