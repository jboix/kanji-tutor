/** Spanish texts for N3 units 40–41 (N9). Written for this app. */
import type { ById, UnitText } from '../../content-types.ts';

export const ES_N3_E: ById<UnitText> = {
  'entrance-exams': {
    theme: 'Exámenes de ingreso y academias',
    summary:
      'Entrar en un buen instituto o universidad exige exámenes, y muchos alumnos estudian en academias hasta tarde.',
    sentences: [
      'En Japón tienes que aprobar un examen de ingreso para entrar en el instituto o la universidad.',
      'La competencia por los centros populares es feroz, así que muchos alumnos van a una academia después de clase.',
      'En la academia a veces estudian hasta las diez de la noche, y para los padres el coste también es un gran problema.',
      'En mi último año de instituto, yo también iba a la academia cuatro días a la semana.',
      'Mis notas no subían, y a veces me entraba la angustia.',
      'Pero gracias a que el profesor de la academia me dijo “el esfuerzo siempre da fruto”, pude seguir hasta el final.',
      'Y en primavera, cuando entré en la universidad que quería, me sentí realmente feliz.',
    ],
    questions: [
      'La línea 2 da la razón con ので: 人気のある学校は競争が激しい, la competencia hace difícil entrar en los colegios populares. El coste es un problema para los padres (línea 3), no es barato, y nada dice que no haya clases ni que los padres trabajen allí.',
      'Línea 3: 親にとっては費用も大きな問題だ.',
      'Línea 4: 週に四日じゅくに通っていた.',
      'Línea 6: 先生が「努力は必ず結果になる」と言ってくれたおかげで. La línea 5 dice que las notas no subían fácilmente, así que la primera opción es incorrecta.',
    ],
  },
  'rush-hour': {
    theme: 'El tren en hora punta',
    summary:
      'A las ocho de la mañana los trenes de Tokio van tan llenos que el personal empuja a los pasajeros, aunque el teletrabajo lo ha aliviado.',
    sentences: [
      'Los trenes de la mañana en Tokio se llenan de gente que va al trabajo.',
      'Sobre todo hacia las ocho van abarrotados, y a veces el personal de la estación empuja a los pasajeros para que suban.',
      'Mucha gente que trabaja en Tokio vive en las afueras, y no son pocos los que tardan más de una hora en cada trayecto.',
      'Ir cada día en un tren abarrotado es duro, así que algunos salen de casa un poco antes para evitar las aglomeraciones.',
      'Algunas empresas también tienen un sistema que permite al personal elegir su hora de entrada.',
      'Últimamente, gracias a que más gente trabaja desde casa, se dice que los trenes van menos llenos que antes.',
      'Si cambia nuestra forma de trabajar, probablemente el tren de la mañana también seguirá cambiando.',
    ],
    questions: [
      'Línea 2: 駅員が乗客を押して電車に乗せることもある; así que a algunos pasajeros los empuja el personal para que suban. Los trenes van abarrotados, así que la primera opción dice lo contrario, y nada dice que los trenes no lleguen.',
      'Línea 4: 少し早く家を出て混雑を避ける人もいる; algunos salen de casa un poco antes. La hora de cada trayecto de la línea 3 es en tren, no a pie, y nunca se habla de mudarse ni de ir en coche.',
      'Línea 6: 家で仕事をする人が増えたおかげで; más gente trabaja desde casa en lugar de ir a la oficina. おかげで marca la causa de un resultado positivo; más trenes, menos gente en las afueras o más personal nunca se mencionan.',
    ],
  },
};
