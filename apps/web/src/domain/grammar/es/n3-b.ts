/** Spanish texts for N3 grammar, part B (N9, D53). Written for this app. */
import type { ById, GrammarText } from '../../content-types.ts';

export const ES_N3_B: ById<GrammarText> = {
  toka: {
    meaning: 'cosas como A y B',
    formation: 'N / forma simple + とか',
    explanation:
      'とか enumera ejemplos de manera coloquial, como や en la lengua hablada. También sigue a cláusulas enteras, algo que や no puede hacer.',
  },
  'dake-de-naku': {
    meaning: 'no solo … sino también',
    formation: 'N / forma simple + だけでなく … も',
    explanation:
      'だけでなく añade un segundo elemento al primero, y el segundo suele ser más sorprendente. La segunda parte suele llevar も.',
  },
  'ba-hodo': {
    meaning: 'cuanto más …, más …',
    formation: 'V-ば + V-diccionario + ほど',
    explanation:
      'La misma palabra aparece dos veces, primero con ば y luego con ほど: 練習すればするほど上手になる. La segunda cláusula cambia al mismo ritmo que la primera.',
  },
  'ni-shitagatte': {
    meaning: 'a medida que (cambia una cosa, cambia otra)',
    formation: 'V-diccionario / N + にしたがって',
    explanation:
      'にしたがって une dos cambios que avanzan juntos. Con un sustantivo como 指示 también puede significar “siguiendo”.',
  },
  'ni-tsurete': {
    meaning: 'a medida que, en proporción a',
    formation: 'V-diccionario / N + につれて',
    explanation:
      'につれて describe un cambio gradual que sigue a otro de forma natural. No admite detrás una petición ni un deseo.',
  },
  'to-tomo-ni': {
    meaning: 'junto con; a medida que',
    formation: 'N / V-diccionario + とともに',
    explanation:
      'とともに es un “junto con” formal, para personas o para cambios que ocurren a la vez. 時代とともに es “con los tiempos”.',
  },
  'hodo-wa-nai': {
    meaning: 'nada es tan … como',
    formation: 'N + ほど + adjetivo + N + はない',
    explanation:
      'Este patrón destaca algo como lo máximo: 日本語ほど難しい言語はない, “no hay idioma tan difícil como el japonés”. Es una opinión rotunda.',
  },
  'ni-kurabete': {
    meaning: 'en comparación con',
    explanation:
      'に比べて plantea una comparación de forma más formal que より. Es frecuente al principio de la oración.',
  },
  'to-iu-yori': {
    meaning: 'más que (decir)',
    formation: 'forma simple / N + というより',
    explanation:
      'というより corrige una descripción con otra más acertada: 涼しいというより寒い, “más que fresco, hace frío”.',
  },
  'hodo-degree': {
    meaning: 'tan … que; hasta el punto de',
    formation: 'V-diccionario / adj-い + ほど',
    explanation:
      'ほど tras una cláusula da un ejemplo extremo de cuánto: 死ぬほど疲れた, “muerto de cansancio”. A menudo es una exageración.',
  },
  'te-tamaranai': {
    meaning: 'insoportablemente, morirse de ganas',
    formation: 'V-て / adj-い (〜くて) + たまらない',
    explanation:
      'てたまらない indica que un sentimiento o una sensación es demasiado fuerte para soportarlo. Se usa para los sentimientos del propio hablante.',
  },
  'te-shikata-ga-nai': {
    meaning: 'no poder evitar (sentir); muchísimo',
    formation: 'V-て / adj-い (〜くて) + しかたがない',
    explanation:
      'てしかたがない es un sentimiento que el hablante no puede controlar. En la lengua hablada suele convertirse en てしょうがない.',
  },
  'ni-tsuite': {
    meaning: 'sobre, acerca de',
    explanation:
      'について nombra el tema del que se habla, se piensa o se escribe. Delante de un sustantivo pasa a ser についての.',
  },
  'ni-taishite': {
    meaning: 'hacia; en contraste con',
    explanation:
      'に対して dirige una actitud o una acción a un destinatario: 先生に対して失礼だ. Entre dos cláusulas puede contraponerlas.',
  },
  'ni-totte': {
    meaning: 'para, desde el punto de vista de',
    explanation:
      'にとって indica la persona desde cuyo punto de vista se hace un juicio. La oración termina en una valoración como 大切だ.',
  },
  'ni-yotte': {
    meaning: 'según, dependiendo de; por (medio, agente)',
    explanation:
      'によって abarca la variación (国によって違う), el medio y el agente de una pasiva en la lengua escrita. El contexto indica cuál es.',
  },
  'to-shite': {
    meaning: 'como (un papel o una función)',
    explanation:
      'として indica el papel en el que alguien actúa: 通訳として働く, “trabajar como intérprete”.',
  },
  'ni-kanshite': {
    meaning: 'respecto a, en relación con',
    explanation:
      'に関して es un について formal, frecuente en informes y anuncios. Delante de un sustantivo pasa a ser に関する.',
  },
  'o-chuushin-ni': {
    meaning: 'centrado en, principalmente',
    explanation:
      'を中心に nombra el centro o la parte principal de algo que se extiende a su alrededor: 駅を中心に町が広がる.',
  },
  'o-tooshite': {
    meaning: 'a través de, por medio de',
    explanation:
      'を通して nombra el medio o el canal: インターネットを通して. Con una palabra de tiempo significa “durante todo”.',
  },
  'ni-kawatte': {
    meaning: 'en nombre de, en lugar de',
    explanation:
      'に代わって indica que alguien o algo ocupa el lugar de otro: 社長に代わって, “en nombre del presidente”.',
  },
  'te-mo-kamawanai': {
    meaning: 'no importa si; no me importa',
    explanation:
      'ても構わない concede permiso de forma algo más formal que てもいい. También puede significar “no me importa”.',
  },
  'koto-wa-nai': {
    meaning: 'no hace falta',
    formation: 'V-diccionario + ことはない',
    explanation:
      'ことはない le dice a alguien que una acción es innecesaria, a menudo para tranquilizarlo: 心配することはない.',
  },
  'wake-ni-wa-ikanai': {
    meaning: 'no poder permitirse, no deber',
    formation: 'V-diccionario + わけにはいかない',
    explanation:
      'わけにはいかない indica que razones sociales o morales te impiden hacer algo, aunque podrías.',
  },
  'nai-wake-ni-wa-ikanai': {
    meaning: 'no tener más remedio que',
    explanation:
      'Con el negativo, el patrón indica que no puedes evitar hacer algo, por razones sociales o morales.',
  },
  'shika-nai-choice': {
    meaning: 'no tener más remedio que',
    formation: 'V-diccionario + しかない',
    explanation:
      'Tras un verbo, しかない indica que es la única opción que queda: 歩くしかない, “no queda otra que caminar”.',
  },
  nakya: {
    meaning: 'tener que (coloquial)',
    formation: 'V-ない (sin い) + きゃ / くちゃ',
    explanation:
      'なきゃ y なくちゃ son contracciones habladas de なければ y なくては. El resto, いけない, se suele omitir.',
  },
  beki: {
    meaning: 'deber, debería',
    formation: 'V-diccionario + べきだ (する → すべき)',
    explanation:
      'べき expresa lo correcto o un deber, como opinión firme. べきではない es “no debería”.',
  },
};
