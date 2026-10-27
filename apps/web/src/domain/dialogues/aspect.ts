/** Dialogues for when and how an action happens: 〜たばかり, 〜ところだ, 〜てしまう and 〜ておく. */
import type { GrammarDialogues } from './types.ts';

export const ASPECT_DIALOGUES: readonly GrammarDialogues[] = [
  {
    grammarId: 'ta-bakari',
    compare: 'ta-tokoro',
    dialogues: [
      {
        id: 'ta-bakari-phone',
        setting: 'friends',
        register: 'plain',
        speakers: ['ユキ', 'ケン'],
        lines: [
          {
            by: 0,
            ja: 'そのスマホ、新しいね。',
            tr: {
              en: 'That phone’s new, isn’t it?',
              fr: 'Ton téléphone est neuf, non ?',
              es: 'Ese móvil es nuevo, ¿no?',
            },
          },
          {
            by: 1,
            ja: 'うん、先週買ったばかりなんだ。でも、もう落としちゃった。',
            focus: 'ばかり',
            tr: {
              en: 'Yeah, I only bought it last week. But I’ve already dropped it.',
              fr: 'Oui, je l’ai acheté la semaine dernière. Mais je l’ai déjà fait tomber.',
              es: 'Sí, lo compré la semana pasada. Pero ya se me ha caído.',
            },
          },
          {
            by: 0,
            ja: 'えー、大丈夫？',
            tr: {
              en: 'Oh no, is it OK?',
              fr: 'Oh non, il n’a rien ?',
              es: '¡Vaya! ¿Está bien?',
            },
          },
        ],
        blank: {
          line: 1,
          distractors: ['ところ', 'はず', 'つもり'],
          why: {
            en: 'A week ago still feels recent to Ken (先週), so ばかり: he has only just bought it. ところ is for the moment right after, not a week later.',
            fr: 'Une semaine, c’est encore récent pour Ken (先週), donc ばかり : il vient tout juste de l’acheter. ところ s’emploie juste après le moment, pas une semaine plus tard.',
            es: 'Para Ken una semana todavía es reciente (先週), así que ばかり: lo acaba de comprar. ところ se usa justo después del momento, no una semana más tarde.',
          },
        },
      },
      {
        id: 'ta-bakari-new-life',
        setting: 'work',
        register: 'polite',
        speakers: ['田中', 'エマ'],
        lines: [
          {
            by: 0,
            ja: 'エマさん、日本の生活はどうですか。',
            tr: {
              en: 'Emma, how is life in Japan?',
              fr: 'Emma, comment se passe la vie au Japon ?',
              es: 'Emma, ¿qué tal la vida en Japón?',
            },
          },
          {
            by: 1,
            ja: '三か月前に来たばかりなので、まだわからないことが多いです。',
            focus: 'ばかり',
            tr: {
              en: 'I only came three months ago, so there’s still a lot I don’t understand.',
              fr: 'Je suis arrivée il y a seulement trois mois, alors il y a encore beaucoup de choses que je ne comprends pas.',
              es: 'Llegué hace solo tres meses, así que todavía hay muchas cosas que no entiendo.',
            },
          },
          {
            by: 0,
            ja: '困ったときは、いつでも聞いてくださいね。',
            tr: {
              en: 'Whenever you’re stuck, just ask me.',
              fr: 'Si vous avez un souci, demandez-moi quand vous voulez.',
              es: 'Cuando tenga algún problema, pregúnteme cuando quiera.',
            },
          },
        ],
        blank: {
          line: 1,
          distractors: ['ところ', 'はず', 'そう'],
          why: {
            en: 'Three months ago (三か月前) still feels recent to Emma, so ばかり. ところ only fits right after something happens, and そう would mean she heard it from someone.',
            fr: 'Trois mois (三か月前), c’est encore récent pour Emma, donc ばかり. ところ ne va que juste après un fait, et そう voudrait dire qu’elle l’a entendu de quelqu’un.',
            es: 'Para Emma, hace tres meses (三か月前) todavía es reciente, así que ばかり. ところ solo encaja justo después de que algo pase, y そう significaría que se lo han contado.',
          },
        },
      },
    ],
  },
  {
    grammarId: 'tokoro-da',
    compare: 'ta-bakari',
    dialogues: [
      {
        id: 'tokoro-da-lift',
        setting: 'family',
        register: 'plain',
        speakers: ['ハナ', 'ケイ'],
        lines: [
          {
            by: 0,
            ja: 'もしもし、ごはんできたよ。今どこ？',
            tr: {
              en: 'Hello? Dinner’s ready. Where are you?',
              fr: 'Allô ? Le dîner est prêt. Tu es où ?',
              es: '¿Hola? La cena está lista. ¿Dónde estás?',
            },
          },
          {
            by: 1,
            ja: 'ちょうど会社を出るところだよ。今、エレベーターを待ってる。',
            focus: '出るところ',
            tr: {
              en: 'I’m just about to leave the office. I’m waiting for the lift now.',
              fr: 'Je suis sur le point de quitter le bureau. J’attends l’ascenseur.',
              es: 'Estoy a punto de salir de la oficina. Ahora estoy esperando el ascensor.',
            },
          },
          {
            by: 0,
            ja: 'わかった。じゃあ、先に食べてるね。',
            tr: {
              en: 'OK. Then I’ll start eating.',
              fr: 'D’accord. Alors je commence à manger.',
              es: 'Vale. Pues voy empezando a comer.',
            },
          },
        ],
        blank: {
          line: 1,
          distractors: ['出たところ', '出たばかり', '出ているところ'],
          why: {
            en: 'Kei is still waiting for the lift (エレベーターを待ってる), so he hasn’t left yet: the dictionary form + ところ, about to leave. 出たところ and 出たばかり would mean he has already left.',
            fr: 'Kei attend encore l’ascenseur (エレベーターを待ってる) : il n’est pas encore parti, donc forme du dictionnaire + ところ, sur le point de partir. 出たところ et 出たばかり voudraient dire qu’il est déjà sorti.',
            es: 'Kei todavía espera el ascensor (エレベーターを待ってる): aún no ha salido, así que forma de diccionario + ところ, a punto de salir. 出たところ y 出たばかり significarían que ya ha salido.',
          },
        },
      },
      {
        id: 'tokoro-da-busy',
        setting: 'work',
        register: 'polite',
        speakers: ['佐藤', 'リン'],
        lines: [
          {
            by: 0,
            ja: 'リンさん、ちょっといいですか。',
            tr: {
              en: 'Lin, have you got a minute?',
              fr: 'Lin, vous avez une minute ?',
              es: 'Lin, ¿tiene un momento?',
            },
          },
          {
            by: 1,
            ja: 'すみません、今お客さんと話しているところです。十分後でもいいですか。',
            focus: '話しているところ',
            tr: {
              en: 'Sorry, I’m in the middle of talking with a customer. Could it be in ten minutes?',
              fr: 'Désolée, je suis en train de parler avec un client. Ça peut attendre dix minutes ?',
              es: 'Perdone, ahora estoy hablando con un cliente. ¿Puede ser dentro de diez minutos?',
            },
          },
          {
            by: 0,
            ja: 'もちろんです。じゃあ、またあとで来ます。',
            tr: {
              en: 'Of course. I’ll come back later, then.',
              fr: 'Bien sûr. Je repasserai plus tard.',
              es: 'Claro. Entonces vuelvo luego.',
            },
          },
        ],
        blank: {
          line: 1,
          distractors: ['話すところ', '話したところ', '話したばかり'],
          why: {
            en: 'Lin is busy right now (今), in the middle of the conversation, so ているところ. 話すところ would mean about to start, and 話したところ that she has just finished.',
            fr: 'Lin est occupée en ce moment (今), en pleine conversation, donc ているところ. 話すところ voudrait dire sur le point de commencer, et 話したところ qu’elle vient de finir.',
            es: 'Lin está ocupada ahora mismo (今), en plena conversación, así que ているところ. 話すところ significaría a punto de empezar, y 話したところ que acaba de terminar.',
          },
        },
      },
    ],
  },
  {
    grammarId: 'te-shimau',
    compare: 'te-oku',
    dialogues: [
      {
        id: 'te-shimau-cake',
        setting: 'friends',
        register: 'plain',
        speakers: ['ユキ', 'ケン'],
        lines: [
          {
            by: 0,
            ja: 'ねえ、冷蔵庫のケーキ、知らない？',
            tr: {
              en: 'Hey, do you know what happened to the cake in the fridge?',
              fr: 'Dis, tu ne sais pas où est passé le gâteau du frigo ?',
              es: 'Oye, ¿sabes qué pasó con la tarta de la nevera?',
            },
          },
          {
            by: 1,
            ja: 'ごめん、おなかがすいていて、全部食べてしまった。',
            focus: '食べてしまった',
            tr: {
              en: 'Sorry, I was hungry and ended up eating it all.',
              fr: 'Pardon, j’avais faim et je l’ai mangé en entier.',
              es: 'Perdona, tenía hambre y me la comí entera.',
            },
          },
          {
            by: 0,
            ja: 'えー！明日、友だちと食べるつもりだったのに。',
            tr: {
              en: 'What! I was going to eat it with a friend tomorrow.',
              fr: 'Quoi ! Je comptais le manger demain avec une amie.',
              es: '¡¿Qué?! Pensaba comérmela mañana con una amiga.',
            },
          },
        ],
        blank: {
          line: 1,
          distractors: ['食べておいた', '食べてみた', '食べてあげた'],
          why: {
            en: 'Ken apologises (ごめん) and Yuki is upset: he did something he regrets, so てしまった. ておいた would be something done on purpose, to prepare.',
            fr: 'Ken s’excuse (ごめん) et Yuki est fâchée : il a fait quelque chose qu’il regrette, donc てしまった. ておいた serait une action faite exprès, pour préparer quelque chose.',
            es: 'Ken pide perdón (ごめん) y Yuki se enfada: hizo algo de lo que se arrepiente, así que てしまった. ておいた sería algo hecho a propósito, para preparar algo.',
          },
        },
      },
      {
        id: 'te-shimau-station',
        setting: 'work',
        register: 'polite',
        speakers: ['木村', 'ジョン'],
        lines: [
          {
            by: 0,
            ja: 'ジョンさん、三十分も遅れて、どうしたんですか。',
            tr: {
              en: 'John, you’re thirty minutes late. What happened?',
              fr: 'John, trente minutes de retard, qu’est-ce qui s’est passé ?',
              es: 'John, ha llegado treinta minutos tarde. ¿Qué ha pasado?',
            },
          },
          {
            by: 1,
            ja: 'すみません。電車で寝てしまって、降りる駅を過ぎました。',
            focus: '寝てしまって',
            tr: {
              en: 'I’m sorry. I fell asleep on the train and went past my stop.',
              fr: 'Je suis désolé. Je me suis endormi dans le train et j’ai raté mon arrêt.',
              es: 'Lo siento. Me quedé dormido en el tren y me pasé de estación.',
            },
          },
          {
            by: 0,
            ja: 'そうですか。次から気をつけてくださいね。',
            tr: {
              en: 'I see. Please be careful from now on.',
              fr: 'Je vois. Faites attention la prochaine fois.',
              es: 'Ya veo. Tenga cuidado a partir de ahora, ¿eh?',
            },
          },
        ],
        blank: {
          line: 1,
          distractors: ['寝ておいて', '寝てみて', '寝てから'],
          why: {
            en: 'John apologises (すみません) for something he didn’t mean to do, so てしまって: he fell asleep without wanting to. ておいて would mean he slept on purpose, to be ready.',
            fr: 'John s’excuse (すみません) pour une chose qu’il n’a pas voulue, donc てしまって : il s’est endormi sans le vouloir. ておいて voudrait dire qu’il a dormi exprès, pour être prêt.',
            es: 'John pide disculpas (すみません) por algo que no quería hacer, así que てしまって: se durmió sin querer. ておいて significaría que durmió a propósito, para estar listo.',
          },
        },
      },
    ],
  },
  {
    grammarId: 'te-oku',
    compare: 'te-aru',
    dialogues: [
      {
        id: 'te-oku-party',
        setting: 'friends',
        register: 'plain',
        speakers: ['ユキ', 'ケン'],
        lines: [
          {
            by: 0,
            ja: '明日のパーティー、何か手伝おうか。',
            tr: {
              en: 'Shall I help with something for tomorrow’s party?',
              fr: 'Je t’aide pour quelque chose pour la fête de demain ?',
              es: '¿Te ayudo con algo para la fiesta de mañana?',
            },
          },
          {
            by: 1,
            ja: 'ありがとう。じゃあ、今日のうちに飲み物を買っておいてくれる？',
            focus: '買っておいて',
            tr: {
              en: 'Thanks. Then could you buy the drinks today, so they’re ready?',
              fr: 'Merci. Alors tu peux acheter les boissons dès aujourd’hui, pour qu’elles soient prêtes ?',
              es: 'Gracias. Entonces, ¿puedes comprar hoy las bebidas, para tenerlas listas?',
            },
          },
          {
            by: 0,
            ja: 'いいよ。ジュースとお茶でいい？',
            tr: {
              en: 'Sure. Is juice and tea OK?',
              fr: 'D’accord. Du jus et du thé, ça te va ?',
              es: 'Vale. ¿Te parece bien zumo y té?',
            },
          },
        ],
        blank: {
          line: 1,
          distractors: ['買ってしまって', '買ってあって', '買ってみて'],
          why: {
            en: 'The drinks are bought today, before the party (今日のうちに), so ておいて: do it in advance. てしまって would sound like a regret, and てあって describes a state, not a request.',
            fr: 'Les boissons s’achètent aujourd’hui, avant la fête (今日のうちに), donc ておいて : le faire à l’avance. てしまって sonnerait comme un regret, et てあって décrit un état, pas une demande.',
            es: 'Las bebidas se compran hoy, antes de la fiesta (今日のうちに), así que ておいて: hacerlo con antelación. てしまって sonaría a arrepentimiento, y てあって describe un estado, no una petición.',
          },
        },
      },
      {
        id: 'te-oku-documents',
        setting: 'work',
        register: 'polite',
        speakers: ['木村', 'マリア'],
        lines: [
          {
            by: 0,
            ja: '明日の会議の資料は、もう準備できましたか。',
            tr: {
              en: 'Are the documents for tomorrow’s meeting ready yet?',
              fr: 'Les documents pour la réunion de demain sont prêts ?',
              es: '¿Ya están listos los documentos de la reunión de mañana?',
            },
          },
          {
            by: 1,
            ja: 'はい。昨日コピーして、会議室の机の上に置いておきました。',
            focus: '置いておきました',
            tr: {
              en: 'Yes. I copied them yesterday and left them on the table in the meeting room, ready.',
              fr: 'Oui. Je les ai photocopiés hier et je les ai posés à l’avance sur la table de la salle de réunion.',
              es: 'Sí. Los fotocopié ayer y los dejé preparados en la mesa de la sala de reuniones.',
            },
          },
          {
            by: 0,
            ja: 'ありがとう。早いですね。',
            tr: {
              en: 'Thank you. That was quick.',
              fr: 'Merci. C’était rapide.',
              es: 'Gracias. Qué rapidez.',
            },
          },
        ],
        blank: {
          line: 1,
          distractors: ['置いてしまいました', '置いてみました', '置いてあげました'],
          why: {
            en: 'Maria got the documents ready the day before the meeting, so ておきました: done in advance. てしまいました would sound like a mistake, and てあげました would make it a favour to her boss, which sounds rude.',
            fr: 'Maria a préparé les documents la veille de la réunion, donc ておきました : fait à l’avance. てしまいました sonnerait comme une erreur, et てあげました en ferait une faveur à son chef, ce qui serait impoli.',
            es: 'Maria preparó los documentos el día antes de la reunión, así que ておきました: hecho con antelación. てしまいました sonaría a error, y てあげました lo convertiría en un favor a su jefe, lo que suena descortés.',
          },
        },
      },
    ],
  },
];
