/** Spanish texts for N4 grammar, part A (N9, D53). Written for this app. */
import type { ById, GrammarText } from '../../content-types.ts';

export const ES_N4_A: ById<GrammarText> = {
  'nakereba-naranai': {
    meaning: 'deber, tener que',
    formation: 'V-ない (sin い) + ければならない / いけない',
    explanation:
      'Literalmente “si no lo haces, no vale”. Expresa un deber o una norma; ならない suena más formal que いけない.',
  },
  'nakute-wa-ikenai': {
    meaning: 'deber, tener que',
    formation: 'V-ない (sin い) + くてはいけない / ならない',
    explanation:
      'Es pariente cercano de なければならない, algo más conversacional. En el habla coloquial se reduce a なくちゃ.',
  },
  'nai-to-ikenai': {
    meaning: 'tener que (necesidad personal)',
    explanation:
      'ないといけない suele expresar una necesidad que siente el hablante, como “ya tengo que irme a casa”. Es muy común en el habla cotidiana.',
  },
  'nakute-mo-ii': {
    meaning: 'no tener que, no hace falta',
    formation: 'V-ない (sin い) + くてもいい',
    explanation:
      'Es lo contrario de una obligación: “aunque no lo hagas, no pasa nada”. かまわない puede sustituir a いい.',
  },
  kamoshirenai: {
    meaning: 'quizá, puede que',
    formation: 'forma simple (N / adj-な sin だ) + かもしれない',
    explanation:
      'かもしれない admite una posibilidad de la que el hablante no está seguro, quizá la mitad o menos. La forma cortés es かもしれません.',
  },
  darou: {
    meaning: 'probablemente; supongo',
    formation: 'forma simple (N / adj-な sin だ) + だろう',
    explanation:
      'だろう es la forma simple de でしょう. Los hombres la usan al hablar, y todos la usan por escrito y dentro de 〜と思う.',
  },
  hazu: {
    meaning: 'debería, se espera que',
    formation: 'forma simple (adj-な + な / N + の) + はずだ',
    explanation:
      'はず es una expectativa segura basada en hechos: “salió hace una hora, así que ya debería estar allí”. No es un consejo; para eso se usa べき o ほうがいい.',
  },
  'you-da': {
    meaning: 'parece que, da la impresión de',
    formation: 'forma simple (adj-な + な / N + の) + ようだ',
    explanation:
      'ようだ saca una conclusión de lo que el hablante ve o percibe. Es más cuidado que みたいだ, que significa lo mismo en el habla coloquial.',
  },
  mitai: {
    meaning: 'parece, tiene pinta de; como',
    formation: 'forma simple / N + みたいだ',
    explanation:
      'みたい es la forma hablada de ようだ. Va directamente tras un sustantivo, sin の, y también sirve para comparar: 子供みたい, “como un niño”.',
  },
  'sou-look': {
    meaning: 'parece que va a; tiene aspecto de…',
    formation: 'V-raíz / adj-い (sin い) / adj-な + そうだ',
    explanation:
      'Este そう juzga por la apariencia: おいしそう, “tiene buena pinta”, o 降りそう, “parece que va a llover”. いい pasa a よさそう.',
  },
  'sou-hearsay': {
    meaning: 'he oído que, dicen que',
    formation: 'forma simple + そうだ',
    explanation:
      'Tras una forma simple completa, そうだ transmite algo que se ha oído o leído. La fuente puede indicarse con によると.',
  },
  rashii: {
    meaning: 'al parecer, por lo visto',
    formation: 'forma simple / N + らしい',
    explanation:
      'らしい transmite, con cierta distancia, una conclusión basada en lo que se ha oído. Se conjuga como un adjetivo -い.',
  },
  'ta-koto-ga-aru': {
    meaning: 'haber hecho (alguna vez)',
    explanation:
      'Este patrón habla de experiencias en la vida, no de una acción reciente. La negación ことがない significa “no haber hecho nunca”.',
  },
  'koto-ga-aru': {
    meaning: 'a veces (hacer)',
    formation: 'V-diccionario / V-ない + ことがある',
    explanation:
      'Con la forma de diccionario, ことがある indica que algo ocurre de vez en cuando. No lo confundas con el pasado たことがある.',
  },
  'koto-ga-dekiru': {
    meaning: 'poder, ser capaz de',
    formation: 'V-diccionario + ことができる',
    explanation:
      'ことができる dice que alguien es capaz de hacer algo, o que algo es posible. Es algo más formal que la forma potencial.',
  },
  'you-ni-naru': {
    meaning: 'llegar a (poder)',
    formation: 'V-diccionario / potencial / V-ない + ようになる',
    explanation:
      'ようになる describe un cambio gradual de capacidad o de hábito: 話せるようになった, “llegué a poder hablar”. Compáralo con なる tras un sustantivo, que es un cambio simple.',
  },
  tsumori: {
    meaning: 'tener la intención de, pensar',
    formation: 'V-diccionario / V-ない + つもりだ',
    explanation:
      'つもり nombra un plan firme que el hablante ha decidido. Preguntar a un superior por su つもり puede sonar brusco.',
  },
  'you-to-omou': {
    meaning: 'creo que voy a, pienso',
    formation: 'V-volitivo + と思う',
    explanation:
      'La forma volitiva más と思う comunica una decisión todavía reciente o algo abierta. Con と思っている es un plan que se mantiene desde hace tiempo.',
  },
  yotei: {
    meaning: 'estar previsto, tener programado',
    formation: 'V-diccionario / N + の + 予定だ',
    explanation: '予定 es un plan fijado, a menudo en el calendario. Es más oficial que つもり.',
  },
  'you-ni-suru': {
    meaning: 'procurar, asegurarse de',
    formation: 'V-diccionario / V-ない + ようにする',
    explanation:
      'ようにする es un esfuerzo consciente por hacer, o no hacer, algo de forma constante. Con している es un hábito que el hablante mantiene.',
  },
  'ni-suru': {
    meaning: 'decidirse por, elegir',
    explanation:
      'Sustantivo + にする elige una opción, como al pedir: コーヒーにします. Es una elección del propio hablante.',
  },
  'koto-ni-suru': {
    meaning: 'decidir (hacer)',
    formation: 'V-diccionario / V-ない + ことにする',
    explanation:
      'ことにする comunica una decisión que ha tomado el hablante. ことにした es la forma habitual de anunciarla.',
  },
  'koto-ni-naru': {
    meaning: 'se ha decidido que',
    formation: 'V-diccionario / V-ない + ことになる',
    explanation:
      'ことになる presenta una decisión como tomada por otros o por las circunstancias. Es una forma modesta de dar noticias sobre uno mismo.',
  },
  'te-ageru': {
    meaning: 'hacer (algo) por alguien',
    explanation:
      'てあげる es hacerle un favor a otra persona. Con un superior puede sonar condescendiente, así que es mejor evitarlo.',
  },
  'te-kureru': {
    meaning: 'alguien hace (algo) por mí',
    explanation:
      'てくれる muestra que el hablante se beneficia de la acción de otro y se lo agradece. Quien hace la acción es el sujeto.',
  },
  'te-morau': {
    meaning: 'conseguir que alguien haga (algo) por mí',
    formation: 'persona + に + V-て + もらう',
    explanation:
      'てもらう ve el favor desde quien lo recibe, y a menudo implica que lo pidió. Quien hace la acción lleva に.',
  },
  'te-itadaku': {
    meaning: 'recibir un favor (humilde)',
    formation: 'persona + に + V-て + いただく',
    explanation:
      'いただく es la forma humilde de もらう. Muestra respeto hacia un profesor, un cliente o cualquiera por encima de ti.',
  },
  'te-kudasaru': {
    meaning: 'alguien (respetado) tiene la amabilidad de',
    explanation:
      'くださる es la forma respetuosa de くれる, para un favor de alguien por encima de ti. Su forma cortés es くださいます.',
  },
};
