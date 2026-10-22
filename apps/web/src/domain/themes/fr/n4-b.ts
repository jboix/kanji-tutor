/** French texts for N4 units 17–19 (N9, D53). Written for this app. */
import type { ById, UnitText } from '../../content-types.ts';

export const FR_N4_B: ById<UnitText> = {
  'part-time-job': {
    theme: 'Un petit boulot',
    summary:
      'Les étudiants travaillent à temps partiel dans des cafés et des boutiques, où l’on apprend dès le premier jour des formules de politesse toutes faites.',
    sentences: [
      'Je travaille à temps partiel trois fois par semaine dans un café devant la gare.',
      'Je suis payée 1 100 yens de l’heure.',
      'Au début, les mots qu’on emploie avec les clients étaient difficiles, et c’était dur.',
      'Je me suis entraînée tous les jours aux salutations comme « Bienvenue ».',
      'Le gérant est gentil et m’explique soigneusement tout ce que je ne comprends pas.',
      'Pour ne jamais être en retard, je fais toujours en sorte d’arriver dix minutes en avance.',
      'Depuis que j’ai commencé ce travail, je parle mieux japonais.',
      'J’ai l’intention d’acheter un nouvel ordinateur avec ma paie du mois prochain.',
    ],
    questions: [
      'Ligne 1 : 一週間に三回, trois fois par semaine.',
      'Ligne 3 : 大変 suit 難しくて : le langage à employer avec les clients était difficile, donc le travail n’était pas facile au début. Rien n’est dit sur un salaire bas ou un manque de clients.',
      'Ligne 6 : ちこくしないように, « pour ne pas être en retard ». Le gérant est décrit comme gentil, pas comme celui qui donne cet ordre.',
      'Ligne 8 : 来月のきゅうりょうで、新しいパソコンを買うつもりです. Le texte ne parle ni de voyage, ni d’argent envoyé à la famille, ni de frais de scolarité.',
    ],
  },
  'at-the-clinic': {
    theme: 'Chez le médecin',
    summary:
      'Les cliniques de quartier reçoivent sans rendez-vous : on apporte sa carte d’assurance maladie et on attend son tour.',
    sentences: [
      'Lundi dernier, en me levant, j’avais de la fièvre et mal à la tête.',
      'J’avais aussi mal à la gorge, alors je ne suis pas allée à l’école et je suis allée dans une clinique près de chez moi.',
      'À l’accueil, j’ai présenté ma carte d’assurance maladie et j’ai écrit mon nom.',
      'Après environ trente minutes d’attente, j’ai vu le médecin.',
      'Le médecin a dit : « C’est un rhume. Prenez ce médicament trois fois par jour. »',
      'Il a aussi dit : « Ne forcez pas ; vous devriez vous reposer deux ou trois jours. »',
      'J’ai pris le médicament et bien dormi, et trois jours plus tard j’étais guérie.',
    ],
    questions: [
      'Ligne 3 : 受付でほけんのカードを出して、名前を書きました : l’auteur a montré sa carte d’assurance et écrit son nom. La consultation vient après l’attente, le médicament vient du médecin, et aucune piqûre n’est mentionnée.',
      'Ligne 5 : この薬を一日三回飲んでください. 二、三日, à la ligne 6, est le nombre de jours de repos.',
      'Ligne 6 : 無理をしないで、二、三日休んだほうがいい. Le médecin ne demande jamais de venir chaque jour ni de faire une piqûre.',
      'Ligne 7 : 三日後には治りました.',
    ],
  },
  shinkansen: {
    theme: 'Voyager en train à grande vitesse',
    summary:
      'Le shinkansen est rapide et réputé pour sa ponctualité, et le bento de gare fait partie du voyage.',
    sentences: [
      'Pendant les vacances de printemps, j’ai voyagé de Tokyo à Kyoto en shinkansen.',
      'J’avais réservé une place la veille.',
      'J’avais une place côté fenêtre, alors je voyais bien le paysage.',
      'Le shinkansen est très rapide : il n’a fallu qu’un peu plus de deux heures jusqu’à Kyoto.',
      'Dans le train, j’ai mangé un bento de gare et regardé le mont Fuji par la fenêtre.',
      'On dit que le shinkansen n’est presque jamais en retard, ce qui surprend souvent les visiteurs étrangers.',
      'Nous sommes arrivés à la gare de Kyoto exactement à l’heure prévue.',
    ],
    questions: [
      'Ligne 2 : 前の日に、指定席を予約しておきました. 〜ておく indique que c’était fait à l’avance.',
      'Ligne 3 : 窓の近くの席だったので : la place était côté fenêtre (窓に近い). Le temps n’est pas mentionné, rien ne dit que le train était vide, et il était rapide, pas lent.',
      'Ligne 6 : ほとんど遅れない, il est donc presque toujours à l’heure, et la ligne 7 montre qu’il est arrivé 予定の時間ちょうど. Le trajet a duré un peu plus de deux heures (ligne 4), et l’auteur a mangé un bento à bord (ligne 5).',
    ],
  },
};
