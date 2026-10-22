/** French messages: Find my level (A11). */
import type { Messages } from '../../types.ts';

export const placement = {
  areaKanjiReading: 'Lectures des kanji',
  areaOrthography: 'Écriture en kanji',
  areaGrammarForm: 'Formes grammaticales',
  areaComprehension: 'Lecture d’un texte',
  steadyShaky: '{area} : solide au N{steady} ; pas encore au N{shaky}.',
  steady: '{area} : solide jusqu’au N{level}.',
  notYet: '{area} : pas encore solide au N{level}.',
  questionOf: 'Question {index} sur environ {total}',
  yourLevel: 'Votre niveau',
  accepted: 'Votre niveau est maintenant N{level}. Les nouveaux mots viennent du N{level}.',
  backToToday: 'Retour à l’accueil',
  yourResult: 'Votre résultat',
  pointsTo: 'Les questions indiquent le N{level}.',
  levelToUse: 'Niveau à utiliser',
  use: 'Utiliser N{level}',
  changeLater: 'Vous pouvez le changer à tout moment dans les Réglages.',
  about: 'À propos',
  introLead:
    'Environ {n} questions courtes au format du JLPT, en commençant au N5. Deux bonnes réponses de suite font monter d’un niveau, deux erreurs font descendre. Ensuite, si vous le souhaitez, quelques lignes en japonais.',
  introNote:
    'À la fin, vous obtenez un niveau et une note par domaine, jamais un score. Rien ne change tant que vous n’avez pas choisi.',
  finding: 'Recherche d’une question…',
  start: 'Commencer',
  title: 'Trouver mon niveau',
  writingLabel: 'Une courte réponse écrite',
  writingPrompt: 'Facultatif : quelques phrases en japonais, comme vous pouvez.',
  writingNote: 'Le tuteur ne la lit que si vous lui demandez une évaluation.',
  unconfirmed: 'Non confirmé par le dictionnaire :',
  assessment: 'L’évaluation du tuteur',
  tutorSuggests: 'Le tuteur propose le N{level}.',
  solid: 'Solide',
  toWorkOn: 'À travailler',
  noKey:
    'Ajoutez une clé Gemini dans les {settings} pour interroger le tuteur. Le niveau ci-dessus vaut par lui-même.',
  settings: 'Réglages',
  noAnswer: 'Pas de réponse du tuteur cette fois : {reason}',
  reading: 'Le tuteur lit vos réponses…',
  ask: 'Demander une évaluation au tuteur',
} satisfies Messages['placement'];
