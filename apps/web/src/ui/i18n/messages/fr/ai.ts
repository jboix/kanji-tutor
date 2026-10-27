/** French messages: why the AI tutor gave no answer (shared by every feature). */
import type { Messages } from '../../types.ts';

export const ai = {
  offline: 'Vous êtes hors ligne. Les explications demandent une connexion ; le reste fonctionne.',
  noKey: 'Ajoutez une clé Gemini dans les Réglages pour utiliser le tuteur IA.',
  rateLimit: 'Le tuteur a besoin d’une minute : Gemini limite les requêtes pour cette clé.',
  needsMinute: 'Le tuteur a besoin d’une minute.',
  askAgainIn: 'Vous pourrez redemander dans {n} s.',
  askAgainNow: 'Vous pouvez redemander maintenant.',
  invalid: 'La réponse est illisible.',
  cancelled: 'La requête a été annulée.',
  refused: 'Gemini a refusé la requête ({status}). Vérifiez la clé et le modèle dans les Réglages.',
  noAnswer: 'Gemini n’a pas répondu.',
  timeout:
    'Gemini a mis trop de temps à répondre ; il est peut-être surchargé. Réessayez dans un instant.',
  busy: 'Gemini est surchargé en ce moment. Réessayez dans un instant.',
} satisfies Messages['ai'];
