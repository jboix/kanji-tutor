/** Spanish messages: the guides (verb groups, the て-form, plain and polite, adjectives, keigo). */
import type { Messages } from '../../types.ts';

export const guides = {
  title: 'Guías',
  tile: 'Guías',
  tileDetail: 'Grupos de verbos, forma て, keigo, conjugación',
  intro:
    'Las reglas de las formas verbales, los adjetivos y el keigo, en tablas para consultar cuando quieras.',
  back: 'Atrás',
  missing: 'No hay ninguna guía llamada {id}.',
  levelTag: 'N{level}',
  readGuide: 'Guía: {title}',
  tutorMore: 'Dame más ejemplos de {x}',
  tutorQuiz: 'Ponme a prueba con {x}',
  colDict: 'Diccionario',
  colMasu: 'ます',
  colNai: 'ない',
  colPlain: 'Llana',
  colPolite: 'Cortés',
  colSonkei: 'Respetuoso',
  colKenjou: 'Humilde',
  colVerb: 'Verbo',

  'verb-groups': 'Grupos de verbos',
  'verb-groupsDetail': 'A qué grupo pertenece un verbo, y cómo saberlo',
  'verb-groupsLead':
    'Los verbos japoneses se dividen en tres grupos, y el grupo te dice cómo cambia el verbo. El grupo 3 tiene solo dos verbos, así que casi todo se reduce a distinguir el grupo 1 del grupo 2. En forma de diccionario, todo verbo termina en un sonido u.',
  godanTitle: 'Grupo 1 · 五段 (verbos en う)',
  godanText:
    'El último kana recorre su fila: 書か・書き・書く・書け・書こ. Antes de ます toma el sonido i (書きます), antes de ない el sonido a (書かない).',
  ichidanTitle: 'Grupo 2 · 一段 (verbos en る)',
  ichidanText:
    'Terminan en -iru o -eru. Quitas る y añades la terminación: 食べる → 食べます, 食べない.',
  irregularTitle: 'Grupo 3 · irregulares',
  irregularText:
    'Solo する y 来る (くる), más todo sustantivo + する, como 勉強する. Vale la pena aprenderse sus formas de memoria.',
  tellTitle: 'Cómo saberlo',
  tellText:
    'No termina en る: grupo 1. Termina en る tras un sonido a, u u o (分かる, 作る, 乗る): grupo 1. Termina en -iru o -eru: normalmente grupo 2, pero ojo con estos verbos comunes del grupo 1:',

  'plain-polite': 'Forma de diccionario y forma cortés',
  'plain-politeDetail': '辞書形 y ます形, y cuándo usar cada una',
  'plain-politeLead':
    'Cada verbo tiene una forma llana, la del diccionario (辞書形), y una forma cortés en ます. Significan lo mismo; la cortés se usa con la gente con la que no tienes confianza.',
  pairsTitle: 'Los cuatro pares',
  pairsText: 'Presente y pasado, afirmativo y negativo, la llana junto a la cortés:',
  whenTitle: 'Cuándo se usa la forma llana',
  whenText:
    'Entre amigos y en familia, y en diarios y artículos. También dentro de una frase: antes de 〜と思います, 〜ことができます, 〜前に o de un sustantivo (読む本), el verbo va en forma llana aunque la frase sea cortés.',

  'te-form': 'La forma て y la forma た',
  'te-formDetail': 'Los cambios de sonido, en una sola tabla',
  'te-formLead':
    'La forma て sirve para encadenar acciones (〜て、〜), para pedir algo (〜てください) y para formar 〜ている. La forma た es el pasado llano. Las dos cambian igual: cambia て por た, y で por だ.',
  rulesTitle: 'Grupo 1, según el último kana',
  rulesText:
    'Lo más fácil es aprenderlo como una cantinela: う・つ・る → って, む・ぶ・ぬ → んで, く → いて, ぐ → いで, す → して.',
  othersTitle: 'Grupo 2, irregulares y 行く',
  othersText:
    'El grupo 2 solo cambia る por て. する y 来る son irregulares, y 行く es el único verbo en く que toma って.',

  adjectives: 'Formas de los adjetivos',
  adjectivesDetail: 'Adjetivos en い y en な, forma llana y cortés',
  adjectivesLead:
    'Los adjetivos en い cambian su propia terminación. Los adjetivos en な no cambian, como los sustantivos: cambia la palabra que va detrás.',
  iTitle: 'Adjetivos en い',
  iText:
    'い pasa a くない, かった, くなかった, くて. いい es irregular: sus formas vienen de よい (よくない, よかった).',
  naTitle: 'Adjetivos en な',
  naText:
    'El adjetivo no cambia; detrás va だ, じゃない, だった o で. Delante de un sustantivo, añade な: 静かな部屋.',
  rowPresent: 'Presente',
  rowNegative: 'Negativo',
  rowPast: 'Pasado',
  rowNegativePast: 'Pasado negativo',
  rowTe: 'Forma て',

  conjugation: 'Tabla de conjugación',
  conjugationDetail: 'Cualquier verbo en todas sus formas',
  conjugationLead:
    'Elige un verbo, o escribe cualquier verbo en forma de diccionario, para ver todas sus formas. La etiqueta junto a cada forma es el nivel del JLPT en el que aparece.',
  pickVerb: 'Un verbo',
  typeVerb: 'Cualquier verbo',
  typeVerbPlaceholder: 'Forma de diccionario, p. ej. 遊ぶ o あそぶ',
  notAVerb: 'No conocemos el verbo {text}. Prueba con su forma de diccionario, como 泳ぐ.',
  groupOf: 'Grupo {n}',
  formDict: 'Forma de diccionario',
  formMasu: 'Cortés',
  formNai: 'Negativa',
  formTa: 'Pasada',
  formNakatta: 'Pasada negativa',
  formTe: 'Forma て',
  formTai: 'Querer',
  formVolitional: 'Vamos a (llana)',
  formPotential: 'Poder (potencial)',
  formPassive: 'Pasiva',
  formCausative: 'Causativa',
  formImperative: 'Orden',
  formBa: 'Si (ば)',
  formTara: 'Si, cuando (たら)',

  keigo: 'Keigo',
  keigoDetail: 'Lenguaje cortés, respetuoso y humilde',
  keigoLead:
    'El keigo tiene tres registros. 丁寧語 son los です y ます corteses que ya usas. 尊敬語 eleva a la otra persona, para lo que hace ella. 謙譲語 te rebaja a ti, para lo que haces por ella.',
  verbsTitle: 'Verbos con palabras propias',
  verbsText: 'Los verbos más comunes se convierten en una palabra totalmente distinta:',
  patternsTitle: 'Los patrones para los demás verbos',
  patternsText: 'Los demás verbos siguen un patrón:',
  patternoNiNaru: 'Respetuoso, para lo que hacen ellos',
  patternreru: 'Respetuoso, más ligero: igual que la forma pasiva',
  patternoSuru: 'Humilde, para lo que haces por ellos',
  patterngoSuru: 'Humilde, con un sustantivo con する',
  sentencesTitle: 'En frases',
  sentenceirassharu: '¿A qué hora vendrá el profesor?',
  sentenceoKaeri: 'El director ya se ha ido a casa.',
  sentenceokuri: 'Te llevo a la estación.',
  sentencemoushimasu: 'Me llamo Tanaka.',
} satisfies Messages['guides'];
