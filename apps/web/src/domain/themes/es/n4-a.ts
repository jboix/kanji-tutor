/** Spanish texts for N4 units 14–16 (N9, D53). Written for this app. */
import type { ById, UnitText } from '../../content-types.ts';

export const ES_N4_A: ById<UnitText> = {
  'hot-springs': {
    theme: 'Una noche en unas aguas termales',
    summary:
      'Las posadas con aguas termales tienen su propia etiqueta: lávate primero y no metas la toalla en el agua.',
    sentences: [
      'El mes pasado fui por primera vez a unas aguas termales con mi familia.',
      'Nos alojamos en una posada antigua en la montaña y por la noche cenamos en yukata.',
      'Las aguas termales japonesas tienen algunas normas.',
      'Primero, hay que lavarse bien antes de entrar en el baño.',
      'Además, no se puede meter la toalla en el agua.',
      'Algunas aguas termales no admiten a personas con tatuajes.',
      'Desde el baño al aire libre se veían las montañas, y fue una sensación maravillosa.',
      'Si vienes a Japón, prueba unas aguas termales al menos una vez.',
    ],
    questions: [
      'Línea 4: 入る前に、体をよく洗わなければなりません, así que uno se lava antes (〜ておく). El yukata y la cena forman parte de la estancia en la posada, no son una norma del baño, y la toalla debe quedarse fuera del agua.',
      'Línea 5: タオルをおんせんの中に入れてはいけません: la toalla no debe entrar en el agua (おゆ). El baño al aire libre y las vistas son lo que disfrutó el autor, y la cena en yukata formaba parte de la estancia en la posada.',
      'En la línea 7, 気持ちがいい describe cómo se sentía el baño: agradable y relajante, así que el autor pudo descansar y quedó contento. Nada dice que el agua estuviera demasiado caliente ni que hubiera ruido, y las vistas se veían (見えて), así que la última opción dice lo contrario que el texto.',
    ],
  },
  'summer-festival': {
    theme: 'La fiesta de verano del barrio',
    summary:
      'Cada barrio tiene su fiesta: puestos de comida, un santuario portátil, tambores y fuegos artificiales.',
    sentences: [
      'En mi ciudad hay una fiesta cada agosto.',
      'Los días de fiesta, las calles se llenan de puestos de comida.',
      'Los niños se ponen yukata, compran comida en los puestos y juegan.',
      'Por la tarde, la gente del barrio lleva el santuario portátil por las calles.',
      'El santuario pesa mucho, así que lo cargan unas veinte personas.',
      'Por la noche hay baile bon; cuando suena el tambor, todos bailan a su ritmo.',
      'Cuando suben los grandes fuegos artificiales del final, la fiesta termina.',
      'El año pasado me dejaron ayudar a cargar el santuario.',
    ],
    questions: [
      'Línea 5: みこしはとても重いので、二十人ぐらいでかつぎます: unas veinte personas, mucha gente a la vez. Pesa demasiado para una sola persona, se lleva a hombros y no en coche, y los niños están ocupados en los puestos mientras los adultos lo cargan.',
      'その remite, dentro de la línea 6, a たいこが鳴ると: los bailarines se mueven al son del tambor. Los fuegos artificiales solo llegan al final.',
      'Línea 7: 最後に大きい花火が上がると、お祭りは終わりです. El baile y el santuario vienen antes en el día.',
    ],
  },
  'sorting-rubbish': {
    theme: 'Separar la basura',
    summary:
      'La basura se separa por tipos y solo se saca el día que le toca; los vecinos se dan cuenta cuando te equivocas.',
    sentences: [
      'En Japón hay que separar la basura al tirarla.',
      'Se saca separada en combustible, no combustible, latas, botellas, etc.',
      'El día para cada tipo también está fijado.',
      'En mi ciudad, la basura combustible se saca los lunes y los jueves.',
      'Las latas y las botellas se reciclan, así que es mejor enjuagarlas antes de sacarlas.',
      'Cuando acababa de llegar a Japón, saqué la basura el día equivocado.',
      'Entonces un vecino me explicó las normas con amabilidad.',
      'Ahora ya estoy totalmente acostumbrado a separar la basura.',
    ],
    questions: [
      'Línea 4: もえるゴミは月曜日と木曜日に出します, el lunes y el jueves, o sea, dos veces por semana. La línea 3 añade que cada tipo de basura tiene días fijos, así que no es todos los días.',
      'La línea 5 da la razón con ので: しげんになる, se convierten en un recurso, así que se vuelven a usar. Las latas no son basura combustible, el vecino nunca se enfadó y los días fijos son otra norma.',
      'Línea 7: 近所の人が親切に教えてくれました: 親切に significa con amabilidad (やさしく). Nadie se enfadó, devolvió la basura ni se quedó callado; el vecino explicó las normas.',
    ],
  },
};
