/** French texts for N5 unit 1 (N9, T8). Written for this app. */
import type { ById, UnitText } from '../../content-types.ts';

export const FR_N5_FIRST: ById<UnitText> = {
  'i-am-a-student': {
    theme: 'Je suis étudiante',
    summary:
      'Une phrase japonaise commence souvent par ce dont elle parle : わたしは, « quant à moi », puis ce que c’est.',
    sentences: [
      'Je suis Anna.',
      'Je suis américaine.',
      'Je ne suis pas japonaise.',
      'Je suis étudiante à l’université.',
      'Lin est chinois.',
      'Lin n’est pas étudiant.',
      'Lin travaille dans une entreprise.',
      'Mme Yamamoto est-elle professeure ? Oui.',
    ],
    questions: [
      'La ligne 2 dit アメリカ人です, « je suis américaine » : elle est donc アメリカの人. La ligne 3 dit qu’elle n’est pas japonaise, la personne chinoise, c’est Lin, et la France n’est jamais mentionnée.',
      'Ligne 6 : リンさんは学生ではありません, « Lin n’est pas étudiant », et la ligne 7 dit ce qu’il est : 会社の人, quelqu’un qui travaille dans une entreprise. L’étudiante, c’est Anna, la professeure, c’est Mme Yamamoto, et Lin est chinois, pas japonais.',
      'Ligne 8 : 山本さんは先生ですか。はい、先生です, « Mme Yamamoto est-elle professeure ? Oui ». Anna, qui écrit わたし, est étudiante, et Lin travaille dans une entreprise.',
    ],
  },
};
