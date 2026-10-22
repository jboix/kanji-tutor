/** Spanish texts for N5 units 10–13 (N9). Written for this app. */
import type { ById, UnitText } from '../../content-types.ts';

export const ES_N5_C: ById<UnitText> = {
  'ramen-shop': {
    theme: 'En un restaurante de ramen',
    summary:
      'Muchos locales de ramen toman el pedido con una máquina de tiques en la puerta, y sorber está bien visto.',
    sentences: [
      'Cerca de la estación hay un restaurante de ramen famoso.',
      'A la hora de comer siempre hay una fila de gente delante del local.',
      'En este local compras un tique de comida en la máquina de la entrada.',
      'Te sientas y le das el tique al personal.',
      'El agua te la sirves tú mismo.',
      'El ramen estaba muy caliente y delicioso.',
      'En Japón está bien sorber el ramen haciendo ruido.',
    ],
    questions: [
      'Línea 3: 入口のきかいでチケットを買います, en la máquina de la entrada. El personal solo recoge el tique (línea 4); no lo vende, y la estación solo indica dónde está el local.',
      'Línea 5: 水は自分で入れます, te la sirves tú mismo, así que son los que comen quienes se sirven el agua. No se compra, y el personal no la trae.',
      'Línea 2: 店の前にいつも人が並んでいます, siempre hay gente haciendo fila, así que muchas personas esperan. Con una fila fuera, el local no está cerrado ni vacío, y el texto nunca pone al personal junto a la máquina.',
    ],
  },
  'department-store': {
    theme: 'De compras en unos grandes almacenes',
    summary:
      'Los grandes almacenes tienen toda una planta de comida en el sótano, llamada depachika.',
    sentences: [
      'La semana que viene es el cumpleaños de mi padre, así que fui a unos grandes almacenes a comprarle un regalo.',
      'En el sótano de la tienda hay una planta de comida.',
      'La sección de corbatas está en la quinta planta, así que subí en ascensor.',
      'Había una corbata azul y una negra.',
      'La azul costaba 3000 yenes y la negra, 5000.',
      'La negra era más bonita, pero un poco cara.',
      'A mi padre le gusta el azul, así que compré la corbata azul.',
    ],
    questions: [
      'Línea 1: 父の誕生日なので、デパートへプレゼントを買いに行きました. La planta de comida solo se describe; no se va a comprar allí.',
      'Línea 5: 黒いのは五千円でした. Tres mil yenes es el precio de la corbata azul.',
      'Línea 7: 父は青い色が好きなので. La corbata azul también era más barata, pero la razón que da el texto con ので es el color favorito del padre.',
    ],
  },
  'cherry-blossoms': {
    theme: 'Contemplar los cerezos en flor',
    summary:
      'Durante una semana cada primavera, amigos y compañeros de trabajo hacen picnics bajo los cerezos.',
    sentences: [
      'Hacia finales de marzo florecen los cerezos en Japón.',
      'Cuando florecen, mucha gente va a los parques a contemplar las flores.',
      'La semana pasada un amigo me dijo: “¿Vamos a ver los cerezos el sábado?”.',
      'Queríamos un buen sitio, así que fuimos al parque temprano por la mañana.',
      'Bajo un cerezo grande comimos el bento e hicimos fotos.',
      'Las flores del cerezo solo duran una semana más o menos.',
    ],
    questions: [
      'Línea 1: 三月の終わりごろ, hacia finales de marzo, es decir, poco antes de abril. Principios de marzo es demasiado pronto, y febrero y mayo nunca se mencionan.',
      'Línea 4: いいばしょがほしかったので, querían un buen sitio para ver las flores. Que las flores duren poco es un dato de la línea 6, pero no es la razón por la que fueron temprano, y el texto no dice nada de las flores por la mañana ni del tiempo libre del amigo.',
      'La línea 5 enumera las dos cosas con 〜たり〜たり: お弁当を食べたり、写真を撮ったり, comer el bento y hacer fotos. Cantar, leer, dormir o comprar flores nunca se mencionan.',
    ],
  },
  weekend: {
    theme: 'Un fin de semana en casa y fuera',
    summary:
      'El fin de semana japonés suele dividirse en tareas domésticas el sábado por la mañana y salidas después.',
    sentences: [
      'En mi empresa, el sábado y el domingo son días libres.',
      'Los sábados por la mañana suelo limpiar mi habitación y hacer la colada.',
      'Por la tarde voy al cine o de compras con amigos.',
      'Pero el sábado pasado llovió todo el día.',
      'Me quedé en casa, cociné y vi la televisión.',
      'El domingo hizo buen tiempo.',
      'Por la tarde di un paseo tranquilo por un parque cercano.',
    ],
    questions: [
      'Línea 2: 土曜日の朝は、たいてい部屋の掃除や洗濯をします, limpiar y lavar la ropa, es decir, las tareas de casa. El cine es por la tarde, cocinar fue el sábado de lluvia y el paseo por el parque fue el domingo.',
      'La línea 4 dice que llovió todo el día, y la línea 5 muestra el resultado: se quedó en casa. El buen tiempo llegó el domingo.',
      'Línea 7: 近くの公園をゆっくり散歩しました, un paseo tranquilo por un parque cercano, así que caminó fuera. Ver la televisión fue el sábado de lluvia, y las compras y la ropa son cosas del sábado.',
    ],
  },
};
