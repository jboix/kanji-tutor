/** Spanish messages: Find my level (A11). */
import type { Messages } from '../../types.ts';

export const placement = {
  areaKanjiReading: 'Lecturas de kanji',
  areaOrthography: 'Escritura en kanji',
  areaGrammarForm: 'Formas gramaticales',
  areaComprehension: 'Lectura de un texto',
  steadyShaky: '{area}: sólido en N{steady}; N{shaky} todavía no.',
  steady: '{area}: sólido hasta N{level}.',
  notYet: '{area}: todavía no sólido en N{level}.',
  questionOf: 'Pregunta {index} de unas {total}',
  yourLevel: 'Tu nivel',
  accepted: 'Tu nivel ahora es N{level}. Las palabras nuevas vienen de N{level}.',
  backToToday: 'Volver a Inicio',
  yourResult: 'Tu resultado',
  pointsTo: 'Las preguntas apuntan a N{level}.',
  levelToUse: 'Nivel que usar',
  use: 'Usar N{level}',
  changeLater: 'Puedes cambiarlo cuando quieras en Ajustes.',
  about: 'Acerca de',
  introLead:
    'Unas {n} preguntas cortas con el formato del JLPT, empezando en N5. Dos aciertos seguidos suben un nivel; dos fallos bajan uno. Después, si quieres, unas líneas en japonés.',
  introNote:
    'Al final obtienes un nivel y una nota por área, nunca una puntuación. Nada cambia hasta que elijas.',
  finding: 'Buscando una pregunta…',
  start: 'Empezar',
  title: 'Encontrar mi nivel',
  writingLabel: 'Una respuesta escrita corta',
  writingPrompt: 'Opcional: unas frases en japonés, como puedas.',
  writingNote: 'El tutor solo la lee si le pides una evaluación.',
  unconfirmed: 'No confirmado por el diccionario:',
  assessment: 'La evaluación del tutor',
  tutorSuggests: 'El tutor propone N{level}.',
  solid: 'Sólido',
  toWorkOn: 'Por trabajar',
  noKey:
    'Añade una clave de Gemini en {settings} para preguntar al tutor. El nivel de arriba vale por sí solo.',
  settings: 'Ajustes',
  noAnswer: 'Esta vez el tutor no respondió: {reason}',
  reading: 'El tutor está leyendo tus respuestas…',
  ask: 'Pedir una evaluación al tutor',
} satisfies Messages['placement'];
