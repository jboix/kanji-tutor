/** Spanish texts for N4 units 23–25 (N9). Written for this app. */
import type { ById, UnitText } from '../../content-types.ts';

export const ES_N4_D: ById<UnitText> = {
  'new-year-cards': {
    theme: 'Tarjetas de Año Nuevo',
    summary:
      'Correos guarda las tarjetas enviadas a finales de diciembre y las reparte todas el día de Año Nuevo.',
    sentences: [
      'En Japón existe la costumbre de enviar tarjetas de Año Nuevo.',
      'El nengajō es una postal con felicitaciones de Año Nuevo; las oficinas de correos empiezan a venderlas en noviembre.',
      'Si las envías antes del 25 de diciembre más o menos, llegan el 1 de enero.',
      'En la tarjeta escribes tu agradecimiento por el año pasado y “cuento contigo también este año”.',
      'Muchas tarjetas llevan además el animal de ese año.',
      'Ahora hay más gente que felicita por correo electrónico, y dicen que cada vez se envían menos tarjetas.',
      'Pero cuando recibo una tarjeta escrita a mano, me pongo muy contenta.',
    ],
    questions: [
      'Línea 3: 十二月二十五日ごろまでに出すと、一月一日に届きます. までに marca el plazo límite. Noviembre es cuando las tarjetas salen a la venta, y el 31 es demasiado tarde.',
      'Línea 4: 去年のお礼や「今年もよろしく」という言葉を書きます: agradecimiento por el año pasado y una felicitación para el nuevo. El texto no habla de dirección, viaje ni foto.',
      'Línea 6: ねんがじょうはへっているそうです. へる significa volverse menos numeroso. Lo que aumenta son las felicitaciones por correo electrónico, no las tarjetas, y no se dice nada del precio.',
      'Línea 7: 手で書いたねんがじょうをもらうと、わたしはとてもうれしくなります. Las felicitaciones por correo electrónico van antes de でも, como contraste.',
    ],
  },
  'year-end-and-new-year': {
    theme: 'El cambio de año',
    summary:
      'El año termina con una gran limpieza, fideos y 108 campanadas en los templos, y empieza con una visita al santuario.',
    sentences: [
      'En Japón, a final de año, las familias hacen una limpieza general de la casa.',
      'El 31 de diciembre se llama Ōmisoka, y esa noche se comen fideos soba.',
      'Dicen que encierra el deseo de vivir una vida larga, finos y largos como los fideos.',
      'Cuando se acerca la medianoche, las campanas de los templos suenan 108 veces.',
      'El 1 de enero la gente hace su primera visita del año a un santuario o templo.',
      'En Año Nuevo los parientes se reúnen y comen platos especiales.',
      'Los niños reciben dinero de Año Nuevo de los adultos, así que lo esperan con ilusión.',
    ],
    questions: [
      'Línea 2: 夜にそばを食べます. Los platos especiales son para el día de Año Nuevo, con los parientes.',
      'Línea 3: そばのように細く長く生きられるように, el deseo de una vida larga. そうです indica que es algo que se dice. Las campanas suenan más tarde esa noche, y no se dice nada de la salud ni del precio.',
      'La línea 7 da la razón con ので: 大人からおとしだまをもらう, y おとしだま es el dinero de Año Nuevo. Los parientes y la visita al santuario se mencionan, pero no como la razón de los niños.',
    ],
  },
  'school-trip': {
    theme: 'El viaje de estudios',
    summary:
      'Casi todos los alumnos hacen un viaje con su clase a Kioto o Nara, y lo recuerdan toda la vida.',
    sentences: [
      'En el otoño de tercero de secundaria fuimos a Kioto en el viaje de estudios.',
      'El primer día toda la clase fue en autobús y visitamos varios templos famosos.',
      'El segundo día era libre, y nos dividimos en grupos de cinco para recorrer la ciudad.',
      'Nuestro grupo recorrió, mapa en mano, los lugares que habíamos elegido nosotros mismos.',
      'En un parque grande había muchísimos ciervos, y cuando les dábamos galletas movían la cabeza como si hicieran una reverencia.',
      'Por la noche estuvimos hablando con los amigos en el ryokan hasta tarde y el profesor nos regañó.',
      'El viaje de estudios sigue siendo mi mejor recuerdo.',
    ],
    questions: [
      'Línea 3: 五人ずつのグループに分かれて町を歩きました, grupos de cinco que recorren la ciudad. El autobús y los templos fueron el primer día.',
      'Línea 5: せんべいをあげると、頭を下げるように動きました. 頭を下げる es hacer una reverencia, el saludo japonés, y aquí ように significa “como si”: los ciervos parecen hacer una reverencia. No huyen, no se duermen ni gritan.',
      'Línea 6: 友達と遅くまで話していて、先生にしかられました. Hablar hasta tarde es quedarse despierto hasta tarde; la cláusula con 〜ていて da la causa. El mapa y los ciervos formaron parte del día, sin ninguna regañina.',
    ],
  },
};
