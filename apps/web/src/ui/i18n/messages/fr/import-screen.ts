/** French messages: the import page (K6, D14). */
import type { Messages } from '../../types.ts';

export const importScreen = {
  heading: 'Marquer ce que vous savez déjà',
  intro:
    'Les mots marqués commencent comme lus parmi des mots familiers : les sessions peuvent choisir des phrases où un ou deux mots seulement sont nouveaux. Les mots écrits uniquement en kana, comme {example}, sont ignorés. Vous pouvez réappliquer une liste à tout moment : les mots connus gardent leur progression et rien n’est ajouté deux fois.',
  import: 'Importer',
  finding: 'Recherche des mots…',
  marking: 'Marquage : {done} sur {total}',
  marked: { one: '{n} mot marqué comme connu', other: '{n} mots marqués comme connus' },
  added: { one: '{n} mot ajouté comme nouveau', other: '{n} mots ajoutés comme nouveaux' },
  toLesson: 'à {lesson}',
  notFound: { one: ' ; {n} ligne introuvable :', other: ' ; {n} lignes introuvables :' },
  already: { one: '{n} mot était déjà connu.', other: '{n} mots étaient déjà connus.' },
  tracked: {
    one: '{n} mot était déjà suivi et n’a pas changé.',
    other: '{n} mots étaient déjà suivis et n’ont pas changé.',
  },
  backToToday: 'Retour à l’accueil',
  markMore: 'En marquer d’autres',
  failed: 'L’import n’a pas abouti. Rien de ce que vous aviez n’a été perdu ; réessayez.',
} satisfies Messages['importScreen'];
