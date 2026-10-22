/** Spanish texts for N3 units 28–30 (N9). Written for this app. */
import type { ById, UnitText } from '../../content-types.ts';

export const ES_N3_A: ById<UnitText> = {
  'honorific-speech': {
    theme: 'El lenguaje honorífico',
    summary:
      'El keigo cambia el propio verbo según quién actúa y quién escucha, y los nativos lo vuelven a aprender en el trabajo.',
    sentences: [
      'El japonés tiene una forma especial de hablar llamada keigo.',
      'El keigo tiene que cambiar según tu relación con el oyente.',
      'Por ejemplo, cuando come un superior se dice meshiagaru, y cuando comes tú se dice itadaku.',
      'Es decir, hay formas que elevan a la otra persona y formas que te rebajan a ti.',
      'El keigo no es fácil ni siquiera para los japoneses, y no pocos lo vuelven a estudiar al empezar a trabajar.',
      'Aun así, equivocarse con el keigo no te hace maleducado por sí solo.',
      'Lo importante no es tanto hablar a la perfección como intentar expresar con palabras tu respeto por la otra persona.',
    ],
    questions: [
      'Línea 3: 自分が食べるときは「いただく」と言う. 召し上がる se usa cuando come un superior, así que eleva a la otra persona.',
      'En la línea 5, 〜直す tras la raíz de un verbo significa volver a hacerlo. Los adultos que trabajan reaprenden el keigo; no lo dejan ni lo enseñan.',
      'La última línea expone la idea con 大切なのは: intentar mostrar respeto por la otra persona importa más que las palabras perfectas. La línea 6 dice que un error por sí solo no es descortés, y la línea 5 dice que el keigo es difícil incluso para los japoneses.',
    ],
  },
  dialects: {
    theme: 'Los dialectos regionales',
    summary:
      'En Kansai, naosu puede significar “guardar”, y eso dejó a un estudiante de Tokio intentando arreglar un libro que no estaba roto.',
    sentences: [
      'Japón es un país pequeño, pero su habla varía mucho de una región a otra.',
      'El habla regional se llama hōgen, y la lengua de las noticias de televisión se llama hyōjungo, la estándar.',
      'En Kansai, por ejemplo, a veces se dice naosu con el sentido de “guardar”.',
      'Cuando me mudé de Tokio a una universidad de Osaka, un amigo me dijo: “Naoshite oite este libro”.',
      'El libro no estaba roto por ninguna parte, así que me quedé totalmente desconcertado.',
      'Más tarde, cuando supe que naosu significaba “guardar”, nos reímos los dos.',
      'Hablar en dialecto parece acercarte a la gente.',
      'Ahora, incluso cuando veo a mis amigos de mi tierra, se me escapan palabras de Kansai sin darme cuenta.',
    ],
    questions: [
      'Línea 3: 「片付ける」という意味で「なおす」と言う. 片付ける es volver a poner las cosas en su sitio. “Reparar” es el significado estándar, y eso es justo lo que confundió al autor.',
      'Línea 5: 本はどこも壊れていなかったので. El autor entendió なおす como “reparar”, pero el libro no estaba roto, así que no había nada que reparar. El libro estaba ahí, no se había perdido.',
      'La línea 2 lo define: テレビのニュースで使われる言葉を「標準語」と言う, la lengua que se oye en las noticias de la televisión. El habla de Kansai y las demás hablas regionales son 方言.',
      'Línea 7: 相手とのきょりが近くなるような気がする: la distancia con la otra persona parece acortarse, así que te sientes más cerca. El autor no dice que el dialecto sea rápido, descortés o difícil.',
    ],
  },
  earthquakes: {
    theme: 'Terremotos y prevención',
    summary:
      'Los simulacros empiezan en la escuela primaria, y cada hogar debería tener agua y un punto de encuentro preparados.',
    sentences: [
      'Japón tiene muchos terremotos; los pequeños ocurren casi a diario.',
      'Como ha habido grandes terremotos muchas veces, escuelas y empresas hacen simulacros de desastre una o dos veces al año.',
      'Cuando empieza el temblor, lo primero es meterse debajo de una mesa y protegerse la cabeza.',
      'Aunque el terremoto haya terminado, no debes salir corriendo a la calle.',
      'También conviene tener en casa agua, comida, una radio, etc., preparados.',
      'Por si la familia está en lugares distintos, también hay que decidir dónde reunirse.',
      'En lugar de pensar “por ahora no pasará nada”, lo importante es estar preparado en el día a día.',
    ],
    questions: [
      'Línea 3: まず机の下に入って頭を守る. La línea 4 advierte de no salir corriendo, y la radio es algo que se tiene preparado de antemano.',
      'Línea 6: 家族が別々の場所にいるときのために, para el caso de que la familia esté separada cuando ocurra, y así poder encontrarse. El agua y la comida son para tener en casa (línea 5), y la línea 4 advierte de no salir corriendo.',
      '普段 significa el día a día, los tiempos normales. La línea lo contrasta con pensar まだ大丈夫だろう: te preparas de antemano, no después del terremoto.',
    ],
  },
};
