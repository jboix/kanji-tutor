/** Spanish texts for N3 units 37–39 (N9). Written for this app. */
import type { ById, UnitText } from '../../content-types.ts';

export const ES_N3_D: ById<UnitText> = {
  'food-models': {
    theme: 'Comida de plástico en el escaparate',
    summary:
      'Los escaparates de los restaurantes muestran réplicas hechas a mano de cada plato, así que puedes pedir sin leer.',
    sentences: [
      'Los restaurantes japoneses suelen exponer en la entrada modelos de sus platos.',
      'Se llaman muestras de comida y están hechas para parecer idénticas a la comida real.',
      'Con las muestras de comida ves de un vistazo el tamaño y el precio de un plato, sin leer la carta.',
      'Por eso resultan prácticas para los turistas que no entienden japonés.',
      'Cada muestra la hace a mano un artesano, y requiere mucha destreza.',
      'Tokio tiene un barrio lleno de tiendas de muestras de comida, donde incluso puedes probar a hacer una.',
      'Yo mismo probé a hacer una muestra de tempura, y fue más difícil de lo que esperaba.',
    ],
    questions: [
      'これ abre la línea 2 y remite a la línea 1: 店の前に料理の見本が並んでいる, los modelos de platos delante del restaurante. La línea 2 añade que imitan a la perfección los platos reales, así que no son comida de verdad.',
      'Línea 3: 料理の量や値段が一目でわかる; se ve de un vistazo la cantidad y el precio. El sabor y el olor no se ven, y no se menciona ningún nombre.',
      'Línea 6: サンプルを作る体験もできる; los visitantes pueden probar a hacer una muestra ellos mismos. El tempura de la línea 7 es una muestra que hizo el autor, no una comida, y no se habla de clases ni de menús.',
    ],
  },
  'rain-and-typhoons': {
    theme: 'La temporada de lluvias y los tifones',
    summary:
      'El principio del verano trae semanas de calor húmedo, y el final del verano trae tifones que paran los trenes.',
    sentences: [
      'De junio a julio, gran parte de Japón entra en la temporada de lluvias.',
      'En esta época los días de lluvia se suceden sin parar, y hace un calor húmedo y bochornoso.',
      'La ropa tendida no se seca, e incluso puede salir moho en la habitación, así que mucha gente lo pasa mal.',
      'Cuando termina la temporada de lluvias empieza el verano de verdad, y de agosto a septiembre llegan a menudo tifones.',
      'Cuando se acerca un tifón, el pronóstico del tiempo informa a diario de su trayectoria.',
      'Con un tifón fuerte, puede que se paren los trenes y cierren las escuelas.',
      'Por eso, antes de un tifón hay que prepararse, por ejemplo cerrando las ventanas y metiendo en casa lo que hay fuera.',
    ],
    questions: [
      'Línea 2: 雨の日が続き、しっけが多くてむし暑い, días de lluvia seguidos y un calor bochornoso. Los tifones llegan después, en agosto y septiembre (línea 4), y la ropa no se seca (línea 3).',
      'Línea 4: 八月から九月にかけては台風がよく来る. Junio y julio son la temporada de lluvias (línea 1), y los otros meses no se mencionan.',
      'Línea 7: 窓を閉めて外の物を家の中に入れておく; se mete en casa lo que está fuera. Que cierren las escuelas es una consecuencia de un tifón fuerte (línea 6), y el pronóstico diario lo dan las noticias (línea 5), no es una preparación en casa.',
    ],
  },
  obon: {
    theme: 'Obon, la fiesta veraniega de los difuntos',
    summary:
      'A mediados de agosto las familias reciben en casa a sus antepasados, y todo el país viaja de vuelta a su tierra natal.',
    sentences: [
      'El Obon es una costumbre de verano basada en la creencia de que los antepasados fallecidos vuelven a casa.',
      'En la mayoría de las regiones se celebra más o menos del 13 al 16 de agosto.',
      'Durante esos días, quienes viven en la ciudad vuelven a su pueblo natal y los pasan con la familia y los parientes.',
      'Por eso las autopistas y los trenes bala se llenan muchísimo.',
      'Al comienzo del Obon se enciende un pequeño fuego delante de la casa para recibir a los antepasados, y el último día otro para despedirlos.',
      'Entretanto, las familias visitan las tumbas y participan en el baile bon del pueblo.',
      'El respeto por los antepasados sigue vivo hoy como costumbre de verano.',
    ],
    questions: [
      'La línea 1 lo define: 亡くなった先祖が家に帰ってくると考えられている夏の行事, una fiesta de verano en la que se cree que los antepasados vuelven a casa, y la línea 5 muestra a las familias recibiéndolos. El Año Nuevo, los niños y los fuegos artificiales no se mencionan.',
      'その, en la línea 4, remite a la línea 3: 都会に住んでいる人も故郷に帰って, la gente de la ciudad vuelve a su pueblo natal, y por eso carreteras y trenes van llenos. El regreso de los antepasados (línea 1) es una creencia, no la causa del tráfico.',
      'Línea 5: おぼんの初めには、家の前で小さな火をつけて先祖を迎え; se enciende un pequeño fuego delante de la casa para recibir a los antepasados. La visita a las tumbas y el baile tienen lugar durante el Obon (línea 6), no al comienzo.',
    ],
  },
};
