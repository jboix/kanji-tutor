/** Spanish texts for N3 units 31–33 (N9). Written for this app. */
import type { ById, UnitText } from '../../content-types.ts';

export const ES_N3_B: ById<UnitText> = {
  kabuki: {
    theme: 'El teatro kabuki',
    summary:
      'En el kabuki los hombres interpretan todos los papeles, y el público grita el nombre de los actores en los grandes momentos.',
    sentences: [
      'El kabuki es un arte escénico tradicional japonés que empezó hace más de cuatrocientos años.',
      'En el kabuki actual solo salen a escena actores hombres, y los hombres también interpretan los papeles femeninos.',
      'Los actores se pintan la cara de blanco y llevan trajes preciosos.',
      'En mitad de la obra, a veces el público grita en voz alta el nombre de un actor.',
      'Al parecer, con esto se pretende animar al actor.',
      'Se usa un lenguaje antiguo, así que incluso a los japoneses les cuesta entenderlo todo.',
      'Pero los teatros ofrecen explicaciones en inglés, así que los visitantes extranjeros también pueden disfrutarlo plenamente.',
    ],
    questions: [
      'Línea 2: 男性の役者だけが舞台に立ち、女性の役も男性が演じる. Solo los hombres suben al escenario, así que los papeles femeninos los hacen actores varones; no hay actrices, y el público no actúa.',
      'これ abre la línea 5 y remite a la línea 4: 観客が役者の名前を大きな声で呼ぶ, el público que grita el nombre de un actor. La línea 5 explica por qué: para animarlo. El maquillaje blanco (línea 3) y la lengua antigua (línea 6) no son a lo que se refiere これ.',
      'La línea 6 da la razón con ので: 昔の言葉が使われる, la lengua que se usa es antigua. Que solo actúen hombres (línea 2) no tiene que ver con entenderlo, y la guía en inglés es una ayuda extra (línea 7), no la única.',
    ],
  },
  rakugo: {
    theme: 'El rakugo, arte de contar historias',
    summary:
      'Un solo narrador sentado en un cojín interpreta a todos los personajes con solo un abanico y un paño.',
    sentences: [
      'El rakugo es un arte tradicional en el que un único narrador se sienta en un cojín y cuenta una historia divertida.',
      'Los únicos accesorios son un abanico plegable y una toalla de mano.',
      'Por ejemplo, el abanico se convierte en palillos y la toalla en una cartera.',
      'El narrador cambia de expresión y de voz para interpretar él solo a muchas personas.',
      'Por eso el público tiene que imaginar cada escena en su cabeza mientras escucha.',
      'Cada historia termina con un remate llamado ochi, y ahí es donde todos se ríen.',
      'Tokio tiene yose, teatros para el rakugo, donde puedes escucharlo casi todos los días.',
    ],
    questions: [
      'Línea 2: 使う道具は、せんすと手ぬぐいだけだ, solo un abanico y una toalla, es decir, dos accesorios. Los palillos y la cartera son lo que esos accesorios representan en la historia (línea 3); no son accesorios reales.',
      'Línea 4: un solo artista interpreta a todos los personajes, con solo dos accesorios (línea 2). La línea 5 saca la consecuencia con だから. Nada dice que la lengua sea antigua ni que la sala esté oscura, y el 落ち (línea 6) es lo que hace reír.',
      'En la línea 6, そこ remite, dentro de la misma oración, a 話の最後の「落ち」: el final de la historia, donde todos se ríen. Es un momento de la historia, no un lugar como la sala o el cojín.',
    ],
  },
  'tea-ceremony': {
    theme: 'La ceremonia del té',
    summary:
      'Cada movimiento en un salón de té tiene su forma, pero lo esencial es la atención al invitado.',
    sentences: [
      'La ceremonia del té es un arte japonés que consiste en preparar matcha siguiendo formas fijas y servirlo a los invitados.',
      'Un salón de té suele ser pequeño y tranquilo, con una sola flor de temporada como adorno.',
      'Los invitados primero comen un dulce japonés y luego beben el té.',
      'Al recibir el cuenco, lo correcto es girarlo un poco para evitar su parte frontal, y después beber.',
      'La primera vez que lo probé, estuve de rodillas todo el rato y empezaron a dolerme las piernas.',
      'La profesora me dijo: “Las formas importan, pero lo más importante es preocuparse por el invitado”.',
      'Según ella, todas las formas de la ceremonia del té nacieron de pensar en el invitado.',
    ],
    questions: [
      'Línea 3: まず和菓子を食べてからまっちゃを飲む. Un 和菓子 es un dulce japonés, así que los invitados comen primero algo dulce. La flor ya está expuesta en la sala (línea 2).',
      'Línea 4: 正面を避けるために; se gira el cuenco para no beber por su parte frontal. El dulce se come antes del té (línea 3), y nada relaciona el gesto con la flor ni con la cantidad de té.',
      'Línea 5: ずっと正座をしていたので、足が痛くなってしまった; estar de rodillas todo el rato le hizo doler las piernas al autor. El texto no habla de un té demasiado amargo, de un cuenco caído ni de aprender todas las formas.',
      'Línea 6: 一番大切なのは客を思う心だ; lo más importante es cuidar al invitado. La profesora dice que las formas también importan, pero pone primero al invitado; la flor (línea 2) forma parte de la sala, no es lo principal.',
    ],
  },
};
