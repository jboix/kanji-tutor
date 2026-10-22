/** French texts for N4 units 23–25 (N9). Written for this app. */
import type { ById, UnitText } from '../../content-types.ts';

export const FR_N4_D: ById<UnitText> = {
  'new-year-cards': {
    theme: 'Les cartes du Nouvel An',
    summary:
      'Les cartes postées avant la fin décembre sont gardées par la poste et toutes distribuées le jour de l’An.',
    sentences: [
      'Au Japon, il est de coutume d’envoyer des cartes de Nouvel An.',
      'Le nengajō est une carte postale portant des vœux de Nouvel An ; la poste commence à les vendre en novembre.',
      'Si on les poste vers le 25 décembre au plus tard, elles arrivent le 1er janvier.',
      'Sur la carte, on écrit des remerciements pour l’année passée et « Je compte encore sur vous cette année ».',
      'Beaucoup de cartes montrent aussi l’animal de l’année.',
      'Aujourd’hui, de plus en plus de gens envoient leurs vœux par e-mail, et on dit que le nombre de cartes diminue.',
      'Mais quand je reçois une carte écrite à la main, cela me rend très heureuse.',
    ],
    questions: [
      'Ligne 3 : 十二月二十五日ごろまでに出すと、一月一日に届きます. までに marque la date limite. Novembre, c’est quand les cartes sont mises en vente, et le 31 est trop tard.',
      'Ligne 4 : 去年のお礼や「今年もよろしく」という言葉を書きます : des remerciements pour l’année passée et des vœux pour la nouvelle. Le texte ne parle ni d’adresse, ni de voyage, ni de photo.',
      'Ligne 6 : ねんがじょうはへっているそうです. へる signifie devenir moins nombreux. Ce qui augmente, ce sont les vœux par e-mail, pas les cartes, et rien n’est dit sur le prix.',
      'Ligne 7 : 手で書いたねんがじょうをもらうと、わたしはとてもうれしくなります. Les vœux par e-mail viennent avant でも, comme contraste.',
    ],
  },
  'year-end-and-new-year': {
    theme: 'Le passage à la nouvelle année',
    summary:
      'L’année se termine par un grand ménage, des nouilles et les 108 coups de cloche des temples, et commence par une visite au sanctuaire.',
    sentences: [
      'Au Japon, à la fin de l’année, les familles font un grand ménage de la maison.',
      'Le 31 décembre s’appelle Ōmisoka, et ce soir-là on mange des nouilles soba.',
      'On dit qu’elles portent le vœu de vivre longtemps, fin et long comme les nouilles.',
      'À l’approche de minuit, les cloches des temples sonnent 108 fois.',
      'Le 1er janvier, on fait sa première visite de l’année au sanctuaire ou au temple.',
      'Au Nouvel An, la famille se réunit et mange des plats spéciaux.',
      'Les enfants reçoivent de l’argent des adultes pour le Nouvel An, alors ils l’attendent avec impatience.',
    ],
    questions: [
      'Ligne 2 : 夜にそばを食べます. Les plats spéciaux sont pour le jour de l’An, avec la famille.',
      'Ligne 3 : そばのように細く長く生きられるように, le vœu d’une longue vie. そうです indique que c’est ce que l’on dit. Les cloches sonnent plus tard dans la nuit, et rien n’est dit sur la santé ni sur le prix.',
      'La ligne 7 donne la raison avec ので : 大人からおとしだまをもらう, et おとしだま est l’argent du Nouvel An. La famille et la visite au sanctuaire sont mentionnées, mais pas comme raison des enfants.',
    ],
  },
  'school-trip': {
    theme: 'Le voyage scolaire',
    summary:
      'Presque tous les élèves font un voyage de classe à Kyoto ou à Nara, et s’en souviennent toute leur vie.',
    sentences: [
      'À l’automne de ma troisième année de collège, nous sommes allés à Kyoto en voyage scolaire.',
      'Le premier jour, toute la classe a pris le bus et visité plusieurs temples célèbres.',
      'Le deuxième jour était libre, et nous nous sommes répartis en groupes de cinq pour nous promener en ville.',
      'Notre groupe a fait le tour des endroits que nous avions choisis nous-mêmes, carte en main.',
      'Un grand parc était plein de cerfs, et quand on leur donnait des biscuits, ils bougeaient la tête comme pour saluer.',
      'Le soir, à l’auberge, nous avons bavardé tard entre amis et nous nous sommes fait gronder par le professeur.',
      'Le voyage scolaire reste aujourd’hui mon meilleur souvenir.',
    ],
    questions: [
      'Ligne 3 : 五人ずつのグループに分かれて町を歩きました, des groupes de cinq qui se promènent en ville. Le bus et les temples, c’était le premier jour.',
      'Ligne 5 : せんべいをあげると、頭を下げるように動きました. 頭を下げる, c’est s’incliner, le salut japonais, et ici ように signifie « comme si » : les cerfs semblent s’incliner. Ils ne s’enfuient pas, ne dorment pas et ne crient pas.',
      'Ligne 6 : 友達と遅くまで話していて、先生にしかられました. Bavarder tard, c’est veiller tard ; la proposition en 〜ていて donne la cause. La carte et les cerfs faisaient partie de la journée, sans que personne se fasse gronder.',
    ],
  },
};
