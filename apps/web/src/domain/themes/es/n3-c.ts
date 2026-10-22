/** Spanish texts for N3 units 34–36 (N9). Written for this app. */
import type { ById, UnitText } from '../../content-types.ts';

export const ES_N3_C: ById<UnitText> = {
  souvenirs: {
    theme: 'Recuerdos para la oficina',
    summary:
      'Al volver de un viaje, llevas dulces envueltos uno a uno para cada compañero, como agradecimiento por cubrirte.',
    sentences: [
      'En Japón mucha gente trae recuerdos no solo para la familia y los amigos, sino también para sus compañeros de trabajo.',
      'Al parecer es una forma de agradecer las molestias causadas mientras estaban fuera.',
      'Para la oficina son populares los dulces envueltos uno a uno.',
      'Es porque se pueden repartir a todos por igual.',
      'También se venden bien los productos de “edición limitada” que solo se venden en esa región.',
      'Los aeropuertos y las estaciones están llenos de tiendas de dulces típicos, así que puedes comprarlos deprisa antes de irte.',
      'Elegir recuerdos cuesta trabajo, pero imaginar la cara de alegría de tus compañeros mientras eliges es uno de los placeres del viaje.',
    ],
    questions: [
      'Línea 2: 迷惑をかけたので、そのお礼という気持ちがある; el regalo agradece a los compañeros las molestias causadas durante la ausencia. Nada dice que los compañeros los pidan, que en los aeropuertos sean baratos ni que lo exija una norma.',
      'La línea 4 termina con からだ, que da la razón de la línea 3: みんなに同じように配ることができる, cada persona puede recibir uno. Lo de venderse solo en la zona se refiere a los productos 限定 (línea 5), y el sabor o el precio nunca se dan como razón.',
      'La línea 5 lo explica: その地方だけで売っている「限定」の商品, productos que solo se venden en esa región y no se pueden comprar en otro sitio. Los aeropuertos venden dulces típicos (línea 6), pero eso no es lo que significa 限定 aquí, y no se habla del precio.',
    ],
  },
  kimono: {
    theme: 'Vestir un kimono',
    summary:
      'Ahora el kimono se reserva para los días importantes, y el obi es tan difícil de atar que casi todos necesitan ayuda.',
    sentences: [
      'Antes los japoneses llevaban kimono todos los días, pero ahora solo lo llevan en días especiales.',
      'Por ejemplo, se suele llevar en las ceremonias de mayoría de edad, en las bodas y en Año Nuevo.',
      'Un kimono es difícil de ponerse solo, y sobre todo atar el obi cuesta hacerlo bien sin práctica.',
      'En mi propia ceremonia de mayoría de edad, por fin logré ponérmelo con la ayuda de mi abuela.',
      'Era un kimono que mi abuela llevaba de joven, con un bonito estampado de flores.',
      'Hoy en día hay cada vez más jóvenes y visitantes que alquilan un kimono en lugares turísticos y pasean con él por la ciudad.',
      'Hay menos ocasiones de llevar kimono, pero están naciendo nuevas formas de disfrutarlo.',
    ],
    questions: [
      'La línea 2 enumera las ocasiones: 成人式や結婚式、お正月など, todos días de celebración. La línea 1 dice que llevarlo a diario es cosa del pasado, y nunca se habla del trabajo ni de los viajes.',
      'それ abre la línea 5 y remite a la línea 4: el kimono que el autor llevó en la ceremonia. La línea 5 añade que era de la abuela, de cuando era joven.',
      'Línea 6: 観光地で着物をレンタルして町を歩く若者や外国人も増えている; cada vez más gente alquila un kimono para pasear por lugares turísticos. Llevarlo a diario es cosa del pasado (línea 1), y atarse el obi solo es difícil (línea 3).',
    ],
  },
  'packed-lunch': {
    theme: 'La comida para llevar',
    summary:
      'Un bento japonés se planea tanto por el color como por la nutrición, y se sazona para que esté bueno frío.',
    sentences: [
      'En Japón mucha gente lleva al colegio o al trabajo una fiambrera con comida casera.',
      'El arroz y varias guarniciones se colocan con cuidado en una caja pequeña.',
      'Un bento japonés se prepara pensando tanto en el color como en una dieta equilibrada.',
      'Por ejemplo, unos tomates rojos o un huevo amarillo le dan un aspecto más alegre.',
      'Además se usan trucos como sazonar un poco más fuerte, para que la comida esté buena incluso fría.',
      'Algunos padres preparan a sus hijos comidas con forma de personajes de anime.',
      'Levantarse temprano para prepararlo cuesta, pero sale más barato que comer fuera, así que también se ahorra.',
    ],
    questions: [
      'La línea 3 nombra el 特徴 directamente: 栄養のバランスだけでなく、色もよく考えて作る, se piensa tanto en la nutrición como en el color. La línea 2 habla de varias guarniciones en una caja pequeña, así que la primera opción dice lo contrario.',
      'Línea 5: 冷めてもおいしく食べられるように, para que siga sabiendo bien una vez frío. El aspecto alegre viene de los colores (línea 4), las formas de personajes son para los niños (línea 6), y el ahorro es un motivo para preparar el bento (línea 7), no para sazonarlo.',
      'Línea 7: 外で食べるより安いので、節約にもなる; es más barato que comer fuera, así que se ahorra. La misma línea dice que levantarse temprano para prepararlo cuesta, así que no es fácil ni permite dormir más.',
    ],
  },
};
