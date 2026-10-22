/** Spanish texts for N3 grammar, part E (N9). Written for this app. */
import type { ById, GrammarText } from '../../content-types.ts';

export const ES_N3_E: ById<GrammarText> = {
  zu: {
    meaning: 'no …, y; sin',
    formation: 'V-ない (raíz) + ず (する → せず)',
    explanation:
      'ず es un negativo escrito que une cláusulas: 成績が上がらず、不安になった significa “mis notas no subieron y me puse nervioso”. Seguido de に se convierte en 〜ずに, “sin hacer”.',
  },
  'to-yobareru': {
    meaning: 'se llama …; se conoce como …',
    explanation:
      'La pasiva de と呼ぶ, “llamarlo …”, que sirve para nombrar o definir algo: これは「落ち」と呼ばれる. Es frecuente en explicaciones y libros de texto.',
  },
  'ni-kakete': {
    meaning: 'de … a …; a lo largo de',
    explanation:
      'にかけて marca un tramo de tiempo o de espacio con límites difusos: 六月から七月にかけて, “de junio a julio”. A diferencia de 〜から〜まで, los límites son aproximados.',
  },
};
