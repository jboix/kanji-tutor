/** Spanish texts for N5 units 6–9 (N9). Written for this app. */
import type { ById, UnitText } from '../../content-types.ts';

export const ES_N5_B: ById<UnitText> = {
  'at-the-station': {
    theme: 'En la estación',
    summary:
      'Las grandes estaciones de Tokio tienen decenas de salidas, y el personal está acostumbrado a indicar el camino.',
    sentences: [
      'El sábado fui a Ueno con un amigo.',
      'La estación de Shinjuku es muy grande y tiene muchas salidas.',
      'Después de comprar los billetes, le preguntamos el camino a un empleado de la estación.',
      'El empleado dijo: “Suban al tren del andén 3, por favor”.',
      'También dijo: “Después, tomen el metro, por favor”.',
      'Bajamos en la estación de Ueno y salimos por la salida 1.',
      'Cerca de la estación había un parque grande y bonito.',
    ],
    questions: [
      'Línea 6: 上野駅で降りて, bajaron en Ueno. Salieron de Shinjuku, y Nakano y Meguro nunca se mencionan.',
      'Línea 3: 駅の人に道を聞きました, preguntaron el camino. Ya habían comprado los billetes, y el parque solo se ve al final.',
      'Línea 7: 駅の近くに大きくてきれいな公園がありました, un parque grande y bonito. La estación grande del texto es Shinjuku, no Ueno, y no se menciona ningún gran almacén.',
    ],
  },
  'weather-and-seasons': {
    theme: 'El tiempo y las cuatro estaciones',
    summary:
      'En Japón se habla de la estación del año todo el tiempo, y las lluvias de junio tienen nombre propio.',
    sentences: [
      'Japón tiene cuatro estaciones.',
      'La primavera es templada y los cerezos en flor son preciosos.',
      'En junio hay muchos días de lluvia.',
      'Esta estación de lluvias se llama tsuyu.',
      'El verano es muy caluroso, pero mucha gente va al mar o a la montaña.',
      'El otoño es fresco y la comida está deliciosa.',
      'El invierno es frío y en Hokkaido nieva mucho.',
      'De las cuatro estaciones, la que más me gusta es el otoño.',
    ],
    questions: [
      'この remite a la línea anterior: 六月には雨の日が多いです. El mes de lluvias es junio; los demás meses nunca se mencionan.',
      'Línea 7: 冬は寒くて、北海道では雪がたくさん降ります. La nieve corresponde al invierno.',
      'La última línea: 秋が一番好きです. La primavera se describe como preciosa, pero la favorita del autor es el otoño.',
    ],
  },
  'japanese-home': {
    theme: 'Dentro de una casa japonesa',
    summary:
      'Los zapatos se quitan en el genkan, los futones se extienden sobre el tatami y el agua del baño se comparte.',
    sentences: [
      'Al entrar en una casa japonesa, te quitas los zapatos en la entrada.',
      'No se puede entrar en las habitaciones con los zapatos puestos.',
      'La casa en la que vivo es antigua y tiene una habitación de tatami.',
      'En la habitación de tatami, por la noche sacamos los futones y dormimos.',
      'La cocina y el baño están en la planta baja, y arriba hay dos habitaciones.',
      'Toda la familia usa el mismo baño, así que te lavas el cuerpo antes de entrar.',
    ],
    questions: [
      'Línea 1: 玄関で靴を脱ぎます. La línea 2 añade que no se puede entrar con zapatos en las habitaciones, así que se quitan antes.',
      'Línea 4: たたみの部屋では、夜、ふとんを出して寝ます, los futones se sacan en la habitación de tatami. Los zapatos se quitan en la entrada, el baño es para lavarse y nadie duerme en la cocina de la planta baja.',
      'La línea 6 da la razón con ので: お風呂は家族みんなが使う, toda la familia se mete en el mismo baño. Nunca se mencionan la temperatura del agua ni el tamaño del baño, y el baño está en la planta baja.',
    ],
  },
  'vending-machine': {
    theme: 'En la máquina expendedora',
    summary:
      'Japón tiene millones de máquinas expendedoras, y en invierno muchas venden bebidas calientes en lata.',
    sentences: [
      'En las ciudades japonesas hay muchísimas máquinas expendedoras.',
      'Las hay delante de las estaciones, en los parques e incluso en la montaña.',
      'En verano venden bebidas frías y en invierno, bebidas calientes.',
      'Los botones azules son para las bebidas frías y los rojos, para las calientes.',
      'Ayer hacía mucho frío, así que compré un té caliente.',
      'Metí el dinero y pulsé un botón rojo.',
      'La lata estaba muy caliente.',
    ],
    questions: [
      'Línea 4: 赤いボタンはあたたかい物です, el rojo es para las bebidas calientes, y la línea 7 confirma que la lata del botón rojo estaba muy caliente. El azul es para las bebidas frías; los precios no se mencionan.',
      'Línea 5: 昨日はとても寒かったので, “porque ayer hacía mucho frío”: era un día frío. Los precios nunca se mencionan, y en un día de calor se tomaría una bebida fría.',
      'La línea 2 enumera estaciones, parques e incluso montañas (〜にも、〜にも), así que están en muchos sitios, no en uno solo. Las casas no se mencionan.',
    ],
  },
};
