/** Spanish messages: In the wild, a photo of Japanese out in the world read by the tutor. */
import type { Messages } from '../../types.ts';

export const wild = {
  title: 'En la calle',
  intro:
    'Fotografía un cartel, un menú o una etiqueta. El tutor lo lee y ves qué kanji ya conoces.',
  takePhoto: 'Hacer una foto',
  choosePhoto: 'Elegir una foto',
  read: 'Leer esta foto',
  reading: 'Leyendo la foto…',
  photoLabel: 'Tu foto, con sus kanji marcados',
  summary: 'Puedes leer {known} de los {total} kanji de aquí.',
  summaryNone: 'No hay kanji en esta foto.',
  keyKnown: 'Los que conoces',
  keyNew: 'Nuevos para ti',
  yours: 'Ya son tuyos',
  fresh: 'Nuevos para ti',
  add: 'Añadir',
  added: 'Añadido',
  addAll: 'Añadir todos ({n})',
  addLabel: 'Añadir {word} a tus palabras',
  checked: 'Lectura comprobada',
  unchecked: 'Lectura aún sin comprobar',
  more: 'Y además:',
  tutorLabel: 'Lo que leyó el tutor',
  another: 'Otra foto',
  note: 'Usa IA · una petición por foto',
  tutorAsk: '¿Qué dice este cartel?',
  tutorAbout: 'esta foto',
  notWord: 'No está en el diccionario, así que no se puede añadir',
} satisfies Messages['wild'];
