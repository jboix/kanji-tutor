/** French messages: this week's plan (A7, IA6), on Today. */
import type { Messages } from '../../types.ts';

export const plan = {
  focusLongVowel: 'Voyelles longues',
  focusSokuon: 'Le petit っ',
  focusRendaku: 'Sonorisation',
  title: 'Le plan de la semaine',
  lead: 'Établi d’après votre semaine. Les séances le suivent dès aujourd’hui.',
  usePlan: 'Suivre ce plan',
  changeIt: 'Le modifier',
  followed: 'Les séances de cette semaine suivent ce plan.',
  whenLine: 'Quand, ligne {line}',
  whatLine: 'Quoi, ligne {line}',
  dailyMinutes: 'Minutes par jour',
  fewerMinutes: 'Moins de minutes par jour',
  moreMinutes: 'Plus de minutes par jour',
  focusLegend: 'Une phrase sur quatre travaille',
  whenDaily: 'Chaque jour',
  whenTue: 'Mar.',
  whenTueThu: 'Mar., jeu.',
  planReading: '{minutes} minutes de lecture.',
  planFocus: 'Une phrase sur quatre {phrase}.',
  phraseLongVowel: 'contient une voyelle longue',
  phraseSokuon: 'contient un petit っ',
  phraseRendaku: 'contient une sonorisation',
  planDrills: {
    one: 'Exercices de kanji semblables, environ {n} carte sur 20, pour les kanji confondus.',
    other: 'Exercices de kanji semblables, environ {n} cartes sur 20, pour les kanji confondus.',
  },
  planGrammarOne: 'Écrire une phrase avec {first}.',
  planGrammarTwo: 'Écrire une phrase avec {first}, puis une avec {second}.',
} satisfies Messages['plan'];
