/** French texts for N3 units 37–39 (N9). Written for this app. */
import type { ById, UnitText } from '../../content-types.ts';

export const FR_N3_D: ById<UnitText> = {
  'food-models': {
    theme: 'Les plats en plastique en vitrine',
    summary:
      'Les vitrines des restaurants montrent des répliques faites main de chaque plat, pour commander sans rien lire.',
    sentences: [
      'Les restaurants japonais exposent souvent des modèles de leurs plats devant l’entrée.',
      'On les appelle échantillons alimentaires, et ils sont faits pour ressembler trait pour trait aux vrais.',
      'Grâce à eux, on voit d’un coup d’œil la taille et le prix d’un plat, sans lire le menu.',
      'C’est donc pratique pour les touristes qui ne comprennent pas le japonais.',
      'Chaque échantillon est fabriqué à la main par un artisan, ce qui demande une grande habileté.',
      'Tokyo a un quartier rempli de boutiques d’échantillons, où l’on peut même essayer d’en fabriquer un.',
      'J’ai moi-même essayé de faire un échantillon de tempura, et c’était plus difficile que prévu.',
    ],
    questions: [
      'これ ouvre la ligne 2 et renvoie à la ligne 1 : 店の前に料理の見本が並んでいる, les modèles de plats devant le restaurant. La ligne 2 ajoute qu’ils imitent parfaitement les vrais plats : ce ne sont donc pas de vrais plats.',
      'Ligne 3 : 料理の量や値段が一目でわかる, on voit d’un coup d’œil la quantité et le prix. Le goût et l’odeur ne se voient pas, et aucun nom n’est mentionné.',
      'Ligne 6 : サンプルを作る体験もできる, les visiteurs peuvent essayer de fabriquer eux-mêmes un modèle. La tempura de la ligne 7 est un échantillon fait par l’auteur, pas un repas, et rien ne parle de cours ni de menus.',
    ],
  },
  'rain-and-typhoons': {
    theme: 'La saison des pluies et les typhons',
    summary:
      'Le début de l’été apporte des semaines de chaleur humide, et la fin de l’été des typhons qui arrêtent les trains.',
    sentences: [
      'De juin à juillet, une grande partie du Japon entre dans la saison des pluies.',
      'À cette période, les jours de pluie se succèdent, et il fait humide et lourd.',
      'Le linge ne sèche pas, et des moisissures peuvent même apparaître dans la chambre, si bien que beaucoup de gens en souffrent.',
      'À la fin de la saison des pluies, le vrai été commence, et d’août à septembre les typhons sont fréquents.',
      'Quand un typhon approche, la météo annonce sa trajectoire chaque jour.',
      'En cas de typhon violent, les trains peuvent s’arrêter et les écoles fermer.',
      'Avant un typhon, il faut donc se préparer, par exemple en fermant les fenêtres et en rentrant ce qui se trouve dehors.',
    ],
    questions: [
      'Ligne 2 : 雨の日が続き、しっけが多くてむし暑い, des jours de pluie à la suite et une chaleur moite. Les typhons arrivent plus tard, en août et septembre (ligne 4), et c’est le linge qui ne sèche pas (ligne 3).',
      'Ligne 4 : 八月から九月にかけては台風がよく来る. Juin et juillet sont la saison des pluies (ligne 1), et les autres mois ne sont pas mentionnés.',
      'Ligne 7 : 窓を閉めて外の物を家の中に入れておく, on rentre ce qui est dehors. La fermeture des écoles est une conséquence d’un fort typhon (ligne 6), et la météo quotidienne est le travail des informations (ligne 5), pas une préparation à la maison.',
    ],
  },
  obon: {
    theme: 'Obon, la fête estivale des défunts',
    summary:
      'À la mi-août, les familles accueillent leurs ancêtres à la maison, et tout le pays retourne dans sa ville natale.',
    sentences: [
      'Obon est une coutume estivale fondée sur la croyance que les ancêtres défunts reviennent à la maison.',
      'Dans la plupart des régions, elle a lieu du 13 au 16 août environ.',
      'Pendant cette période, les citadins retournent dans leur ville natale et la passent en famille, avec leurs proches.',
      'Les autoroutes et les shinkansen sont donc très bondés.',
      'Au début d’Obon, on allume un petit feu devant la maison pour accueillir les ancêtres, et un autre le dernier jour pour les raccompagner.',
      'Entre-temps, les familles se rendent sur les tombes et participent à la danse bon du quartier.',
      'Le respect des ancêtres perdure aujourd’hui encore sous la forme d’une coutume d’été.',
    ],
    questions: [
      'La ligne 1 la définit : 亡くなった先祖が家に帰ってくると考えられている夏の行事, une fête d’été où l’on pense que les ancêtres reviennent à la maison, et la ligne 5 montre les familles qui les accueillent. Le Nouvel An, les enfants et les feux d’artifice ne sont jamais mentionnés.',
      'À la ligne 4, その renvoie à la ligne 3 : 都会に住んでいる人も故郷に帰って, les citadins retournent dans leur ville natale, d’où les routes et les trains bondés. Le retour des ancêtres (ligne 1) est une croyance, pas une cause des embouteillages.',
      'Ligne 5 : おぼんの初めには、家の前で小さな火をつけて先祖を迎え, on allume un petit feu devant la maison pour accueillir les ancêtres. La visite des tombes et la danse ont lieu pendant Obon (ligne 6), pas à son début.',
    ],
  },
};
