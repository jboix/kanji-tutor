/** French texts for N3 grammar, part D (N9, D53). Written for this app. */
import type { ById, GrammarText } from '../../content-types.ts';

export const FR_N3_D: ById<GrammarText> = {
  kiru: {
    meaning: 'faire complètement, jusqu’au bout',
    formation: 'V-radical + きる',
    explanation:
      'きる après un radical en -masu dit qu’une action est menée jusqu’au bout : 全部食べきった.',
  },
  kakeru: {
    meaning: 'à moitié fait, commencer à',
    formation: 'V-radical + かける / かけの + N',
    explanation:
      'かける décrit une action commencée mais pas terminée : 読みかけの本, « un livre à moitié lu ». Il peut aussi signifier « sur le point de ».',
  },
  dasu: {
    meaning: 'se mettre soudain à, éclater',
    formation: 'V-radical + 出す',
    explanation:
      '出す après un radical en -masu marque un début soudain : 急に泣き出した. 始める est le « commencer » neutre.',
  },
  au: {
    meaning: 'faire l’un à l’autre, ensemble',
    formation: 'V-radical + 合う',
    explanation:
      '合う rend une action réciproque : 話し合う signifie « en discuter ensemble », 助け合う « s’entraider ».',
  },
  naosu: {
    meaning: 'refaire, recommencer (en mieux)',
    formation: 'V-radical + 直す',
    explanation:
      '直す après un radical en -masu signifie refaire quelque chose pour le corriger : 書き直す, « réécrire ».',
  },
  wasureru: {
    meaning: 'oublier de faire',
    formation: 'V-radical + 忘れる',
    explanation:
      '忘れる après un radical en -masu dit qu’une étape a été oubliée : 傘を持ち忘れた, « j’ai oublié de prendre mon parapluie ».',
  },
  kirenai: {
    meaning: 'ne pas pouvoir (finir), trop nombreux pour',
    formation: 'V-radical + きれない',
    explanation:
      'きれない dit qu’il y a trop pour pouvoir finir : 一人では食べきれない. 数えきれない signifie « innombrable ».',
  },
  'you-ga-nai': {
    meaning: 'il n’y a aucun moyen de',
    formation: 'V-radical + ようがない',
    explanation:
      'ようがない dit qu’aucune méthode n’existe, donc que l’action est impossible : 連絡のしようがない, « il n’y a aucun moyen de les joindre ».',
  },
  'you-to-suru': {
    meaning: 'essayer de ; être sur le point de',
    formation: 'V-volitif + とする',
    explanation:
      'ようとする décrit une tentative ou le moment juste avant une action. Il s’accompagne souvent d’une interruption : 出かけようとした時.',
  },
  'koto-ni-shite-iru': {
    meaning: 'avoir pour règle de',
    formation: 'V-dictionnaire / V-ない + ことにしている',
    explanation:
      'ことにしている est une règle personnelle suivie dans la durée, issue d’une décision antérieure.',
  },
  'koto-ni-natte-iru': {
    meaning: 'il est de règle que ; être prévu que',
    formation: 'V-dictionnaire / V-ない + ことになっている',
    explanation:
      'ことになっている décrit une règle ou un arrangement fixé par d’autres, comme une école ou une entreprise.',
  },
  'to-shitara': {
    meaning: 'à supposer que, si',
    formation: 'forme neutre + としたら / とすれば',
    explanation:
      'としたら imagine une situation peut-être irréelle, puis demande ou dit ce qui s’ensuivrait.',
  },
  'sae-ba': {
    meaning: 'si seulement, du moment que',
    explanation:
      'さえ…ば indique la seule condition qui suffit : 時間さえあれば, « si seulement j’avais le temps ».',
  },
  baai: {
    meaning: 'en cas de, si',
    formation: 'forme neutre / N + の + 場合(は)',
    explanation:
      '場合 pose un cas possible, comme dans les règlements et les consignes : 雨の場合は中止です.',
  },
  'te-kara-de-nai-to': {
    meaning: 'pas avant, seulement après',
    explanation:
      'てからでないと dit qu’une chose ne peut pas arriver avant qu’une autre étape soit faite. La seconde proposition est négative.',
  },
  sae: {
    meaning: 'même',
    explanation:
      'さえ choisit un exemple extrême pour montrer jusqu’où va une chose : 子供でさえ知っている, « même un enfant le sait ».',
  },
  koso: {
    meaning: 'justement, celui-ci (et aucun autre)',
    explanation:
      'こそ met fortement l’accent sur un élément : 今度こそ, « cette fois, c’est la bonne ». C’est une insistance positive.',
  },
  nanka: {
    meaning: 'des choses comme (dédaigneux)',
    explanation:
      'なんか et なんて minimisent une chose, ou montrent le peu d’estime du locuteur pour elle : 幽霊なんか怖くない.',
  },
  datte: {
    meaning: 'même, aussi (familier)',
    explanation:
      'Après un nom, だって est un でも familier : « même moi » ou « moi aussi ». En début de phrase, il signifie au contraire « mais, parce que ».',
  },
  'oki-ni': {
    meaning: 'tous les … (en sautant), à intervalles de',
    formation: 'nombre + compteur + おきに',
    explanation:
      'おきに laisse un écart de cette taille entre les répétitions : 二日おきに signifie tous les trois jours, avec deux jours entre deux.',
  },
  'goto-ni': {
    meaning: 'chaque, tous les',
    formation: 'N / nombre + compteur + ごとに',
    explanation:
      'ごとに dit qu’une chose arrive à chaque unité, sans écart : 一時間ごとに, « toutes les heures ».',
  },
  darake: {
    meaning: 'plein de, couvert de',
    explanation:
      'だらけ dit qu’une chose est couverte de quelque chose d’indésirable : 泥だらけ, « couvert de boue ».',
  },
  teki: {
    meaning: '-ique, -el (adjectif tiré d’un nom)',
    explanation:
      '的 transforme un nom en adjectif en な : 経済的な問題, « un problème économique ». Il est courant en japonais écrit.',
  },
  'ka-suffix': {
    meaning: '-isation, le fait de devenir',
    explanation:
      '化 forme un nom de changement, qui peut prendre する : 国際化, « internationalisation ».',
  },
  muki: {
    meaning: 'adapté à',
    explanation:
      '向き dit qu’une chose se trouve convenir à un groupe : この本は子供向きだ. Cela ne dit pas qu’elle a été faite pour lui.',
  },
  muke: {
    meaning: 'destiné à, conçu pour',
    explanation:
      '向け dit qu’une chose a été conçue pour un groupe : 初心者向けの本, « un livre pour débutants ».',
  },
  'koto-command': {
    meaning: 'il faut, faire (règle écrite)',
    formation: 'V-dictionnaire / V-ない + こと。',
    explanation:
      'Une phrase qui se termine par こと est une consigne écrite, comme dans les règlements scolaires et les avis : 会議中は話さないこと.',
  },
  'ki-ga-suru': {
    meaning: 'avoir l’impression que',
    formation: 'forme neutre (adj-な + な / N + の) + 気がする',
    explanation:
      '気がする est une impression vague, sans preuve : 雨が降りそうな気がする. C’est plus doux que と思う.',
  },
};
