import { useReducer, useState } from 'react';
import { BackButton } from '../../ui/back-button.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { paths } from '../../ui/paths.ts';
import { Screen } from '../../ui/screen.tsx';
import { SegmentedControl } from '../../ui/segmented-control.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import { DescribePanel } from './describe-panel.tsx';
import { DrawPanel } from './draw-panel.tsx';
import { EMPTY_INK, inkReducer } from './ink.ts';

type Mode = 'draw' | 'describe';

function HandwriteBack() {
  const t = useT();
  return <BackButton parent={paths.learn} label={t('handwrite.back')} />;
}

/** `/handwrite` (handwrite.html): draw a kanji in any stroke order (I4) or describe it (I5). */
export function HandwriteScreen() {
  const [mode, setMode] = useState<Mode>('draw');
  // The drawing survives a trip to Describe and back.
  const [ink, dispatch] = useReducer(inkReducer, EMPTY_INK);
  const t = useT();
  const modes = [
    { value: 'draw' as const, label: t('handwrite.draw') },
    { value: 'describe' as const, label: t('handwrite.describe') },
  ];
  const bar = (
    <TopBar
      start={<HandwriteBack />}
      center={
        <SegmentedControl
          label={t('handwrite.inputMode')}
          options={modes}
          value={mode}
          onChange={setMode}
        />
      }
    />
  );
  return (
    <Screen topBar={bar} top={18} gap={18}>
      {mode === 'draw' ? (
        <DrawPanel ink={ink} dispatch={dispatch} onDescribe={() => setMode('describe')} />
      ) : (
        <DescribePanel />
      )}
    </Screen>
  );
}
