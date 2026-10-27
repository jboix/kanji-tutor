/** Spanish messages: why the AI tutor gave no answer (shared by every feature). */
import type { Messages } from '../../types.ts';

export const ai = {
  offline: 'Estás sin conexión. Las explicaciones necesitan conexión; lo demás sigue funcionando.',
  noKey: 'Añade una clave de Gemini en Ajustes para usar el tutor de IA.',
  rateLimit: 'El tutor necesita un minuto: Gemini está limitando las solicitudes de esta clave.',
  needsMinute: 'El tutor necesita un minuto.',
  askAgainIn: 'Podrás volver a preguntar en {n} s.',
  askAgainNow: 'Ya puedes volver a preguntar.',
  invalid: 'No se pudo leer la respuesta.',
  cancelled: 'Se canceló la solicitud.',
  refused: 'Gemini rechazó la solicitud ({status}). Revisa la clave y el modelo en Ajustes.',
  noAnswer: 'Gemini no respondió.',
  timeout:
    'Gemini tardó demasiado en responder; puede estar saturado. Vuelve a intentarlo en un momento.',
  busy: 'Gemini está saturado ahora mismo. Vuelve a intentarlo en un momento.',
} satisfies Messages['ai'];
