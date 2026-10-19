import { useSearchParams } from 'react-router';
import { CaptureHome } from './capture-home.tsx';
import { CaptureView } from './capture-view.tsx';

/**
 * Capture from class (capture.html, C1–C5): photograph or paste a page, see how much of it can
 * be read, tap a line for an explanation, and add its new words to this week's lesson. A saved
 * capture opens at `?id=`, from storage only, so it works offline.
 */
export function CaptureScreen() {
  const [params] = useSearchParams();
  const id = params.get('id');
  return id ? <CaptureView key={id} id={id} /> : <CaptureHome />;
}
