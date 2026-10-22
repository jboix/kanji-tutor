/** Spanish texts for N3 grammar, part D (N9). Written for this app. */
import type { ById, GrammarText } from '../../content-types.ts';

export const ES_N3_D: ById<GrammarText> = {
  kiru: {
    meaning: 'hacer por completo, hasta el final',
    formation: 'V-raíz + きる',
    explanation:
      'きる tras la raíz -masu indica que una acción se lleva hasta el final: 全部食べきった.',
  },
  kakeru: {
    meaning: 'a medio hacer, empezar a',
    formation: 'V-raíz + かける / かけの + N',
    explanation:
      'かける describe una acción empezada pero no terminada: 読みかけの本, “un libro a medio leer”. También puede significar “a punto de”.',
  },
  dasu: {
    meaning: 'romper a, empezar de repente',
    formation: 'V-raíz + 出す',
    explanation:
      '出す tras la raíz -masu marca un comienzo repentino: 急に泣き出した. 始める es el “empezar” neutro.',
  },
  au: {
    meaning: 'hacer mutuamente, juntos',
    formation: 'V-raíz + 合う',
    explanation:
      '合う hace recíproca una acción: 話し合う es “hablarlo”, 助け合う es “ayudarse mutuamente”.',
  },
  naosu: {
    meaning: 'rehacer, volver a hacer (mejor)',
    formation: 'V-raíz + 直す',
    explanation:
      '直す tras la raíz -masu significa volver a hacer algo para corregirlo: 書き直す, “reescribir”.',
  },
  wasureru: {
    meaning: 'olvidarse de hacer',
    formation: 'V-raíz + 忘れる',
    explanation:
      '忘れる tras la raíz -masu indica que se olvidó un paso: 傘を持ち忘れた, “se me olvidó llevar el paraguas”.',
  },
  kirenai: {
    meaning: 'no poder (terminar), demasiados para',
    formation: 'V-raíz + きれない',
    explanation:
      'きれない indica que algo es demasiado para terminarlo: 一人では食べきれない. 数えきれない es “incontables”.',
  },
  'you-ga-nai': {
    meaning: 'no hay manera de',
    formation: 'V-raíz + ようがない',
    explanation:
      'ようがない indica que no existe ningún método, así que la acción es imposible: 連絡のしようがない, “no hay manera de contactar con ellos”.',
  },
  'you-to-suru': {
    meaning: 'intentar; estar a punto de',
    formation: 'V-volitivo + とする',
    explanation:
      'ようとする describe un intento o el momento justo antes de una acción. Suele ir con una interrupción: 出かけようとした時.',
  },
  'koto-ni-shite-iru': {
    meaning: 'tener por norma',
    formation: 'V-diccionario / V-ない + ことにしている',
    explanation:
      'ことにしている es una norma personal mantenida en el tiempo, fruto de una decisión anterior.',
  },
  'koto-ni-natte-iru': {
    meaning: 'la norma es que; estar previsto que',
    formation: 'V-diccionario / V-ない + ことになっている',
    explanation:
      'ことになっている describe una norma o un acuerdo fijados por otros, como una escuela o una empresa.',
  },
  'to-shitara': {
    meaning: 'suponiendo que, si',
    formation: 'forma simple + としたら / とすれば',
    explanation:
      'としたら imagina una situación que quizá no sea real y luego pregunta o dice qué pasaría.',
  },
  'sae-ba': {
    meaning: 'con solo que, siempre que',
    explanation:
      'さえ…ば nombra la única condición que basta: 時間さえあれば, “si al menos tuviera tiempo”.',
  },
  baai: {
    meaning: 'en caso de, si',
    formation: 'forma simple / N + の + 場合(は)',
    explanation:
      '場合 plantea un caso posible, como en normas e instrucciones: 雨の場合は中止です.',
  },
  'te-kara-de-nai-to': {
    meaning: 'no hasta que, solo después de',
    explanation:
      'てからでないと indica que algo no puede ocurrir antes de completar otro paso. La segunda cláusula es negativa.',
  },
  sae: {
    meaning: 'incluso, hasta',
    explanation:
      'さえ elige un ejemplo extremo para mostrar hasta dónde llega algo: 子供でさえ知っている, “hasta un niño lo sabe”.',
  },
  koso: {
    meaning: 'precisamente, este (y no otro)',
    explanation:
      'こそ pone un fuerte énfasis en un elemento: 今度こそ, “esta vez sí”. Es un énfasis positivo.',
  },
  nanka: {
    meaning: 'cosas como (con desdén)',
    explanation:
      'なんか y なんて quitan importancia a algo o muestran la baja opinión que el hablante tiene de ello: 幽霊なんか怖くない.',
  },
  datte: {
    meaning: 'incluso, también (coloquial)',
    explanation:
      'Tras un sustantivo, だって es un でも coloquial: “incluso yo” o “yo también”. Al principio de una oración significa, en cambio, “pero, es que”.',
  },
  'oki-ni': {
    meaning: 'cada dos, a intervalos de',
    formation: 'número + contador + おきに',
    explanation:
      'おきに deja un hueco de ese tamaño entre repeticiones: 二日おきに es cada tres días, con dos días entre medias.',
  },
  'goto-ni': {
    meaning: 'cada',
    formation: 'N / número + contador + ごとに',
    explanation:
      'ごとに indica que algo ocurre en cada unidad, sin huecos: 一時間ごとに, “cada hora”.',
  },
  darake: {
    meaning: 'lleno de, cubierto de',
    explanation:
      'だらけ indica que algo está cubierto de una cosa no deseada: 泥だらけ, “todo embarrado”.',
  },
  teki: {
    meaning: '-ico, -al (adjetivo a partir de un sustantivo)',
    explanation:
      '的 convierte un sustantivo en un adjetivo -な: 経済的な問題, “un problema económico”. Es frecuente en el japonés escrito.',
  },
  'ka-suffix': {
    meaning: '-ización, volverse',
    explanation:
      '化 forma un sustantivo de cambio, que puede llevar する: 国際化, “internacionalización”.',
  },
  muki: {
    meaning: 'adecuado para',
    explanation:
      '向き indica que algo resulta adecuado para un grupo: この本は子供向きだ. No dice que se hiciera para ellos.',
  },
  muke: {
    meaning: 'dirigido a, hecho para',
    explanation:
      '向け indica que algo se diseñó para un grupo: 初心者向けの本, “un libro para principiantes”.',
  },
  'koto-command': {
    meaning: 'deber, hacer (norma escrita)',
    formation: 'V-diccionario / V-ない + こと。',
    explanation:
      'Una oración que termina en こと es una instrucción escrita, como en normas escolares y avisos: 会議中は話さないこと.',
  },
  'ki-ga-suru': {
    meaning: 'tener la sensación de que',
    formation: 'forma simple (adj-な + な / N + の) + 気がする',
    explanation:
      '気がする es una impresión vaga, sin pruebas: 雨が降りそうな気がする. Es más suave que と思う.',
  },
};
