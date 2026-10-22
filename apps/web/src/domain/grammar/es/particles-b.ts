/** Spanish texts for the listing, ending and linking particles (N9, D53). Written for this app. */
import type { ById, FunctionWordText } from '../../content-types.ts';

export const ES_PARTICLES_B: ById<FunctionWordText> = {
  'particle-ya': {
    meaning: 'y (entre otros)',
    explanation:
      'や enumera algunos ejemplos e implica que hay más. と enumera todos los elementos; や suele terminar con など, “etcétera”.',
    uses: [
      {
        use: 'Algunos ejemplos entre muchos',
        translation: 'Compré manzanas, mandarinas, etcétera.',
      },
      {
        use: 'Con など al final',
        translation: 'Sobre la mesa hay libros, bolígrafos y cosas así.',
      },
    ],
  },
  'particle-ka': {
    meaning: 'marcador de pregunta; o',
    explanation:
      'か al final convierte una oración en pregunta, así que no hace falta signo de interrogación. Entre sustantivos significa “o”.',
    uses: [
      { use: 'Una pregunta', translation: '¿Vienes mañana?' },
      { use: 'O', translation: 'Tomaré té o café.' },
      { use: 'Alguien, algo: tras una palabra interrogativa', translation: 'Vino alguien.' },
    ],
  },
  'particle-ne': {
    meaning: '¿verdad?, ¿no?',
    explanation:
      'ね al final invita al oyente a estar de acuerdo o comprueba algo que ambos saben. Hace el habla más cálida.',
    uses: [
      { use: 'Buscar acuerdo', translation: 'Hoy hace calor, ¿verdad?' },
      { use: 'Comprobar un detalle', translation: 'La reunión es a partir de las tres, ¿no?' },
    ],
  },
  'particle-yo': {
    meaning: 'te digo, ¿sabes?',
    explanation:
      'よ al final le dice al oyente algo que quizá no sabe, o insiste en algo. Si se usa demasiado, puede sonar insistente.',
    uses: [
      { use: 'Información nueva para el oyente', translation: 'Este pastel está bueno, ¿sabes?' },
      { use: 'Insistir en un consejo', translation: 'Deberías acostarte pronto.' },
    ],
  },
  'particle-kedo': {
    meaning: 'pero, aunque',
    explanation:
      'けど une dos cláusulas con “pero” en el habla cotidiana. Al final de una oración deja algo sin decir y suaviza una petición.',
    uses: [
      { use: 'Pero', translation: 'Era caro, pero lo compré.' },
      { use: 'Suavizar, al final', translation: 'Quería preguntarte una cosa…' },
    ],
  },
  'particle-ga-but': {
    meaning: 'pero',
    explanation:
      'が tras una oración completa significa “pero”, algo más formal que けど. También puede servir de introducción cortés antes de una pregunta.',
    uses: [
      { use: 'Pero', translation: 'Está lloviendo, pero voy a salir.' },
      {
        use: 'Una introducción cortés',
        translation: '¿Puedo preguntarte algo? ¿Dónde está la estación?',
      },
    ],
  },
  'particle-yori': {
    meaning: 'que (comparación)',
    explanation:
      'より marca aquello con lo que se compara algo: A は B より… es “A es más … que B”.',
    uses: [
      { use: 'Que, en una comparación', translation: 'El tren es más rápido que el autobús.' },
      { use: 'Más que, antes que', translation: 'Me gusta más el pescado que la carne.' },
    ],
  },
  'particle-shika': {
    meaning: 'solo (con un negativo)',
    explanation:
      'しか siempre va con un verbo negativo: しか…ない significa “solo” y subraya que es menos de lo esperado.',
    uses: [
      { use: 'Solo, y no basta', translation: 'Solo tengo cien yenes en la cartera.' },
      { use: 'Nada más que', translation: 'El domingo no salí de casa.' },
    ],
  },
  'particle-dake': {
    meaning: 'solo, nada más',
    explanation: 'だけ limita algo a lo que precede, sin el matiz negativo de しか.',
    uses: [
      { use: 'Solo, nada más', translation: 'Solo agua, por favor.' },
      { use: 'Solo, tras un verbo', translation: 'Solo estoy mirando.' },
    ],
  },
  'particle-node': {
    meaning: 'porque, ya que',
    explanation:
      'ので da una razón como un hecho. Es más suave que から, por eso va bien con excusas corteses.',
    uses: [
      { use: 'Una razón como hecho', translation: 'Como llueve, me quedo en casa.' },
      { use: 'Una excusa cortés', translation: 'Tengo un asunto pendiente, así que me voy antes.' },
    ],
  },
  'particle-noni': {
    meaning: 'aunque, a pesar de que',
    explanation:
      'のに une dos hechos en los que el segundo no es lo esperable, a menudo con sorpresa o pesar.',
    uses: [
      {
        use: 'Aunque, contra lo esperado',
        translation: 'Tomé una medicina, pero todavía me duele la cabeza.',
      },
      { use: 'Pesar, al final', translation: 'Deberías haber venido antes.' },
    ],
  },
};
