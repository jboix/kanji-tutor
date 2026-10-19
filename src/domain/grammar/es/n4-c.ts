/** Spanish texts for N4 grammar, part C (N9, D53). Written for this app. */
import type { ById, GrammarText } from '../../content-types.ts';

export const ES_N4_C: ById<GrammarText> = {
  shi: {
    meaning: 'y además (enumerar razones)',
    formation: 'forma simple + し',
    explanation:
      'し enumera una o varias razones y sugiere que hay otras. La conclusión suele venir al final.',
  },
  noni: {
    meaning: 'aunque, a pesar de que',
    formation: 'forma simple (adj-な / N + な) + のに',
    explanation:
      'のに une dos hechos que chocan y expresa sorpresa o frustración por el resultado. No puede ir seguido de una petición.',
  },
  'te-mo': {
    meaning: 'aunque, incluso si',
    formation: 'V-て / adj-い (〜くて) + も',
    explanation:
      'ても dice que el resultado no cambia sea cual sea la condición. Seguido de いい pasa a expresar permiso, así que fíjate en lo que viene después.',
  },
  'tame-ni': {
    meaning: 'para, con el fin de',
    formation: 'V-diccionario / N + の + ために',
    explanation:
      'ために indica un objetivo que el sujeto decide perseguir. El verbo que lo precede es algo que se puede hacer a propósito.',
  },
  'you-ni': {
    meaning: 'para que, de modo que',
    formation: 'V-diccionario / potencial / V-ない + ように',
    explanation:
      'ように indica un fin que es un estado o algo fuera de nuestro control directo: para no olvidarme. Compáralo con ために, cuyo fin es una acción.',
  },
  'hodo-nai': {
    meaning: 'no tan … como',
    formation: 'N + ほど + negativo',
    explanation:
      'ほど con un negativo dice que algo no llega al nivel de aquello con lo que se compara. 去年ほど暑くない es “no hace tanto calor como el año pasado”.',
  },
  'hou-ga-ii': {
    meaning: 'más vale, deberías',
    explanation:
      'ほうがいい da un consejo bastante firme. Lo habitual es la forma pasada para “deberías hacerlo”, y ない para “más vale que no”.',
  },
  'ba-ii': {
    meaning: 'deberías; estaría bien',
    explanation:
      'ばいい sugiere una solución sencilla, o pregunta qué hacer: どうすればいいですか. たらいい significa casi lo mismo.',
  },
  'tara-dou': {
    meaning: '¿por qué no…?',
    explanation:
      'Es una sugerencia suave que deja la decisión al oyente. どうでしょうか es aún más cortés.',
  },
  sugiru: {
    meaning: 'demasiado, en exceso',
    formation: 'V-raíz / adj-い (sin い) / adj-な + すぎる',
    explanation:
      'すぎる dice que algo sobrepasa lo conveniente: 食べすぎた, “comí demasiado”. Se conjuga como un verbo ichidan.',
  },
  yasui: {
    meaning: 'fácil de',
    formation: 'V-raíz + やすい',
    explanation:
      'やすい tras la raíz -masu forma un adjetivo -い de facilidad: 書きやすいペン, “un bolígrafo con el que es fácil escribir”. También puede significar “propenso a”.',
  },
  nikui: {
    meaning: 'difícil de',
    formation: 'V-raíz + にくい',
    explanation:
      'にくい es lo contrario de やすい: la acción es difícil por la propia cosa. 飲みにくい薬 es un medicamento difícil de tragar.',
  },
  'n-desu': {
    meaning: 'es que… (explicar)',
    formation: 'forma simple (adj-な / N + な) + んです / のです',
    explanation:
      'んです presenta una afirmación como explicación o pide una. Suena implicado y personal; si se abusa de él, puede sonar insistente.',
  },
  'to-iu': {
    meaning: 'llamado, que se llama',
    explanation:
      'という nombra algo que el oyente quizá no conozca: 田中という人, “una persona llamada Tanaka”.',
  },
  'to-omou': {
    meaning: 'creo que',
    formation: 'forma simple + と思う',
    explanation:
      'と思う marca una opinión o una suposición como propia del hablante. Delante, un sustantivo o un adjetivo -な necesita だ.',
  },
  'to-itte-ita': {
    meaning: 'dijo que',
    formation: 'forma simple + と言っていた',
    explanation:
      'と言っていた transmite lo que alguien dijo antes. La forma ている muestra que el mensaje sigue siendo pertinente.',
  },
  'ka-dou-ka': {
    meaning: 'si… o no',
    formation: 'forma simple + かどうか',
    explanation:
      'かどうか inserta una pregunta de sí o no dentro de una oración. Suelen seguirle verbos como 分からない y 知っている.',
  },
  'embedded-ka': {
    meaning: 'qué / dónde / quién… (pregunta indirecta)',
    formation: 'palabra interrogativa … forma simple + か + 知る / 分かる',
    explanation:
      'Una pregunta con palabra interrogativa puede ir dentro de una oración con か. 駅はどこか知っていますか pregunta si sabes dónde está la estación.',
  },
};
