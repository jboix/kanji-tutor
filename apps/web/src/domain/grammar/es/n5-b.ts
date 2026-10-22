/** Spanish texts for N5 grammar, part B (N9). Written for this app. */
import type { ById, GrammarText } from '../../content-types.ts';

export const ES_N5_B: ById<GrammarText> = {
  'te-mo-ii': {
    meaning: 'se puede; poder (permiso)',
    explanation:
      'てもいい da o pide permiso: “aunque lo hagas, no pasa nada”. Añade ですか para preguntar si puedes hacer algo.',
  },
  'te-wa-ikenai': {
    meaning: 'no se debe',
    explanation:
      'てはいけない prohíbe una acción: “si lo haces, no está bien”. Lo usan las normas, los padres y los carteles; en la lengua hablada, だめ puede sustituir a いけない.',
  },
  'te-kara': {
    meaning: 'después de hacer; desde que',
    explanation:
      'てから ordena dos acciones: la primera termina antes de que empiece la segunda. Marca el orden más que una simple forma て.',
  },
  'mae-ni': {
    meaning: 'antes de hacer',
    formation: 'V-diccionario + 前に',
    explanation:
      'El verbo ante 前に va en forma de diccionario, aunque toda la oración esté en pasado. La acción que sigue a 前に ocurre primero.',
  },
  'ato-de': {
    meaning: 'después de hacer',
    explanation:
      'Tras un verbo, 後で necesita la forma pasada, porque la primera acción ya está hecha. Con un sustantivo, se une con の.',
  },
  toki: {
    meaning: 'cuando; en el momento en que',
    formation: 'V-simple / adj-い / adj-な + な / N + の + とき',
    explanation:
      'とき es un sustantivo que significa “momento”, así que una oración entera puede describirlo. El tiempo del verbo que lo precede indica si esa acción va primero.',
  },
  nagara: {
    meaning: 'mientras hace',
    formation: 'V-raíz + ながら',
    explanation:
      'ながら une dos acciones que hace la misma persona a la vez. La acción principal va al final; la que lleva ながら es el fondo.',
  },
  'kara-made': {
    meaning: 'desde … hasta …',
    explanation:
      'から marca dónde o cuándo empieza algo, y まで dónde o cuándo termina. La pareja sirve para tiempos y para lugares.',
  },
  goro: {
    meaning: 'hacia, sobre (un momento)',
    formation: 'hora + ごろ',
    explanation:
      'ごろ tras una hora la vuelve aproximada: 三時ごろ es “hacia las tres”. Para cantidades y duraciones, usa ぐらい.',
  },
  'kara-reason': {
    meaning: 'porque, así que',
    formation: 'forma simple o cortés + から',
    explanation:
      'から tras una oración da la razón de lo que sigue. Suena más personal y directo que ので.',
  },
  node: {
    meaning: 'porque, ya que',
    formation: 'forma simple (adj-な / N + な) + ので',
    explanation:
      'ので da una razón como un hecho objetivo. Es más suave que から, por eso va bien con excusas y explicaciones corteses.',
  },
  'ga-but': {
    meaning: 'pero; y (suavizador)',
    formation: 'oración + が、oración',
    explanation:
      'が tras una oración completa la une a la siguiente con “pero”. También puede suavizar una introducción antes de una petición o una pregunta.',
  },
  kedo: {
    meaning: 'pero, aunque',
    formation: 'oración + けど / けれど',
    explanation:
      'けど es el “pero” cotidiano de la lengua hablada. けれど y けれども son algo más cuidados; los tres unen dos cláusulas.',
  },
  demo: {
    meaning: 'pero, sin embargo (al inicio de la oración)',
    formation: 'でも、oración',
    explanation:
      'でも abre una oración nueva que contradice la anterior. En la lengua escrita formal, usa しかし.',
  },
  yori: {
    meaning: 'que (comparación)',
    formation: 'N + より + adjetivo',
    explanation:
      'より marca aquello con lo que comparas. 東京は大阪より大きい pone Tokio en primer lugar y Osaka como referencia.',
  },
  'no-hou-ga': {
    meaning: 'X es más …',
    formation: 'N + のほうが + adjetivo',
    explanation:
      'のほうが elige el lado que tiene más de una cualidad. Suele responder a una pregunta con どちら, y a menudo va con より.',
  },
  ichiban: {
    meaning: 'el más',
    formation: '(N の中で) N + が一番 + adjetivo',
    explanation:
      '一番 ante un adjetivo lo convierte en superlativo. El grupo suele indicarse con の中で, “entre”.',
  },
  'to-onaji': {
    meaning: 'igual que',
    explanation:
      '同じ significa “igual”, y と marca aquello a lo que es igual. Ante un sustantivo, 同じ queda tal cual, sin な ni の.',
  },
  dochira: {
    meaning: '¿cuál de los dos es más …?',
    explanation:
      'Esta pregunta pide a alguien que elija entre dos cosas. どっち es la forma coloquial de どちら.',
  },
  ya: {
    meaning: 'A, B, etcétera',
    explanation:
      'や enumera algunos ejemplos de una lista más larga, a diferencia de と, que nombra todos los elementos. など al final hace explícito el “etcétera”.',
  },
  'tari-tari': {
    meaning: 'hacer cosas como A y B',
    explanation:
      'たり elige un par de acciones como ejemplos de lo que alguien hace. La lista termina con する, que lleva el tiempo verbal.',
  },
  'ka-or': {
    meaning: 'A o B',
    explanation:
      'か entre dos sustantivos ofrece una elección. Entre dos cláusulas, como en 行くか行かないか, significa “si … o no”.',
  },
  dake: {
    meaning: 'solo, nada más',
    formation: 'N / V-simple + だけ',
    explanation:
      'だけ pone un límite: nada más que esto. A diferencia de しか, funciona con un verbo afirmativo.',
  },
  gurai: {
    meaning: 'unos, aproximadamente (cantidad)',
    formation: 'cantidad + ぐらい / くらい',
    explanation:
      'ぐらい tras una cantidad o un periodo de tiempo lo vuelve aproximado: 十分ぐらい es “unos diez minutos”. くらい significa lo mismo.',
  },
  'shika-nai': {
    meaning: 'solo, nada más que',
    formation: 'N + しか + verbo negativo',
    explanation:
      'しか siempre va con un verbo negativo y subraya que la cantidad es pequeña o insuficiente. 百円しかない suena a “solo tengo cien yenes”.',
  },
};
