/** Dialogues for effort, change and plans: 〜ようにする, 〜ようになる and 〜つもりだ. */
import type { GrammarDialogues } from './types.ts';

export const INTENTION_DIALOGUES: readonly GrammarDialogues[] = [
  {
    grammarId: 'you-ni-suru',
    compare: 'you-ni-naru',
    dialogues: [
      {
        id: 'you-ni-suru-vegetables',
        setting: 'friends',
        register: 'plain',
        speakers: ['ミカ', 'ダニエル'],
        lines: [
          {
            by: 0,
            ja: 'ダニエル、最近元気そうだね。',
            tr: {
              en: 'Daniel, you’ve been looking well lately.',
              fr: 'Daniel, tu as l’air en forme ces temps-ci.',
              es: 'Daniel, se te ve muy bien últimamente.',
            },
          },
          {
            by: 1,
            ja: 'うん。できるだけ毎日野菜を食べるようにしているんだ。',
            focus: 'ようにしている',
            tr: {
              en: 'Yeah. I try to eat vegetables every day, as much as I can.',
              fr: 'Oui. J’essaie de manger des légumes tous les jours, autant que possible.',
              es: 'Sí. Intento comer verdura todos los días, en lo posible.',
            },
          },
          {
            by: 0,
            ja: 'すごいね。私はすぐ忘れちゃう。',
            tr: {
              en: 'Good for you. I always forget.',
              fr: 'Bravo. Moi, j’oublie tout de suite.',
              es: 'Qué bien. Yo enseguida me olvido.',
            },
          },
        ],
        blank: {
          line: 1,
          distractors: ['ようになった', 'ことになった', 'ことがある'],
          why: {
            en: 'できるだけ (as much as I can) shows a conscious effort, so ようにしている. ようになった would describe a change that came by itself.',
            fr: 'できるだけ (autant que possible) montre un effort voulu, donc ようにしている. ようになった décrirait un changement venu tout seul.',
            es: 'できるだけ (en lo posible) indica un esfuerzo consciente, así que ようにしている. ようになった describiría un cambio que llegó solo.',
          },
        },
      },
      {
        id: 'you-ni-suru-sleep',
        setting: 'work',
        register: 'polite',
        speakers: ['木村', 'ジョン'],
        lines: [
          {
            by: 0,
            ja: 'ジョンさん、最近、朝はいつも元気ですね。',
            tr: {
              en: 'John, you’re always so lively in the mornings lately.',
              fr: 'John, ces temps-ci vous êtes toujours en forme le matin.',
              es: 'John, últimamente siempre está con energía por las mañanas.',
            },
          },
          {
            by: 1,
            ja: 'ありがとうございます。夜はなるべく早く寝るようにしています。',
            focus: 'ようにしています',
            tr: {
              en: 'Thank you. I make a point of going to bed early, as far as I can.',
              fr: 'Merci. Le soir, je m’efforce de me coucher tôt, autant que possible.',
              es: 'Gracias. Por la noche procuro acostarme pronto, en la medida de lo posible.',
            },
          },
          {
            by: 0,
            ja: 'それはいいですね。私もやってみます。',
            tr: {
              en: 'That’s good. I’ll try it too.',
              fr: 'C’est bien. Je vais essayer aussi.',
              es: 'Muy bien. Yo también lo voy a probar.',
            },
          },
        ],
        blank: {
          line: 1,
          distractors: ['ようになりました', 'ことになりました', 'つもりでした'],
          why: {
            en: 'なるべく (as far as possible) goes with an effort the speaker keeps up, so ようにしています. ようになりました is a change, and つもりでした a plan that may not have happened.',
            fr: 'なるべく (dans la mesure du possible) accompagne un effort que l’on entretient, donc ようにしています. ようになりました est un changement, et つもりでした une intention qui ne s’est peut-être pas réalisée.',
            es: 'なるべく (en la medida de lo posible) acompaña un esfuerzo que se mantiene, así que ようにしています. ようになりました es un cambio, y つもりでした una intención que quizá no se cumplió.',
          },
        },
      },
    ],
  },
  {
    grammarId: 'you-ni-naru',
    compare: 'you-ni-suru',
    dialogues: [
      {
        id: 'you-ni-naru-swim',
        setting: 'friends',
        register: 'plain',
        speakers: ['サラ', 'タク'],
        lines: [
          {
            by: 0,
            ja: '夏休み、海で泳いだの？',
            tr: {
              en: 'Did you swim in the sea over the summer holidays?',
              fr: 'Tu as nagé dans la mer pendant les vacances ?',
              es: '¿Nadaste en el mar en las vacaciones de verano?',
            },
          },
          {
            by: 1,
            ja: 'うん。去年は全然泳げなかったけど、今は百メートル泳げるようになったよ。',
            focus: 'ようになった',
            tr: {
              en: 'Yeah. Last year I couldn’t swim at all, but now I can swim a hundred metres.',
              fr: 'Oui. L’an dernier je ne savais pas nager du tout, mais maintenant j’arrive à nager cent mètres.',
              es: 'Sí. El año pasado no sabía nadar nada, pero ahora ya puedo nadar cien metros.',
            },
          },
          {
            by: 0,
            ja: 'すごい！がんばったね。',
            tr: {
              en: 'Amazing! You worked hard.',
              fr: 'Génial ! Tu as bien travaillé.',
              es: '¡Genial! Te has esforzado.',
            },
          },
        ],
        blank: {
          line: 1,
          distractors: ['ようにした', 'ことにした', 'ことになった'],
          why: {
            en: 'Last year he couldn’t, now he can (去年は…今は): that is a change, so ようになった. ようにした would be an effort to make something happen, not the result.',
            fr: 'L’an dernier il ne pouvait pas, maintenant il peut (去年は…今は) : c’est un changement, donc ようになった. ようにした serait un effort pour que quelque chose arrive, pas le résultat.',
            es: 'El año pasado no podía y ahora sí (去年は…今は): es un cambio, así que ようになった. ようにした sería un esfuerzo para que algo ocurra, no el resultado.',
          },
        },
      },
      {
        id: 'you-ni-naru-newspaper',
        setting: 'school',
        register: 'polite',
        speakers: ['森', 'アンナ'],
        lines: [
          {
            by: 0,
            ja: 'アンナさん、日本に来てどのぐらいですか。',
            tr: {
              en: 'Anna, how long have you been in Japan?',
              fr: 'Anna, depuis combien de temps êtes-vous au Japon ?',
              es: 'Anna, ¿cuánto tiempo lleva en Japón?',
            },
          },
          {
            by: 1,
            ja: '一年です。最初は全然読めませんでしたが、今は新聞が少し読めるようになりました。',
            focus: 'ようになりました',
            tr: {
              en: 'A year. At first I couldn’t read anything, but now I can read a newspaper a little.',
              fr: 'Un an. Au début je ne savais rien lire, mais maintenant j’arrive un peu à lire le journal.',
              es: 'Un año. Al principio no sabía leer nada, pero ahora ya puedo leer un poco el periódico.',
            },
          },
          {
            by: 0,
            ja: 'よくがんばりましたね。',
            tr: {
              en: 'You’ve worked really hard.',
              fr: 'Vous avez fait beaucoup d’efforts.',
              es: 'Se ha esforzado mucho.',
            },
          },
        ],
        blank: {
          line: 1,
          distractors: ['ようにしました', 'ことにしました', 'ことになりました'],
          why: {
            en: '最初は…今は (at first… now) describes how her reading changed over a year, so ようになりました. ことにしました and ようにしました are about choices and efforts, not a new ability.',
            fr: '最初は…今は (au début… maintenant) décrit comment sa lecture a changé en un an, donc ようになりました. ことにしました et ようにしました parlent de choix et d’efforts, pas d’une nouvelle capacité.',
            es: '最初は…今は (al principio… ahora) describe cómo cambió su lectura en un año, así que ようになりました. ことにしました y ようにしました hablan de decisiones y esfuerzos, no de una nueva capacidad.',
          },
        },
      },
      {
        id: 'you-ni-naru-natto',
        setting: 'family',
        register: 'plain',
        speakers: ['ハナ', 'ケイ'],
        lines: [
          {
            by: 0,
            ja: 'あれ、なっとう食べてる！嫌いじゃなかった？',
            tr: {
              en: 'Hey, you’re eating natto! Didn’t you hate it?',
              fr: 'Tiens, tu manges du nattō ! Tu ne détestais pas ça ?',
              es: '¡Anda, estás comiendo natto! ¿No lo odiabas?',
            },
          },
          {
            by: 1,
            ja: '前は嫌いだったけど、だんだん食べられるようになったんだ。',
            focus: 'ようになった',
            tr: {
              en: 'I used to hate it, but little by little I’ve got so I can eat it.',
              fr: 'Avant je détestais, mais petit à petit j’ai fini par pouvoir en manger.',
              es: 'Antes lo odiaba, pero poco a poco he llegado a poder comerlo.',
            },
          },
          {
            by: 0,
            ja: 'へえ、変わったね。',
            tr: {
              en: 'Wow, you’ve changed.',
              fr: 'Eh bien, tu as changé.',
              es: 'Vaya, cómo has cambiado.',
            },
          },
        ],
        blank: {
          line: 1,
          distractors: ['ようにした', 'ことにした', 'ことになった'],
          why: {
            en: 'だんだん (little by little) and the dislike before show a change over time, so ようになった. ことにした would be a decision, not something that came gradually.',
            fr: 'だんだん (petit à petit) et le dégoût d’avant montrent un changement dans le temps, donc ようになった. ことにした serait une décision, pas quelque chose de progressif.',
            es: 'だんだん (poco a poco) y el rechazo de antes muestran un cambio con el tiempo, así que ようになった. ことにした sería una decisión, no algo que llegó poco a poco.',
          },
        },
      },
    ],
  },
  {
    grammarId: 'tsumori',
    compare: 'yotei',
    dialogues: [
      {
        id: 'tsumori-weekend',
        setting: 'friends',
        register: 'plain',
        speakers: ['ユキ', 'ケン'],
        lines: [
          {
            by: 0,
            ja: '週末、何するの？',
            tr: {
              en: 'What are you doing this weekend?',
              fr: 'Tu fais quoi ce week-end ?',
              es: '¿Qué haces este fin de semana?',
            },
          },
          {
            by: 1,
            ja: 'まだはっきり決めてないけど、映画を見に行くつもりだよ。',
            focus: 'つもりだ',
            tr: {
              en: 'I haven’t really decided yet, but I’m thinking of going to see a film.',
              fr: 'Je n’ai pas encore vraiment décidé, mais j’ai l’intention d’aller voir un film.',
              es: 'Todavía no lo tengo claro, pero pienso ir a ver una película.',
            },
          },
          {
            by: 0,
            ja: 'いいね。私も行きたい！',
            tr: {
              en: 'Nice. I want to come too!',
              fr: 'Sympa. Je veux venir aussi !',
              es: '¡Qué bien! ¡Yo también quiero ir!',
            },
          },
        ],
        blank: {
          line: 1,
          distractors: ['ことにした', '予定だ', 'ところだ'],
          why: {
            en: 'Ken hasn’t decided yet (まだはっきり決めてない), so it is only an intention: つもりだ. ことにした is a decision already made, 予定だ a fixed plan, and ところだ means he is about to go right now.',
            fr: 'Ken n’a pas encore décidé (まだはっきり決めてない) : ce n’est qu’une intention, donc つもりだ. ことにした est une décision prise, 予定だ un projet fixé, et ところだ voudrait dire qu’il y va à l’instant.',
            es: 'Ken aún no lo ha decidido (まだはっきり決めてない): es solo una intención, así que つもりだ. ことにした es una decisión tomada, 予定だ un plan fijo, y ところだ significaría que va a ir ahora mismo.',
          },
        },
      },
      {
        id: 'tsumori-exam',
        setting: 'work',
        register: 'polite',
        speakers: ['佐藤', 'マリア'],
        lines: [
          {
            by: 0,
            ja: 'マリアさん、仕事のあとで何かしていますか。',
            tr: {
              en: 'Maria, do you do anything after work?',
              fr: 'Maria, vous faites quelque chose après le travail ?',
              es: 'Maria, ¿hace algo después del trabajo?',
            },
          },
          {
            by: 1,
            ja: 'はい。来年、日本語の試験を受けるつもりなので、毎晩勉強しています。',
            focus: 'つもり',
            tr: {
              en: 'Yes. I plan to take a Japanese exam next year, so I study every evening.',
              fr: 'Oui. J’ai l’intention de passer un examen de japonais l’an prochain, alors j’étudie tous les soirs.',
              es: 'Sí. Tengo intención de presentarme a un examen de japonés el año que viene, así que estudio todas las noches.',
            },
          },
          {
            by: 0,
            ja: 'そうですか。がんばってください。',
            tr: {
              en: 'I see. Good luck.',
              fr: 'Ah bon. Bon courage.',
              es: 'Ya veo. ¡Mucho ánimo!',
            },
          },
        ],
        blank: {
          line: 1,
          distractors: ['ところ', 'ことがある', 'そう'],
          why: {
            en: 'Maria is talking about her own plan for next year, so つもり. ところ means just about to, ことがある something that happens sometimes, and そう passes on what someone said.',
            fr: 'Maria parle de son propre projet pour l’an prochain, donc つもり. ところ veut dire sur le point de, ことがある quelque chose qui arrive parfois, et そう rapporte ce qu’on a entendu.',
            es: 'Maria habla de su propio plan para el año que viene, así que つもり. ところ significa a punto de, ことがある algo que pasa a veces, y そう transmite lo que se ha oído.',
          },
        },
      },
    ],
  },
];
