/** Dialogues for guessing from what one sees or knows: 〜ようだ, 〜みたいだ and 〜はずだ. */
import type { GrammarDialogues } from './types.ts';

export const CONJECTURE_DIALOGUES: readonly GrammarDialogues[] = [
  {
    grammarId: 'you-da',
    compare: 'mitai',
    dialogues: [
      {
        id: 'you-da-meeting-room',
        setting: 'work',
        register: 'polite',
        speakers: ['佐藤', 'リン'],
        lines: [
          {
            by: 0,
            ja: 'リンさん、会議室の電気が消えていますね。',
            tr: {
              en: 'Lin, the lights in the meeting room are off.',
              fr: 'Lin, la lumière est éteinte dans la salle de réunion.',
              es: 'Lin, la luz de la sala de reuniones está apagada.',
            },
          },
          {
            by: 1,
            ja: 'ええ。会議はもう終わったようですね。',
            focus: 'ようです',
            tr: {
              en: 'Yes. It seems the meeting has already finished.',
              fr: 'Oui. On dirait que la réunion est déjà finie.',
              es: 'Sí. Parece que la reunión ya ha terminado.',
            },
          },
          {
            by: 0,
            ja: 'じゃあ、部長に聞いてみましょう。',
            tr: {
              en: 'Then let’s ask the manager.',
              fr: 'Alors demandons au directeur.',
              es: 'Entonces preguntémosle al director.',
            },
          },
        ],
        blank: {
          line: 1,
          distractors: ['そうです', 'つもりです', 'ばかりです'],
          why: {
            en: 'Lin is judging from what she sees (the lights are off), so ようです: it seems. そうです after a past form would mean someone told her.',
            fr: 'Lin juge d’après ce qu’elle voit (la lumière est éteinte), donc ようです : on dirait. そうです après une forme passée voudrait dire qu’on le lui a dit.',
            es: 'Lin juzga por lo que ve (la luz está apagada), así que ようです: parece. そうです tras una forma en pasado significaría que se lo han dicho.',
          },
        },
      },
      {
        id: 'you-da-fever',
        setting: 'school',
        register: 'polite',
        speakers: ['森', 'アンナ'],
        lines: [
          {
            by: 0,
            ja: 'アンナさん、顔が赤いですね。熱があるようですね。',
            focus: 'ようです',
            tr: {
              en: 'Anna, your face is red. You seem to have a fever.',
              fr: 'Anna, vous êtes toute rouge. On dirait que vous avez de la fièvre.',
              es: 'Anna, tiene la cara roja. Parece que tiene fiebre.',
            },
          },
          {
            by: 1,
            ja: 'はい、少し頭も痛いです。',
            tr: {
              en: 'Yes, my head hurts a little too.',
              fr: 'Oui, j’ai aussi un peu mal à la tête.',
              es: 'Sí, también me duele un poco la cabeza.',
            },
          },
          {
            by: 0,
            ja: '今日は早く帰ったほうがいいですよ。',
            tr: {
              en: 'You’d better go home early today.',
              fr: 'Vous feriez mieux de rentrer tôt aujourd’hui.',
              es: 'Será mejor que hoy se vaya pronto a casa.',
            },
          },
        ],
        blank: {
          line: 0,
          distractors: ['そうです', 'つもりです', 'ところです'],
          why: {
            en: 'Ms Mori sees Anna’s red face (顔が赤い) and draws a conclusion, so ようです. そうです after the plain form would pass on what someone said.',
            fr: 'Mme Mori voit le visage rouge d’Anna (顔が赤い) et en tire une conclusion, donc ようです. そうです après la forme neutre rapporterait ce qu’on a dit.',
            es: 'La profesora Mori ve la cara roja de Anna (顔が赤い) y saca una conclusión, así que ようです. そうです tras la forma simple transmitiría lo que alguien dijo.',
          },
        },
      },
    ],
  },
  {
    grammarId: 'mitai',
    compare: 'you-da',
    dialogues: [
      {
        id: 'mitai-umbrellas',
        setting: 'friends',
        register: 'plain',
        speakers: ['ユキ', 'ケン'],
        lines: [
          {
            by: 0,
            ja: '外の人、みんな傘をさしてるね。',
            tr: {
              en: 'Everyone outside has an umbrella up.',
              fr: 'Dehors, tout le monde a ouvert son parapluie.',
              es: 'Toda la gente de fuera lleva el paraguas abierto.',
            },
          },
          {
            by: 1,
            ja: '本当だ。雨が降ってるみたいだね。',
            focus: 'みたい',
            tr: {
              en: 'You’re right. It looks like it’s raining.',
              fr: 'C’est vrai. On dirait qu’il pleut.',
              es: 'Es verdad. Parece que está lloviendo.',
            },
          },
          {
            by: 0,
            ja: 'あ、洗濯物を入れなきゃ！',
            tr: {
              en: 'Oh, I need to bring the washing in!',
              fr: 'Ah, il faut que je rentre le linge !',
              es: '¡Ay, tengo que recoger la ropa!',
            },
          },
        ],
        blank: {
          line: 1,
          distractors: ['そう', 'つもり', 'はず'],
          why: {
            en: 'Ken can’t see the rain, but he sees the umbrellas and guesses from them: みたい. そう here would mean someone told him.',
            fr: 'Ken ne voit pas la pluie, mais il voit les parapluies et en déduit : みたい. そう voudrait dire ici qu’on le lui a dit.',
            es: 'Ken no ve la lluvia, pero ve los paraguas y lo deduce: みたい. そう aquí significaría que alguien se lo ha dicho.',
          },
        },
      },
      {
        id: 'mitai-bear',
        setting: 'friends',
        register: 'plain',
        speakers: ['ミカ', 'ダニエル'],
        lines: [
          {
            by: 0,
            ja: '見て、あの犬！',
            tr: {
              en: 'Look at that dog!',
              fr: 'Regarde ce chien !',
              es: '¡Mira ese perro!',
            },
          },
          {
            by: 1,
            ja: 'わあ、大きいね。まるでくまみたいだ。',
            focus: 'みたいだ',
            tr: {
              en: 'Wow, it’s big. It’s just like a bear.',
              fr: 'Oh, qu’il est grand. On dirait un ours.',
              es: '¡Qué grande! Parece un oso.',
            },
          },
          {
            by: 0,
            ja: '本当。でも、顔はかわいいね。',
            tr: {
              en: 'It really is. But its face is cute.',
              fr: 'C’est vrai. Mais il a une bonne tête.',
              es: 'Es verdad. Pero tiene una cara muy mona.',
            },
          },
        ],
        blank: {
          line: 1,
          distractors: ['らしい', 'そうだ', 'だそうだ'],
          why: {
            en: 'まるで (just like) asks for a comparison, and みたいだ after a noun gives one: like a bear. くまらしい would mean typical of a bear, and だそうだ that someone said so.',
            fr: 'まるで (exactement comme) appelle une comparaison, et みたいだ après un nom la donne : comme un ours. くまらしい voudrait dire typique d’un ours, et だそうだ que quelqu’un l’a dit.',
            es: 'まるで (igual que) pide una comparación, y みたいだ tras un sustantivo la da: como un oso. くまらしい significaría típico de un oso, y だそうだ que alguien lo ha dicho.',
          },
        },
      },
    ],
  },
  {
    grammarId: 'hazu',
    compare: 'darou',
    dialogues: [
      {
        id: 'hazu-train',
        setting: 'family',
        register: 'plain',
        speakers: ['ハナ', 'ケイ'],
        lines: [
          {
            by: 0,
            ja: 'お父さん、遅いね。',
            tr: {
              en: 'Dad’s late, isn’t he?',
              fr: 'Papa est en retard, non ?',
              es: 'Papá tarda, ¿no?',
            },
          },
          {
            by: 1,
            ja: '六時の電車に乗ったって言ってたから、もうすぐ着くはずだよ。',
            focus: 'はずだ',
            tr: {
              en: 'He said he got on the six o’clock train, so he should be here soon.',
              fr: 'Il a dit qu’il avait pris le train de six heures, donc il devrait bientôt arriver.',
              es: 'Dijo que había cogido el tren de las seis, así que debería llegar pronto.',
            },
          },
          {
            by: 0,
            ja: 'じゃあ、ごはんの準備をしよう。',
            tr: {
              en: 'Then let’s get dinner ready.',
              fr: 'Alors préparons le dîner.',
              es: 'Entonces vamos a preparar la cena.',
            },
          },
        ],
        blank: {
          line: 1,
          distractors: ['つもりだ', 'ことにした', 'ようにした'],
          why: {
            en: 'Kei reasons from a fact (he took the six o’clock train), so はずだ: he should arrive soon. つもりだ would state Dad’s own intention, which Kei can’t speak for.',
            fr: 'Kei raisonne à partir d’un fait (il a pris le train de six heures), donc はずだ : il devrait bientôt arriver. つもりだ exprimerait l’intention de papa lui-même, que Kei ne peut pas affirmer.',
            es: 'Kei razona a partir de un hecho (cogió el tren de las seis), así que はずだ: debería llegar pronto. つもりだ expresaría la intención del propio padre, de la que Kei no puede hablar.',
          },
        },
      },
      {
        id: 'hazu-colleague',
        setting: 'work',
        register: 'polite',
        speakers: ['リン', '佐藤'],
        lines: [
          {
            by: 0,
            ja: '鈴木さんはまだですか。',
            tr: {
              en: 'Isn’t Ms Suzuki here yet?',
              fr: 'Mme Suzuki n’est pas encore là ?',
              es: '¿Todavía no ha llegado la señora Suzuki?',
            },
          },
          {
            by: 1,
            ja: 'おかしいですね。今日は九時に来るはずなんですが。',
            focus: 'はず',
            tr: {
              en: 'That’s strange. She should be in at nine today.',
              fr: 'C’est bizarre. Elle devait arriver à neuf heures aujourd’hui.',
              es: 'Qué raro. Hoy tenía que venir a las nueve.',
            },
          },
          {
            by: 0,
            ja: 'ちょっと電話してみましょうか。',
            tr: {
              en: 'Shall I give her a call?',
              fr: 'Je l’appelle ?',
              es: '¿La llamo?',
            },
          },
        ],
        blank: {
          line: 1,
          distractors: ['つもり', 'ところ', 'ばかり'],
          why: {
            en: 'おかしいですね (that’s strange) shows Mr Sato expected her by now, so はず: she is supposed to come at nine. つもり would be her own intention, and ところ that she is just about to come.',
            fr: 'おかしいですね (c’est bizarre) montre que M. Sato l’attendait déjà, donc はず : elle est censée venir à neuf heures. つもり serait sa propre intention à elle, et ところ qu’elle est sur le point d’arriver.',
            es: 'おかしいですね (qué raro) muestra que el señor Sato ya la esperaba, así que はず: se supone que viene a las nueve. つもり sería su propia intención, y ところ que está a punto de llegar.',
          },
        },
      },
    ],
  },
];
