/** Spanish messages: this week's plan (A7, IA6), on Today. */
import type { Messages } from '../../types.ts';

export const plan = {
  focusLongVowel: 'Vocales largas',
  focusSokuon: 'La っ pequeña',
  focusRendaku: 'Sonorización',
  title: 'El plan de la semana',
  lead: 'Hecho a partir de tu semana. Las sesiones lo siguen desde hoy.',
  usePlan: 'Seguir este plan',
  changeIt: 'Cambiarlo',
  followed: 'Las sesiones de esta semana siguen este plan.',
  whenLine: 'Cuándo, línea {line}',
  whatLine: 'Qué, línea {line}',
  dailyMinutes: 'Minutos al día',
  fewerMinutes: 'Menos minutos al día',
  moreMinutes: 'Más minutos al día',
  focusLegend: 'Una de cada cuatro frases practica',
  whenDaily: 'A diario',
  whenTue: 'Mar.',
  whenTueThu: 'Mar., jue.',
  planReading: '{minutes} minutos de lectura.',
  planFocus: 'Una de cada cuatro frases {phrase}.',
  phraseLongVowel: 'tiene una vocal larga',
  phraseSokuon: 'tiene una っ pequeña',
  phraseRendaku: 'tiene un cambio de sonorización',
  planDrills: {
    one: 'Ejercicios de kanji parecidos, alrededor de {n} tarjeta de cada 20, para los kanji que confundiste.',
    other:
      'Ejercicios de kanji parecidos, alrededor de {n} tarjetas de cada 20, para los kanji que confundiste.',
  },
  planGrammarOne: 'Escribir una frase con {first}.',
  planGrammarTwo: 'Escribir una frase con {first} y otra con {second}.',
} satisfies Messages['plan'];
