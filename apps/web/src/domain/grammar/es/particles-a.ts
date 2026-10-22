/** Spanish texts for the case particles (N9, D53). Written for this app. */
import type { ById, FunctionWordText } from '../../content-types.ts';

export const ES_PARTICLES_A: ById<FunctionWordText> = {
  'particle-ga': {
    meaning: 'marcador de sujeto',
    explanation:
      'が marca quién o qué hace algo, o de qué trata la oración cuando es información nueva. Responde a “¿quién?” o “¿qué?”.',
    uses: [
      { use: 'El sujeto, a menudo información nueva', translation: 'Está lloviendo.' },
      { use: 'Lo que existe, con ある y いる', translation: 'Hay un perro en el parque.' },
      { use: 'Lo que gusta, se quiere o se entiende', translation: 'Me gustan los gatos.' },
      { use: 'Quién, en una pregunta y su respuesta', translation: '¿Quién vino?' },
    ],
  },
  'particle-wa': {
    meaning: 'marcador de tema: en cuanto a',
    explanation:
      'は fija el tema: aquello de lo que habla el resto de la oración. Se lee わ. El tema suele ser algo ya conocido.',
    uses: [
      { use: 'El tema de la oración', translation: 'Soy estudiante.' },
      { use: 'Contraste con otra cosa', translation: 'Como carne, pero no como pescado.' },
      {
        use: 'Tras otra partícula, para convertirla en tema',
        translation: 'En Japón, los coches circulan por la izquierda.',
      },
    ],
  },
  'particle-wo': {
    meaning: 'marcador de objeto directo',
    explanation:
      'を marca aquello sobre lo que recae una acción. Se lee お. Con verbos de movimiento marca el lugar por el que pasas o del que sales.',
    uses: [
      { use: 'El objeto de un verbo', translation: 'Tomo café todas las mañanas.' },
      { use: 'El lugar por el que te mueves', translation: 'Di un paseo por el parque.' },
      { use: 'El lugar del que sales', translation: 'Salgo de casa a las ocho.' },
    ],
  },
  'particle-ni': {
    meaning: 'a, en (un punto)',
    explanation:
      'に señala un punto: un momento, el lugar donde está algo, un destino o la persona que recibe algo. El contexto indica cuál.',
    uses: [
      { use: 'Un momento concreto', translation: 'Me levanto a las siete.' },
      { use: 'Dónde está algo, con ある y いる', translation: 'Hay un libro sobre la mesa.' },
      { use: 'Un destino', translation: 'La semana que viene voy a Kioto.' },
      { use: 'Quién recibe o a quién se pide', translation: 'Le escribí una carta a un amigo.' },
    ],
  },
  'particle-de': {
    meaning: 'en, por, con',
    explanation:
      'で marca dónde ocurre una acción, o su medio o su causa. A diferencia de に, el lugar con で es donde se hace algo, no donde está algo.',
    uses: [
      { use: 'Dónde ocurre una acción', translation: 'Estudio en la biblioteca.' },
      { use: 'Un medio o herramienta', translation: 'Voy a la escuela en autobús.' },
      { use: 'Una causa', translation: 'Falté al trabajo por un resfriado.' },
      { use: 'Un ámbito o grupo', translation: 'Es el más alto de la clase.' },
    ],
  },
  'particle-to': {
    meaning: 'y, con; cita',
    explanation:
      'と entre sustantivos los enumera todos (“A y B”). Tras una persona significa “con”. Tras palabras o una oración, las cita.',
    uses: [
      { use: 'Y, enumerando todos los elementos', translation: 'Compré pan y huevos.' },
      { use: 'Con alguien', translation: 'Fui de compras con mi madre.' },
      {
        use: 'Citar lo que se dijo o pensó',
        translation: 'La profesora dijo que mañana no vendría.',
      },
    ],
  },
  'particle-mo': {
    meaning: 'también; incluso',
    explanation:
      'も sustituye a は, が o を para decir “también”. Tras una cantidad subraya cuánto es, y con una palabra interrogativa y un negativo significa “ninguno”.',
    uses: [
      { use: 'También', translation: 'Yo también voy.' },
      {
        use: 'Nada menos que, subrayando una cantidad',
        translation: 'Esperé nada menos que tres horas.',
      },
      { use: 'Nada, con una palabra interrogativa', translation: 'Hoy no he comido nada.' },
    ],
  },
  'particle-no': {
    meaning: 'de (posesión, relación)',
    explanation:
      'の une dos sustantivos: el primero describe al segundo o es su dueño. Tras un verbo, convierte la cláusula en sustantivo.',
    uses: [
      { use: 'De quién', translation: 'Este es el bolso de mi hermana.' },
      { use: 'De qué tipo', translation: 'Conocí al profesor de japonés.' },
      { use: 'Dónde o cuándo', translation: 'Estoy esperando delante de la estación.' },
      { use: 'Convertir un verbo en sustantivo', translation: 'Me gusta leer libros.' },
    ],
  },
  'particle-e': {
    meaning: 'a, hacia',
    explanation:
      'へ marca la dirección del movimiento. Se lee え. Se parece a に para los destinos, pero pone más peso en el camino.',
    uses: [
      {
        use: 'Dirección del movimiento',
        translation: 'En las vacaciones de verano voy a Hokkaido.',
      },
      {
        use: 'Para quién es una carta o un regalo, como への',
        translation: 'Escribí una carta para mi madre.',
      },
    ],
  },
  'particle-kara-from': {
    meaning: 'desde, de',
    explanation:
      'から tras un sustantivo marca dónde o cuándo empieza algo, o de quién viene algo. Tras una oración, en cambio, significa “porque”.',
    uses: [
      { use: 'Un punto de partida', translation: 'Está a diez minutos a pie desde la estación.' },
      { use: 'Un momento de inicio', translation: 'La clase empieza a las nueve.' },
      { use: 'De quién viene', translation: 'Me llegó un correo de un amigo.' },
    ],
  },
  'particle-kara-because': {
    meaning: 'porque, así que',
    explanation: 'から tras una oración da la razón de lo que sigue. Suena directo y personal.',
    uses: [
      {
        use: 'Una razón, antes del resultado',
        translation: 'Hace frío, así que cierro la ventana.',
      },
      { use: 'Una razón dada después, con です', translation: 'No voy. Estoy ocupado.' },
    ],
  },
  'particle-made': {
    meaning: 'hasta',
    explanation:
      'まで marca un punto final en el tiempo o el espacio. Con から da ambos extremos: 九時から五時まで.',
    uses: [
      { use: 'Hasta un momento', translation: 'Trabajo hasta las cinco.' },
      { use: 'Hasta un lugar', translation: 'Te acompaño hasta la estación.' },
      { use: 'Incluso, como extremo', translation: 'Hasta los niños lo saben.' },
    ],
  },
};
