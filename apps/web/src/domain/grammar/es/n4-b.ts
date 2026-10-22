/** Spanish texts for N4 grammar, part B (N9). Written for this app. */
import type { ById, GrammarText } from '../../content-types.ts';

export const ES_N4_B: ById<GrammarText> = {
  'te-shimau': {
    meaning: 'acabar haciendo; hacer por completo',
    explanation:
      'てしまう marca una acción como hecha y terminada, a menudo con pesar: 財布を忘れてしまった. A veces solo subraya que una tarea está acabada.',
  },
  'te-aru': {
    meaning: 'estar hecho (y seguir así)',
    formation: 'V-て transitivo + ある',
    explanation:
      'てある describe un estado que dejó la acción intencionada de alguien, como una ventana que alguien ha abierto. El objeto suele llevar が.',
  },
  'te-oku': {
    meaning: 'hacer de antemano; dejar como está',
    explanation:
      'ておく es hacer algo ahora para estar preparado más tarde, o dejar las cosas como están. Al hablar suele reducirse a とく.',
  },
  'te-iku': {
    meaning: 'ir haciendo; cambiar de ahora en adelante',
    explanation:
      'ていく se aleja del hablante, en el espacio o en el tiempo: un cambio que seguirá de ahora en adelante. Es la pareja de てくる.',
  },
  'te-kuru': {
    meaning: 'empezar a; ir a hacer y volver',
    explanation:
      'てくる se acerca al hablante: un cambio que ha empezado y llega hasta ahora, o ir a algún sitio y volver. 雨が降ってきた es “empezó a llover”.',
  },
  'tokoro-da': {
    meaning: 'estar a punto de; estar en medio de',
    formation: 'V-diccionario / V-ている + ところだ',
    explanation:
      'ところ señala un momento de una acción. Con la forma de diccionario es justo antes de la acción, y con ている es en medio de ella.',
  },
  'ta-bakari': {
    meaning: 'acabar de hacer',
    explanation:
      'たばかり dice que, a ojos del hablante, ha pasado poco tiempo desde la acción. Pueden ser semanas, si todavía se siente reciente.',
  },
  'te-miru': {
    meaning: 'probar a hacer (y ver)',
    explanation:
      'てみる es hacer algo para descubrir cómo es. Se escribe en kana, porque no es “ver” con los ojos.',
  },
  hajimeru: {
    meaning: 'empezar a',
    formation: 'V-raíz + 始める',
    explanation:
      '始める tras la raíz -masu marca el comienzo de una acción o de un cambio. Se conjuga como un verbo normal.',
  },
  owaru: {
    meaning: 'terminar de',
    formation: 'V-raíz + 終わる',
    explanation:
      '終わる tras la raíz -masu dice que una acción se ha completado, como leer un libro hasta el final.',
  },
  tsuzukeru: {
    meaning: 'seguir haciendo',
    formation: 'V-raíz + 続ける',
    explanation:
      '続ける tras la raíz -masu dice que una acción continúa sin parar. 歩き続けた es “siguió caminando”.',
  },
  tara: {
    meaning: 'si; cuando; después de',
    formation: 'V / adj en forma た + ら',
    explanation:
      'たら plantea una condición, o un momento tras el cual ocurre algo. Es el condicional más flexible en la lengua hablada.',
  },
  ba: {
    meaning: 'si',
    formation: 'V (〜えば) / adj-い (〜ければ)',
    explanation:
      'ば expresa una condición y lo que se deriva de ella, a menudo en verdades generales o consejos. La oración principal rara vez da una orden.',
  },
  'to-conditional': {
    meaning: 'siempre que, si (entonces, de forma natural)',
    formation: 'V-diccionario / V-ない + と',
    explanation:
      'Este と une una causa con su resultado natural y automático, como pulsar un botón y que se abra una puerta. La segunda oración no puede ser una petición.',
  },
  nara: {
    meaning: 'si (es así); en cuanto a',
    formation: 'forma simple / N + なら',
    explanation:
      'なら retoma algo que se acaba de decir o se da por hecho y da un consejo al respecto: “si vas a ir a Japón, …”. No expresa orden temporal.',
  },
  passive: {
    meaning: 'ser hecho (pasiva)',
    formation: 'V godan raíz -ない + れる / V ichidan + られる',
    explanation:
      'La pasiva convierte en sujeto a quien recibe la acción, y quien la hace lleva に. A menudo añade la sensación de verse perjudicado por ella.',
  },
  causative: {
    meaning: 'hacer o dejar (que alguien haga)',
    formation: 'V godan raíz -ない + せる / V ichidan + させる',
    explanation:
      'La causativa dice que alguien obliga o permite a otra persona actuar. La persona que actúa lleva に o を.',
  },
  'causative-passive': {
    meaning: 'verse obligado a hacer',
    formation: 'V-causativo (〜させ) + られる',
    explanation:
      'Esta forma dice que a alguien le obligaron a hacer algo contra su voluntad. Quien le obligó lleva に.',
  },
  'sonkei-verbs': {
    meaning: 'verbos respetuosos',
    formation: 'verbos especiales: いらっしゃる, おっしゃる, 召し上がる, なさる, ご覧になる',
    explanation:
      'Unos cuantos verbos comunes tienen formas respetuosas propias, que se usan para lo que hace un superior o un cliente. Nunca se usan para uno mismo.',
  },
  'o-ni-naru': {
    meaning: 'forma respetuosa de un verbo',
    formation: 'お + V-raíz + になる',
    explanation:
      'お + raíz -masu + になる eleva a la persona que actúa. Sirve para la mayoría de los verbos sin forma respetuosa especial.',
  },
  'kenjou-verbs': {
    meaning: 'verbos humildes',
    formation: 'verbos especiales: 参る, 申す, いたす, 伺う, 拝見する, おる',
    explanation:
      'Los verbos humildes rebajan las acciones del propio hablante para mostrar respeto al oyente. 参ります sustituye a 行きます y 来ます.',
  },
  'o-suru': {
    meaning: 'hacer (por alguien), con humildad',
    formation: 'お + V-raíz + する / いたす',
    explanation:
      'お + raíz -masu + する es una forma humilde de ofrecer o hacer algo por un superior. Con いたす es aún más humilde.',
  },
  gozaimasu: {
    meaning: 'ser, estar (muy cortés)',
    explanation:
      'でございます es un です muy cortés, que se oye en tiendas, hoteles y anuncios. ございます solo es un あります cortés.',
  },
};
