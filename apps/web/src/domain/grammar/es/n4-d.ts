/** Spanish texts for N4 grammar, part D (N9, D53). Written for this app. */
import type { ById, GrammarText } from '../../content-types.ts';

export const ES_N4_D: ById<GrammarText> = {
  aida: {
    meaning: 'durante, mientras (todo el tiempo)',
    explanation:
      '間 abarca todo un periodo, y la acción principal dura todo ese tiempo. Con に pasa a ser un punto dentro de ese periodo.',
  },
  'aida-ni': {
    meaning: 'mientras, durante (en algún momento)',
    explanation:
      '間に sitúa un único suceso dentro de un periodo: 留守の間に, “mientras estaba fuera”. Compáralo con 間, que dura todo el periodo.',
  },
  'made-ni': {
    meaning: 'para, antes de (un plazo)',
    formation: 'hora / V-diccionario + までに',
    explanation:
      'までに fija un plazo: la acción ocurre en algún momento antes de él. まで solo significa que la acción dura hasta entonces.',
  },
  zutsu: {
    meaning: 'cada uno, de… en…',
    formation: 'cantidad + ずつ',
    explanation:
      'ずつ reparte una cantidad a partes iguales, o la repite paso a paso: 少しずつ, “poco a poco”.',
  },
  bakari: {
    meaning: 'nada más que, solo',
    explanation:
      'ばかり tras un sustantivo dice que solo hay eso, y normalmente se queja de ello. ゲームばかりしている significa “no hace más que jugar a videojuegos”.',
  },
  naide: {
    meaning: 'sin hacer',
    explanation:
      'ないで dice que una acción ocurre sin otra que sería lo normal: 朝ご飯を食べないで, “sin desayunar”.',
  },
  'ta-mama': {
    meaning: 'con… todavía (sin cambiar)',
    explanation:
      'まま dice que un estado sigue igual mientras ocurre otra cosa, a menudo cuando no debería: 電気をつけたまま寝た.',
  },
  'ga-suru': {
    meaning: 'hay (un sonido, olor, sabor)',
    explanation:
      'する con una palabra de sensación dice que esa sensación se percibe: 変な音がする, “oigo un ruido raro”. El hablante no es quien hace la acción.',
  },
  tagaru: {
    meaning: '(otra persona) quiere',
    formation: 'V-raíz + たがる / adj-い (sin い) + がる',
    explanation:
      'がる describe los deseos o sentimientos de otra persona desde fuera. Se usa a menudo como がっている.',
  },
  'te-hoshii': {
    meaning: 'querer que alguien haga',
    formation: 'persona + に + V-て + ほしい',
    explanation:
      'てほしい desea una acción de otra persona. Con un superior suena demasiado directo, así que es mejor hacer una petición.',
  },
  imperative: {
    meaning: '¡hazlo! (orden)',
    formation: 'V godan (〜え) / V ichidan (〜ろ)',
    explanation:
      'El imperativo es una orden tajante. Aparece en el deporte, en carteles, en emergencias y en el habla brusca, y rara vez en una conversación cortés.',
  },
  'na-prohibition': {
    meaning: '¡no lo hagas! (prohibición)',
    formation: 'V-diccionario + な',
    explanation:
      'な tras la forma de diccionario es un “no” tajante. Es la negación del imperativo e igual de fuerte.',
  },
  nasai: {
    meaning: 'hazlo (instrucción)',
    formation: 'V-raíz + なさい',
    explanation:
      'なさい es una orden de alguien con autoridad, como un padre o un examen escrito. Es firme pero no grosera.',
  },
  'te-kuremasen-ka': {
    meaning: '¿me harías…?',
    explanation:
      'Preguntar si alguien te hará un favor es más suave que una petición directa. ませんか le deja margen para negarse.',
  },
  'te-moraemasen-ka': {
    meaning: '¿podrías hacerme…?',
    explanation:
      'Pregunta si podrías recibir el favor, lo cual es más modesto que くれませんか. El sujeto implícito es quien recibe, no quien hace la acción.',
  },
  kana: {
    meaning: 'me pregunto',
    formation: 'forma simple + かな',
    explanation:
      'かな es una pregunta que uno se hace a sí mismo en voz alta. Es coloquial; かしら es una variante más suave.',
  },
  'sa-noun': {
    meaning: '-ez, -ura (grado como sustantivo)',
    formation: 'adj-い (sin い) / adj-な + さ',
    explanation:
      'さ convierte un adjetivo en un sustantivo de grado: 高さ es “altura”. Mide, mientras que 〜み nombra una sensación.',
  },
  'no-nominal': {
    meaning: 'el hecho de hacer (verbo como sustantivo)',
    formation: 'V-simple + の + は / が / を',
    explanation:
      'の convierte una oración en sustantivo para que pueda ser sujeto u objeto. Va bien con lo que se percibe directamente; こと, con hechos abstractos.',
  },
};
