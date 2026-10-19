/** Spanish texts for N5 grammar, part A (N9, D53). Written for this app. */
import type { ById, GrammarText } from '../../content-types.ts';

export const ES_N5_A: ById<GrammarText> = {
  desu: {
    meaning: 'ser, estar (cortés)',
    explanation:
      'です une un tema con un sustantivo y hace cortés la afirmación. Funciona como “ser” en español, pero va al final de la oración.',
  },
  da: {
    meaning: 'ser, estar (simple)',
    explanation:
      'だ es la versión simple de です. Los amigos lo usan al hablar, y es frecuente en la lengua escrita y dentro de oraciones más largas.',
  },
  'ja-nai': {
    meaning: 'no ser, no estar',
    explanation:
      'Es la negación de です y だ. じゃ es la contracción hablada de では, y ありません es la terminación cortés.',
  },
  deshita: {
    meaning: 'era, fue (cortés)',
    explanation:
      'でした es la forma pasada de です. Úsala con un sustantivo o un adjetivo na que describía algo en el pasado.',
  },
  masu: {
    meaning: 'terminación verbal cortés no pasada',
    formation: 'V-raíz + ます',
    explanation:
      'ます hace cortés un verbo. La misma forma sirve para hábitos, presente y futuro, así que el contexto indica cuál es.',
  },
  masen: {
    meaning: 'negativo cortés: no hacer, no hará',
    formation: 'V-raíz + ません',
    explanation:
      'ません es la negación de ます. Dice, con cortesía, que alguien no hace o no hará algo.',
  },
  mashita: {
    meaning: 'pasado cortés: hizo',
    formation: 'V-raíz + ました',
    explanation:
      'ました es la forma pasada de ます. Cuenta una acción terminada en lenguaje cortés.',
  },
  'masen-deshita': {
    meaning: 'pasado negativo cortés: no hizo',
    formation: 'V-raíz + ませんでした',
    explanation:
      'Añade でした tras ません para decir que algo no ocurrió. Es la forma cortés de negar una acción pasada.',
  },
  'nai-form': {
    meaning: 'negativo simple: no hacer',
    explanation:
      'La forma ない es la negación simple de un verbo. Es lo que dicen los amigos en lugar de ません, y muchas estructuras se basan en ella.',
  },
  'ta-form': {
    meaning: 'pasado simple: hizo',
    explanation:
      'La forma た es el pasado simple de un verbo. Sus cambios de sonido siguen las mismas reglas que la forma て, así que 読む pasa a 読んだ.',
  },
  mashou: {
    meaning: 'hagamos…, vamos a…',
    formation: 'V-raíz + ましょう',
    explanation:
      'ましょう invita al oyente a hacer algo juntos, o acepta un plan. Es cálido y cortés.',
  },
  'masen-ka': {
    meaning: '¿por qué no…?, ¿te gustaría…?',
    formation: 'V-raíz + ませんか',
    explanation:
      'Preguntar en negativo es una forma suave de invitar. Deja espacio para decir que no, por eso suena más suave que ましょう.',
  },
  'mashou-ka': {
    meaning: '¿hago…?, ¿hacemos…?',
    formation: 'V-raíz + ましょうか',
    explanation:
      'ましょうか ofrece hacer algo por el oyente, o pregunta si hacerlo juntos. La pregunta lo convierte en un ofrecimiento, no en un plan.',
  },
  tai: {
    meaning: 'querer (hacer)',
    formation: 'V-raíz + たい',
    explanation:
      'たい convierte un verbo en un adjetivo i de deseo. Habla del hablante o pregunta al oyente; para una tercera persona, el japonés prefiere たがる.',
  },
  hoshii: {
    meaning: 'querer (una cosa)',
    explanation:
      'ほしい es un adjetivo i que dice que quieres algo. Lo deseado se marca con が, y no sirve para lo que quieren otros.',
  },
  'te-kudasai': {
    meaning: 'por favor, haz…',
    explanation:
      'てください pide a alguien que haga algo. Es cortés, pero sigue siendo una petición, por eso los profesores y los carteles lo usan mucho.',
  },
  'naide-kudasai': {
    meaning: 'por favor, no hagas…',
    explanation:
      'Pon でください tras la forma ない para pedir a alguien que no haga algo. Es la forma cortés de prohibir o advertir.',
  },
  'o-kudasai': {
    meaning: 'deme…, por favor',
    explanation:
      'Con un sustantivo, ください pide la cosa en sí. Es lo que se dice al pedir en una tienda o una cafetería.',
  },
  'te-iru': {
    meaning: 'estar haciendo; estar en un estado',
    explanation:
      'ている muestra una acción en curso o un estado que resulta de un cambio. 食べている es “está comiendo”, pero 結婚している es “está casado”.',
  },
  'mada-te-inai': {
    meaning: 'todavía no',
    explanation:
      'まだ con ている en negativo dice que algo aún no ha ocurrido, pero todavía puede ocurrir. Aquí el japonés usa ている, no el pasado.',
  },
  'mou-ta': {
    meaning: 'ya hizo',
    explanation:
      'もう con un verbo en pasado dice que algo ya está hecho. La respuesta “todavía no” a esa pregunta es まだです.',
  },
};
