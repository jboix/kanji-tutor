/** Spanish messages: answering by voice (I2). */
import type { Messages } from '../../types.ts';

export const voice = {
  prompt: 'Di la palabra subrayada en voz alta',
  hint: 'Mantén pulsado para hablar · se transcribe tal como lo dices, sin corregir',
  tooShort: 'Mantén pulsado el botón mientras hablas y luego suéltalo.',
  nothingHeard: 'No se oyó ninguna lectura. Inténtalo de nuevo, un poco más cerca del micrófono.',
  noRecorder: 'Este navegador no puede grabar audio. Puedes escribir la lectura.',
  offline: 'Responder en voz alta necesita conexión. Puedes escribir la lectura.',
  noKey:
    'Responder en voz alta necesita una clave de Gemini, que se añade en Ajustes. Puedes escribir la lectura.',
  rateLimit: 'Demasiadas solicitudes ahora mismo. Inténtalo en un minuto o escribe la lectura.',
  invalid: 'No se pudo transcribir en kana. Inténtalo de nuevo o escribe la lectura.',
  provider: 'La transcripción no funcionó esta vez. Inténtalo de nuevo o escribe la lectura.',
  failed: 'Algo salió mal. Inténtalo de nuevo.',
  starting: 'Iniciando el micrófono…',
  recording: 'Escuchando… suelta cuando lo hayas dicho',
  transcribing: 'Transcribiendo lo que dijiste…',
  typeReadingInstead: 'Escribir la lectura',
  sentToTutor: 'Cada respuesta se envía al tutor',
  hold: 'Mantén pulsado para hablar',
  typeInstead: 'Escribir',
} satisfies Messages['voice'];
