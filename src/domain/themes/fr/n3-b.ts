/** French texts for N3 units 31–33 (N9, D53). Written for this app. */
import type { ById, UnitText } from '../../content-types.ts';

export const FR_N3_B: ById<UnitText> = {
  kabuki: {
    theme: 'Le théâtre kabuki',
    summary:
      'Au kabuki, les hommes jouent tous les rôles, et le public crie le nom des acteurs aux grands moments.',
    sentences: [
      'Le kabuki est un art de la scène traditionnel japonais né il y a plus de quatre cents ans.',
      'Dans le kabuki actuel, seuls des acteurs masculins montent sur scène, et ce sont aussi des hommes qui jouent les rôles féminins.',
      'Les acteurs se maquillent le visage en blanc et portent de magnifiques costumes.',
      'Au milieu d’une pièce, il arrive que des spectateurs crient très fort le nom d’un acteur.',
      'Ce serait une façon d’encourager l’acteur.',
      'La langue employée est ancienne, si bien que même les Japonais ont du mal à tout comprendre.',
      'Mais les théâtres proposent des explications en anglais, donc les visiteurs étrangers peuvent eux aussi pleinement en profiter.',
    ],
    questions: [
      'Ligne 2 : 男性の役者だけが舞台に立ち、女性の役も男性が演じる. Seuls des hommes montent sur scène, donc les rôles féminins sont joués par des acteurs masculins ; il n’y a pas d’actrices, et le public ne joue pas.',
      'これ ouvre la ligne 5 et renvoie à la ligne 4 : 観客が役者の名前を大きな声で呼ぶ, le public qui crie le nom d’un acteur. La ligne 5 explique pourquoi : pour l’encourager. Le maquillage blanc (ligne 3) et la langue ancienne (ligne 6) ne sont pas ce que désigne これ.',
      'La ligne 6 donne la raison avec ので : 昔の言葉が使われる, la langue employée est ancienne. Le fait que seuls des hommes jouent (ligne 2) n’a rien à voir avec la compréhension, et le guide en anglais est une aide en plus (ligne 7), pas la seule.',
    ],
  },
  rakugo: {
    theme: 'Le conte rakugo',
    summary:
      'Un seul conteur assis sur un coussin joue tous les personnages avec un simple éventail et un tissu.',
    sentences: [
      'Le rakugo est un art traditionnel où un conteur seul, assis sur un coussin, raconte une histoire drôle.',
      'Les seuls accessoires sont un éventail pliant et une serviette.',
      'Par exemple, l’éventail devient des baguettes et la serviette un portefeuille.',
      'Le conteur change d’expression et de voix pour jouer à lui seul de nombreux personnages.',
      'Le public doit donc imaginer chaque scène dans sa tête tout en écoutant.',
      'Chaque histoire se termine par une chute appelée ochi, et c’est là que tout le monde rit.',
      'Tokyo a des yose, des théâtres consacrés au rakugo, où l’on peut en écouter presque tous les jours.',
    ],
    questions: [
      'Ligne 2 : 使う道具は、せんすと手ぬぐいだけだ, seulement un éventail et une serviette, donc deux accessoires en tout. Les baguettes et le portefeuille sont ce que représentent ces accessoires dans une histoire (ligne 3) ; ce ne sont pas de vrais accessoires.',
      'Ligne 4 : un seul artiste joue tous les personnages, avec seulement deux accessoires (ligne 2). La ligne 5 en tire la conséquence avec だから. Rien ne dit que la langue est ancienne ni que la salle est sombre, et le 落ち (ligne 6) est ce qui fait rire.',
      'À la ligne 6, そこ renvoie, dans la même phrase, à 話の最後の「落ち」 : la fin de l’histoire, là où tout le monde rit. C’est un moment de l’histoire, pas un lieu comme la salle ou le coussin.',
    ],
  },
  'tea-ceremony': {
    theme: 'La cérémonie du thé',
    summary:
      'Chaque geste dans un pavillon de thé a sa forme, mais l’essentiel est l’attention portée à l’invité.',
    sentences: [
      'La cérémonie du thé est un art japonais qui consiste à préparer du matcha selon des formes établies et à le servir aux invités.',
      'Un pavillon de thé est généralement petit et calme, avec une seule fleur de saison exposée.',
      'Les invités mangent d’abord une pâtisserie japonaise, puis boivent le thé.',
      'Quand on reçoit le bol, l’usage veut qu’on le tourne un peu pour éviter sa face avant, puis qu’on boive.',
      'La première fois que j’ai essayé, je suis resté à genoux tout le temps et mes jambes ont commencé à me faire mal.',
      'La professeure m’a dit : « Les formes comptent, mais le plus important, c’est l’attention portée à l’invité. »',
      'Elle a expliqué que chaque forme de la cérémonie du thé est née du souci de l’invité.',
    ],
    questions: [
      'Ligne 3 : まず和菓子を食べてからまっちゃを飲む. Un 和菓子 est une douceur japonaise : les invités mangent donc d’abord quelque chose de sucré. La fleur est déjà exposée dans la pièce (ligne 2).',
      'Ligne 4 : 正面を避けるために, on tourne le bol pour ne pas boire par sa face avant. La douceur se mange avant le thé (ligne 3), et rien ne relie ce geste à la fleur ni à la quantité de thé.',
      'Ligne 5 : ずっと正座をしていたので、足が痛くなってしまった, rester à genoux tout le temps a fait mal aux jambes de l’auteur. Le texte ne parle ni de thé trop amer, ni de bol tombé, ni de formes toutes apprises.',
      'Ligne 6 : 一番大切なのは客を思う心だ, le plus important est l’attention portée à l’invité. La professeure dit que les formes comptent aussi, mais place l’invité en premier ; la fleur (ligne 2) fait partie de la pièce, ce n’est pas l’essentiel.',
    ],
  },
};
