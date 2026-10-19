/** Spanish texts for N3 grammar, part C (N9, D53). Written for this app. */
import type { ById, GrammarText } from '../../content-types.ts';

export const ES_N3_C: ById<GrammarText> = {
  'zu-ni': {
    meaning: 'sin hacer',
    formation: 'V-ない (raíz) + ずに (する → せずに)',
    explanation:
      'ずに es la forma escrita de ないで: 何も言わずに出て行った. En la lengua hablada suena algo literario.',
  },
  ppanashi: {
    meaning: 'dejar (algo) encendido, dejar tal cual',
    formation: 'V-raíz + っぱなし',
    explanation:
      'っぱなし indica que un estado se deja tal cual cuando habría que haberlo resuelto, como una puerta que se queda abierta. Lleva una crítica leve.',
  },
  'toori-ni': {
    meaning: 'tal como, de la manera en que',
    formation: 'V-diccionario / V-た / N + の + とおりに',
    explanation:
      'とおりに significa hacer algo exactamente como se mostró, se dijo o se planeó. Tras un sustantivo sin の se lee どおり.',
  },
  'kuse-ni': {
    meaning: 'aunque (con crítica)',
    formation: 'forma simple (adj-な + な / N + の) + くせに',
    explanation:
      'くせに es como のに pero culpa a la persona: debería saberlo. Suena duro, así que se reserva para relaciones cercanas o quejas.',
  },
  'to-shite-mo': {
    meaning: 'aunque, incluso suponiendo que',
    formation: 'forma simple + としても',
    explanation:
      'としても supone algo y luego dice que el resultado no cambiaría. Es más hipotético que ても.',
  },
  'ni-shite-wa': {
    meaning: 'para (un …), teniendo en cuenta',
    formation: 'N / forma simple + にしては',
    explanation:
      'にしては indica que algo difiere de lo que cabría esperar de su tipo: 初めてにしては上手だ, “bien para ser la primera vez”.',
  },
  'wari-ni': {
    meaning: 'teniendo en cuenta, para',
    formation: 'forma simple (adj-な + な / N + の) + わりに',
    explanation:
      'わりに indica que un resultado no corresponde a lo que sugiere la primera parte, para bien o para mal: 値段のわりにおいしい.',
  },
  'tokoro-ga': {
    meaning: 'sin embargo (inesperadamente)',
    formation: 'oración. ところが、oración',
    explanation:
      'ところが abre una oración cuyo resultado va en contra de lo esperado. Relata hechos; no argumenta.',
  },
  'kawari-ni': {
    meaning: 'en lugar de; a cambio de',
    formation: 'V-diccionario / N + の + 代わりに',
    explanation: '代わりに sustituye una cosa por otra, o compensa un punto bueno con uno malo.',
  },
  'ippou-de': {
    meaning: 'mientras que, por otro lado',
    formation: 'forma simple (adj-な + な / N + である) + 一方で',
    explanation:
      '一方で contrapone dos aspectos de una situación. Es frecuente en la lengua escrita y en las noticias.',
  },
  'koto-wa-ga': {
    meaning: 'es cierto que …, pero',
    explanation:
      'La misma palabra aparece dos veces: 安いことは安いが. Admite un punto y luego lo limita con lo que sigue.',
  },
  tatte: {
    meaning: 'aunque (coloquial)',
    formation: 'V-た + って / adj-い (〜くたって)',
    explanation:
      'たって es la forma hablada de ても: 雨が降ったって行く. Suena coloquial y algo enfático.',
  },
  'you-ni-wish': {
    meaning: 'ojalá, que …',
    explanation:
      'ますように al final de una oración es un deseo o una plegaria, como en una tablilla de santuario: 合格しますように.',
  },
  'to-ii': {
    meaning: 'ojalá, estaría bien que',
    formation: 'V-diccionario + といい(ね / のに)',
    explanation:
      'といい expresa una esperanza sobre algo que no puedes controlar: 明日晴れるといいね. Con のに se convierte en un deseo poco probable.',
  },
  'ba-yokatta': {
    meaning: 'debería haber',
    explanation:
      'ばよかった mira atrás con pesar por algo que no se hizo. Con のに suena más frustrado.',
  },
  'sasete-kudasai': {
    meaning: 'por favor, déjame',
    formation: 'V-causativo (〜させ) + てください',
    explanation:
      'La causativa con てください pide permiso para hacer algo uno mismo: 休ませてください, “por favor, déjeme descansar”.',
  },
  'te-itadakemasen-ka': {
    meaning: '¿podría usted …? (muy cortés)',
    explanation:
      'Es una de las formas más corteses de pedir un favor. Pregunta si uno podría recibir humildemente la acción.',
  },
  'sasete-itadaku': {
    meaning: 'hacer humildemente (con su permiso)',
    formation: 'V-causativo (〜させ) + ていただく',
    explanation:
      'させていただく presenta tu propia acción como algo que se te permite hacer. Es frecuente en los negocios, a veces en exceso.',
  },
  'tokoro-datta': {
    meaning: 'casi, por poco',
    formation: 'V-diccionario + ところだった',
    explanation:
      'ところだった indica que algo estuvo a punto de pasar pero no pasó, a menudo con alivio: 車にひかれるところだった.',
  },
  'ta-tokoro': {
    meaning: 'acabar de hacer',
    explanation:
      'たところだ sitúa al hablante justo después de una acción, en ese mismo momento. たばかり admite que haya pasado más tiempo.',
  },
  'te-bakari-iru': {
    meaning: 'no hacer más que',
    explanation:
      'てばかりいる se queja de que alguien no para de hacer una cosa y nada más: 遊んでばかりいる.',
  },
  chau: {
    meaning: 'acabar haciendo (てしまう coloquial)',
    explanation:
      'ちゃう es la contracción hablada de てしまう. Conserva los mismos matices de acción completada o de pesar.',
  },
  toku: {
    meaning: 'hacer de antemano (ておく coloquial)',
    explanation: 'とく es la contracción hablada de ておく: 買っとく, “lo compro ya para luego”.',
  },
  'te-ru': {
    meaning: 'estar haciendo (ている coloquial)',
    explanation:
      'てる omite la い de ている en el habla coloquial. 見てる es simplemente 見ている.',
  },
  'bakari-da': {
    meaning: 'no dejar de (empeorar)',
    formation: 'V-diccionario + ばかりだ',
    explanation:
      'Tras la forma de diccionario de un verbo de cambio, ばかりだ indica que el cambio sigue en una sola dirección, normalmente mala.',
  },
};
