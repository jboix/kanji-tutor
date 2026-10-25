/** Spanish messages: grammar dialogues on the intro card, the grammar page and their drill. */
import type { Messages } from '../../types.ts';

export const dialogues = {
  introLabel: 'En una conversación',
  pageLabel: 'En conversación',
  between: 'Una conversación entre {a} y {b}',
  speaker: '{name}:',
  play: 'Escuchar',
  playLabel: 'Escuchar la conversación',
  showTranslation: 'Ver la traducción',
  settingFriends: 'Entre amigos',
  settingFamily: 'En familia',
  settingWork: 'En el trabajo',
  settingSchool: 'En la escuela',
  settingShop: 'En una tienda',
  registerPlain: 'informal',
  registerPolite: 'formal',
  register: '{setting} · {register}',
  compare: 'Comparar con {pattern}',
  prompt: 'Completa la frase',
  tutorExplain: 'Explicar esta conversación',
  tutorWhy: '¿Por qué {x} aquí?',
} satisfies Messages['dialogues'];
