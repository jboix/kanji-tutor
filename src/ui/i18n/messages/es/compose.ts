/** Spanish messages: compose (Use it, A6). Plain, never praise. */
import type { Messages } from '../../types.ts';

export const compose = {
  title: 'Úsalo',
  titleCount: 'Úsalo · gramática {position} de {total}',
  meaningQuoted: '«{meaning}»',
  prompt: 'Di algo cierto sobre ti con esta estructura.',
  saved: 'Guardada en tus frases.',
  errorOffline: 'Las correcciones necesitan conexión. Tu frase queda guardada aquí como borrador.',
  errorNoKey:
    'Añade una clave de Gemini en Ajustes para recibir correcciones. Tu frase queda guardada como borrador.',
  errorRateLimit:
    'Gemini indica demasiadas solicitudes. Inténtalo de nuevo en un minuto; tu borrador se conserva.',
  errorSave: 'No se pudo guardar la frase. Inténtalo de nuevo.',
  errorOther: 'No hay corrección por ahora. Tu borrador se conserva; inténtalo de nuevo.',
  openSettings: 'Abrir Ajustes',
  check: 'Revisar',
  checking: 'Revisando…',
  rewrite: 'Reescribir',
  accept: 'Aceptar correcciones',
  acceptHint: 'Tu frase corregida se suma a tus repasos',
  addLead:
    'Añade un punto gramatical de tu lección para escribir una frase con él. Los puntos de tus capturas también aparecen aquí.',
  pattern: 'Estructura',
  meaning: 'Significado',
  meaningPlaceholder: 'No es que…',
  lesson: 'Lección',
  addPoint: 'Añadir punto gramatical',
  yourSentence: 'Tu frase',
  dictate: 'Dictar tu frase',
  placeholder: 'Escribe o dicta en japonés',
  instead: 'En su lugar: ',
  styleNote: 'Nota de estilo',
  correction: 'Corrección',
  markedLabel: 'Tu frase, corregida por el tutor',
  unverified: 'Lecturas de estas notas que el diccionario no pudo confirmar: ',
  unverifiedEnd: 'Esta frase queda fuera de las sesiones de lectura.',
  notTarget: 'Esta frase aún no usa {pattern}, así que no cuenta como usada.',
} satisfies Messages['compose'];
