/** French texts for N3 grammar, part B (N9). Written for this app. */
import type { ById, GrammarText } from '../../content-types.ts';

export const FR_N3_B: ById<GrammarText> = {
  toka: {
    meaning: 'des choses comme A et B',
    formation: 'N / forme neutre + とか',
    explanation:
      'とか énumère des exemples de façon familière, comme や à l’oral. Il peut aussi suivre des propositions entières, ce que や ne peut pas.',
  },
  'dake-de-naku': {
    meaning: 'non seulement … mais aussi',
    formation: 'N / forme neutre + だけでなく … も',
    explanation:
      'だけでなく ajoute un second élément au premier, et le second est souvent plus surprenant. La seconde partie prend généralement も.',
  },
  'ba-hodo': {
    meaning: 'plus …, plus …',
    formation: 'V-ば + V-dictionnaire + ほど',
    explanation:
      'Le même mot apparaît deux fois, d’abord avec ば puis avec ほど : 練習すればするほど上手になる. La seconde proposition évolue au même rythme que la première.',
  },
  'ni-shitagatte': {
    meaning: 'à mesure que (une chose change, une autre aussi)',
    formation: 'V-dictionnaire / N + にしたがって',
    explanation:
      'にしたがって relie deux changements qui évoluent ensemble. Avec un nom comme 指示, il peut aussi signifier « en suivant ».',
  },
  'ni-tsurete': {
    meaning: 'à mesure que, au fur et à mesure',
    formation: 'V-dictionnaire / N + につれて',
    explanation:
      'につれて décrit un changement progressif qui en suit naturellement un autre. Il n’est pas suivi d’une demande ni d’un souhait.',
  },
  'to-tomo-ni': {
    meaning: 'avec, en même temps que ; à mesure que',
    formation: 'N / V-dictionnaire + とともに',
    explanation:
      'とともに est un « avec » soutenu, pour des personnes ou des changements simultanés. 時代とともに signifie « avec son temps ».',
  },
  'hodo-wa-nai': {
    meaning: 'rien n’est aussi … que',
    formation: 'N + ほど + adjectif + N + はない',
    explanation:
      'Cette structure met une chose en avant comme la plus … de toutes : 日本語ほど難しい言語はない, « aucune langue n’est aussi difficile que le japonais ». C’est une opinion tranchée.',
  },
  'ni-kurabete': {
    meaning: 'comparé à, par rapport à',
    explanation:
      'に比べて pose une comparaison de façon plus soutenue que より. Il est courant en début de phrase.',
  },
  'to-iu-yori': {
    meaning: 'plutôt que (de dire)',
    formation: 'forme neutre / N + というより',
    explanation:
      'というより corrige une description par une plus juste : 涼しいというより寒い, « il fait plus froid que frais ».',
  },
  'hodo-degree': {
    meaning: 'si … que ; au point de',
    formation: 'V-dictionnaire / adj-い + ほど',
    explanation:
      'ほど après une proposition donne un exemple extrême du degré : 死ぬほど疲れた, « mort de fatigue ». C’est souvent une exagération.',
  },
  'te-tamaranai': {
    meaning: 'insupportablement, mourir d’envie de',
    formation: 'V-て / adj-い (〜くて) + たまらない',
    explanation:
      'てたまらない dit qu’un sentiment ou une sensation est trop fort pour être supporté. Il s’applique aux sentiments du locuteur lui-même.',
  },
  'te-shikata-ga-nai': {
    meaning: 'ne pas pouvoir s’empêcher (de ressentir) ; terriblement',
    formation: 'V-て / adj-い (〜くて) + しかたがない',
    explanation:
      'てしかたがない exprime un sentiment que le locuteur ne peut pas maîtriser. À l’oral, il devient souvent てしょうがない.',
  },
  'ni-tsuite': {
    meaning: 'au sujet de, concernant',
    explanation:
      'について indique le sujet dont on parle, auquel on pense ou sur lequel on écrit. Devant un nom, il devient についての.',
  },
  'ni-taishite': {
    meaning: 'envers ; par opposition à',
    explanation:
      'に対して dirige une attitude ou une action vers une cible : 先生に対して失礼だ. Entre deux propositions, il peut les opposer.',
  },
  'ni-totte': {
    meaning: 'pour, du point de vue de',
    explanation:
      'にとって indique la personne du point de vue de laquelle on juge. La phrase se termine par une appréciation comme 大切だ.',
  },
  'ni-yotte': {
    meaning: 'selon ; par (moyen, agent)',
    explanation:
      'によって couvre la variation (国によって違う), le moyen et l’auteur d’un passif à l’écrit. Le contexte montre lequel est visé.',
  },
  'to-shite': {
    meaning: 'en tant que (rôle ou qualité)',
    explanation:
      'として indique le rôle dans lequel quelqu’un agit : 通訳として働く, « travailler comme interprète ».',
  },
  'ni-kanshite': {
    meaning: 'en ce qui concerne, à propos de',
    explanation:
      'に関して est un について soutenu, courant dans les rapports et les annonces. Devant un nom, il devient に関する.',
  },
  'o-chuushin-ni': {
    meaning: 'centré sur, principalement',
    explanation:
      'を中心に indique le centre ou la partie principale de ce qui s’étend autour : 駅を中心に町が広がる.',
  },
  'o-tooshite': {
    meaning: 'par l’intermédiaire de, à travers',
    explanation:
      'を通して indique le moyen ou le canal : インターネットを通して. Avec un mot de temps, il signifie « tout au long de ».',
  },
  'ni-kawatte': {
    meaning: 'au nom de, à la place de',
    explanation:
      'に代わって dit qu’une personne ou une chose en remplace une autre : 社長に代わって, « au nom du président ».',
  },
  'te-mo-kamawanai': {
    meaning: 'peu importe si ; cela ne me dérange pas',
    explanation:
      'ても構わない accorde une permission de façon un peu plus soutenue que てもいい. Il peut aussi signifier « cela ne me dérange pas ».',
  },
  'koto-wa-nai': {
    meaning: 'il n’est pas nécessaire de',
    formation: 'V-dictionnaire + ことはない',
    explanation:
      'ことはない dit à quelqu’un qu’une action est inutile, souvent pour le rassurer : 心配することはない.',
  },
  'wake-ni-wa-ikanai': {
    meaning: 'ne pas pouvoir se permettre de, ne pas devoir',
    formation: 'V-dictionnaire + わけにはいかない',
    explanation:
      'わけにはいかない dit que des raisons sociales ou morales empêchent de faire quelque chose, même si on le pourrait.',
  },
  'nai-wake-ni-wa-ikanai': {
    meaning: 'ne pas avoir d’autre choix que de',
    explanation:
      'Avec le négatif, la structure dit qu’on ne peut pas éviter de faire quelque chose, pour des raisons sociales ou morales.',
  },
  'shika-nai-choice': {
    meaning: 'ne pas avoir d’autre choix que de',
    formation: 'V-dictionnaire + しかない',
    explanation:
      'Après un verbe, しかない dit que c’est la seule option restante : 歩くしかない, « il n’y a plus qu’à marcher ».',
  },
  nakya: {
    meaning: 'faut que, devoir (familier)',
    formation: 'V-ない (sans い) + きゃ / くちゃ',
    explanation:
      'なきゃ et なくちゃ sont des contractions orales de なければ et なくては. La suite, いけない, est souvent omise.',
  },
  beki: {
    meaning: 'devoir, il faudrait',
    formation: 'V-dictionnaire + べきだ (する → すべき)',
    explanation:
      'べき énonce ce qui est juste ou un devoir, sous forme d’opinion ferme. べきではない signifie « il ne faut pas ».',
  },
};
