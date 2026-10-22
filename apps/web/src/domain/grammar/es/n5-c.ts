/** Spanish texts for N5 grammar, part C (N9). Written for this app. */
import type { ById, GrammarText } from '../../content-types.ts';

export const ES_N5_C: ById<GrammarText> = {
  'ku-naru': {
    meaning: 'volverse, llegar a ser',
    formation: 'adj-い (〜く) / adj-な, N + に + なる',
    explanation:
      'なる describe un cambio de estado. Un adjetivo -い toma su forma en く ante él; un sustantivo o un adjetivo -な toma に.',
  },
  'ku-suru': {
    meaning: 'hacer (algo) …, volver (algo) …',
    formation: 'adj-い (〜く) / adj-な + に + する',
    explanation:
      'する tras una forma adverbial dice que alguien cambia algo a propósito. Compara 静かになる, “se queda en silencio”, con 静かにする, “hacer silencio”.',
  },
  'ni-iku': {
    meaning: 'ir (a un sitio) a hacer',
    formation: 'V-raíz + に + 行く / 来る / 帰る',
    explanation:
      'La raíz de la forma -masu con に indica el propósito de ir o venir. 飲みに行く es “salir a tomar algo”.',
  },
  'no-ga-suki': {
    meaning: 'gustar hacer',
    formation: 'V-diccionario + のが好き / 嫌い',
    explanation:
      'の convierte un sintagma verbal en sustantivo, así que puede llevar が ante 好き. La misma estructura funciona con 嫌い y 大好き.',
  },
  'no-ga-jouzu': {
    meaning: 'hacer algo bien, tener habilidad para',
    formation: 'V-diccionario + のが上手 / 下手 / 得意 / 苦手',
    explanation:
      '上手 elogia la habilidad de otra persona; para uno mismo, 得意 suena menos presuntuoso. 下手 y 苦手 son los opuestos.',
  },
  'amari-nai': {
    meaning: 'no muy, no mucho',
    formation: 'あまり + negativo',
    explanation:
      'あまり con un negativo lo suaviza a “no muy” o “no a menudo”. Con un verbo afirmativo significa otra cosa, así que fíjate en la terminación.',
  },
  'zenzen-nai': {
    meaning: 'nada, en absoluto',
    formation: '全然 + negativo',
    explanation:
      '全然 con un negativo lo vuelve total: “nada en absoluto”. Es más fuerte que あまり.',
  },
  'adj-kute': {
    meaning: 'y (uniendo adjetivos); porque es …',
    formation: 'adj-い (〜い → 〜くて)',
    explanation:
      'くて es la forma て de un adjetivo -い. Une una descripción con la siguiente y, a veces, da su causa.',
  },
  'adj-katta': {
    meaning: 'era, fue (pasado del adjetivo -い)',
    formation: 'adj-い (〜い → 〜かった)',
    explanation:
      'Un adjetivo -い tiene su propia forma pasada: 寒い pasa a 寒かった. No uses でした con él; añade です tras かった para ser cortés.',
  },
  'adj-ku-nai': {
    meaning: 'no es (negativo del adjetivo -い)',
    formation: 'adj-い (〜い → 〜くない)',
    explanation:
      'El negativo de un adjetivo -い cambia い por くない. いい es la excepción: pasa a よくない.',
  },
  ne: {
    meaning: '¿verdad?, ¿no? (busca acuerdo)',
    formation: 'oración + ね',
    explanation:
      'ね al final invita al oyente a estar de acuerdo, o comprueba que comparte un sentimiento. Hace el habla más cercana.',
  },
  yo: {
    meaning: 'te digo que (información nueva)',
    formation: 'oración + よ',
    explanation:
      'よ marca algo que el oyente aún no sabe. Si se usa demasiado, puede sonar insistente.',
  },
  'ka-question': {
    meaning: 'marcador de pregunta',
    formation: 'oración + か',
    explanation:
      'か al final convierte una oración cortés en pregunta, así que no hace falta signo de interrogación. En el habla coloquial, basta con la entonación ascendente.',
  },
  'ga-aru': {
    meaning: 'hay (una cosa); tener',
    formation: 'lugar + に + N + があります',
    explanation:
      'ある es para cosas que no se mueven solas, como libros y edificios. También significa “tener” una cosa o un evento.',
  },
  'ga-iru': {
    meaning: 'hay (un ser vivo)',
    formation: 'lugar + に + N + がいます',
    explanation:
      'いる es para personas y animales. Úsalo también para la familia: 兄がいます significa “tengo un hermano mayor”.',
  },
  ageru: {
    meaning: 'dar (a otra persona)',
    formation: 'persona + に + N + をあげる',
    explanation:
      'あげる es dar desde el lado del hablante hacia otra persona. Para un regalo que te llega a ti, usa くれる.',
  },
  kureru: {
    meaning: 'dar (a mí o a los míos)',
    formation: 'persona + が + N + をくれる',
    explanation: 'くれる es dar hacia el hablante o su familia. Quien da es el sujeto.',
  },
  morau: {
    meaning: 'recibir',
    formation: 'persona + に / から + N + をもらう',
    explanation:
      'もらう mira el mismo regalo desde el lado de quien recibe. Quien da se marca con に o から.',
  },
  deshou: {
    meaning: 'probablemente; ¿verdad?',
    formation: 'forma simple (N / adj-な sin だ) + でしょう',
    explanation:
      'でしょう hace una suposición sobre el futuro o sobre algo que no puedes ver. Con entonación ascendente, en cambio, pide acuerdo.',
  },
};
