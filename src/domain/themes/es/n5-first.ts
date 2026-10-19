/** Spanish texts for N5 unit 1 (N9, D53, T8). Written for this app. */
import type { ById, UnitText } from '../../content-types.ts';

export const ES_N5_FIRST: ById<UnitText> = {
  'i-am-a-student': {
    theme: 'Soy estudiante',
    summary:
      'Una frase japonesa suele empezar por aquello de lo que habla: わたしは, “en cuanto a mí”, y luego qué es.',
    sentences: [
      'Soy Anna.',
      'Soy estadounidense.',
      'No soy japonesa.',
      'Soy estudiante universitaria.',
      'Lin es chino.',
      'Lin no es estudiante.',
      'Lin trabaja en una empresa.',
      '¿La señora Yamamoto es profesora? Sí.',
    ],
    questions: [
      'La línea 2 dice アメリカ人です, “soy estadounidense”, así que es アメリカの人. La línea 3 dice que no es japonesa, la persona china es Lin y Francia nunca se menciona.',
      'Línea 6: リンさんは学生ではありません, “Lin no es estudiante”, y la línea 7 dice lo que es: 会社の人, alguien que trabaja en una empresa. La estudiante es Anna, la profesora es la señora Yamamoto, y Lin es chino, no japonés.',
      'Línea 8: 山本さんは先生ですか。はい、先生です, “¿la señora Yamamoto es profesora? Sí”. Anna, que escribe わたし, es estudiante, y Lin trabaja en una empresa.',
    ],
  },
};
