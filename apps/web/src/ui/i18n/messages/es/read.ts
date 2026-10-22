/** Spanish messages: the reading session screens. */
import type { Messages } from '../../types.ts';

export const read = {
  backToUnit: 'Volver a la unidad',
  nextSection: 'Siguiente: {section} · {name}',
  partDone: '{section} · parte {part} de {parts} hecha',
  backToToday: 'Volver a Inicio',
  noFocusSentence:
    'Todavía no hay ninguna frase con {kanji} leído {reading} que encaje con lo que sabes.',
  nothingToRead:
    'Nada que leer por ahora: ninguna frase encaja todavía con lo que sabes. Añade las palabras de esta semana, o {link}.',
  markKnownWords: 'marca las palabras que ya conoces',
  title: 'Leer',
  choosing: 'Eligiendo frases…',
  answerByVoice: 'Responder en voz alta',
  newGrammarChip: 'Gramática nueva: {pattern}',
  newGrammarLabel: 'Gramática nueva: {pattern}',
  endSession: 'Terminar la sesión',
  furiganaAll: 'Mostrar furigana en las palabras conocidas',
  tapToAsk: 'toca una palabra para preguntar por ella',
  tapToLookUp: 'toca una palabra para buscarla',
  tapToAskFirst: 'Toca una palabra para preguntar por ella',
  tapToLookUpFirst: 'Toca una palabra para buscarla',
  playSentence: 'Escuchar la frase',
  inDictionary: '{word} en el diccionario',
  notInDictionary: 'No está en el diccionario.',
} satisfies Messages['read'];
