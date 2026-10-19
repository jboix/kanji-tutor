/** Spanish texts for N5 units 2–5 (N9, D53). Written for this app. */
import type { ById, UnitText } from '../../content-types.ts';

export const ES_N5_A: ById<UnitText> = {
  'self-introduction': {
    theme: 'Presentarse',
    summary:
      'En Japón, una presentación breve y fija abre cada clase, cada club y cada trabajo nuevo.',
    sentences: [
      'Encantada.',
      'Me llamo Anna.',
      'Vengo de Estados Unidos.',
      'No soy japonesa.',
      'Ahora soy estudiante en una universidad japonesa.',
      'Estudio japonés en la universidad.',
      'Mi profesora de japonés es la señora Yamamoto.',
      'Espero que nos llevemos bien.',
    ],
    questions: [
      'La línea 3 dice アメリカから来ました, “vengo de Estados Unidos”. Dice que no es japonesa, y China y Francia nunca se mencionan.',
      'Línea 5: 今、日本の大学の学生です, “ahora soy estudiante en una universidad japonesa”, es decir, 大学生. Estudia en la universidad, no enseña allí: la profesora de japonés es la señora Yamamoto, y no se menciona ninguna empresa.',
      'Línea 7: 日本語の先生は山本さんです, “mi profesora de japonés es Yamamoto”, así que es la 先生 de Anna. El texto nunca dice que sea amiga, estudiante ni compañera de clase.',
    ],
  },
  family: {
    theme: 'Mi familia',
    summary:
      'El japonés tiene dos juegos de palabras para la familia: humildes para la propia y corteses para la de otros.',
    sentences: [
      'Esta es una foto de mi familia.',
      'En mi familia somos cuatro.',
      'Mi padre trabaja en una empresa.',
      'Mi madre es médica y trabaja en un hospital.',
      'No tengo hermano mayor, pero tengo una hermana menor.',
      'Mi hermana es estudiante de secundaria y le gustan la música y el dibujo.',
      'Y también tenemos un perro blanco.',
      'Ahora mis padres viven en Osaka.',
    ],
    questions: [
      'Línea 4: 母は医者で, “mi madre es médica”. El trabajo en la empresa es del padre, y la estudiante es la hermana.',
      'Línea 5: no hay hermano mayor, pero sí una hermana menor (妹が一人います). Cuatro es el tamaño de toda la familia, no el número de hermanos.',
      'これ señala lo que el autor está mostrando: el 写真 nombrado en la misma línea, una foto de la familia. El perro blanco y los dibujos de la hermana aparecen en líneas posteriores, y el hospital es donde trabaja la madre.',
    ],
  },
  'my-day': {
    theme: 'Un día en mi vida',
    summary:
      'Los largos trayectos en tren marcan el día en Japón, desde el primer tren hasta el último.',
    sentences: [
      'Me levanto a las seis todas las mañanas.',
      'Después de lavarme la cara, desayuno.',
      'Hacia las siete y media voy a la universidad en tren.',
      'En el tren leo un libro durante una hora más o menos.',
      'Las clases son de 9 de la mañana a 3 de la tarde.',
      'Después de clase hago la tarea en la biblioteca.',
      'Antes de cenar doy un paseo corto.',
      'Por la noche me acuesto hacia las once.',
    ],
    questions: [
      'Línea 4: 電車の中で…本を読みます. La tarea se hace en la biblioteca, y el desayuno se toma en casa antes de salir.',
      'Línea 5: las clases van 午前九時から午後三時まで, así que terminan a las tres de la tarde. Las nueve es el comienzo, las siete y media es el tren y las once es la hora de dormir.',
      'Línea 7: 晩ご飯を食べる前に、少し散歩します. Lavarse la cara va antes del desayuno, no de la cena.',
    ],
  },
  'convenience-store': {
    theme: 'En la tienda de conveniencia',
    summary:
      'Las tiendas de conveniencia japonesas venden comida caliente, cobran facturas y envían paquetes, de día y de noche.',
    sentences: [
      'Cerca de mi casa hay una tienda de conveniencia.',
      'También abre de noche, así que es muy práctica.',
      'Hoy compré un bento, una bola de arroz y una bebida.',
      'El dependiente preguntó: “¿Le caliento el bento?”.',
      'Yo dije: “Sí, por favor”.',
      'En total fueron 800 yenes.',
      'No necesitaba bolsa, así que lo metí todo en mi propia bolsa.',
    ],
    questions: [
      'Línea 4: el dependiente ofrece お弁当をあたためましょうか y el autor dice que sí. No se dice nada de calentar la bola de arroz ni la bebida.',
      'La línea 2 da la razón con ので: 夜もあいているので、とても便利です, la tienda abre también de noche, así que se puede comprar incluso por la noche. El texto no dice nada de precios ni de una estación, y no llevarse bolsa es decisión del autor en la línea 7.',
      'Línea 7: el autor no necesita la bolsa de la tienda (ふくろはいらない) y mete las cosas en una かばん, su propia bolsa. No se mencionan ni una nevera ni un coche.',
    ],
  },
};
