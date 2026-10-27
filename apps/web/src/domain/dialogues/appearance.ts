/** Dialogues for how things look and what one hears: 〜そうだ (様子), 〜そうだ (伝聞), 〜らしい. */
import type { GrammarDialogues } from './types.ts';

export const APPEARANCE_DIALOGUES: readonly GrammarDialogues[] = [
  {
    grammarId: 'sou-look',
    compare: 'sou-hearsay',
    dialogues: [
      {
        id: 'sou-look-rain',
        setting: 'friends',
        register: 'plain',
        speakers: ['ユキ', 'ケン'],
        lines: [
          {
            by: 0,
            ja: '見て、空がすごく暗い。雨が降りそうだよ。',
            focus: '降りそう',
            tr: {
              en: 'Look, the sky is really dark. It looks like it’s going to rain.',
              fr: 'Regarde, le ciel est très sombre. On dirait qu’il va pleuvoir.',
              es: 'Mira, el cielo está muy oscuro. Parece que va a llover.',
            },
          },
          {
            by: 1,
            ja: '本当だ。傘を持っていこう。',
            tr: {
              en: 'You’re right. Let’s take an umbrella.',
              fr: 'C’est vrai. Prenons un parapluie.',
              es: 'Es verdad. Llevemos paraguas.',
            },
          },
        ],
        blank: {
          line: 0,
          distractors: ['降るそう', '降ったそう', '降るつもり'],
          why: {
            en: 'Yuki is looking at the dark sky herself (見て), so the stem form 降りそう: it looks like it will rain. 降るそう, after the plain form, would pass on what she heard.',
            fr: 'Yuki regarde elle-même le ciel sombre (見て), donc la forme en radical 降りそう : on dirait qu’il va pleuvoir. 降るそう, après la forme neutre, rapporterait ce qu’elle a entendu.',
            es: 'Yuki mira ella misma el cielo oscuro (見て), así que la forma con la raíz 降りそう: parece que va a llover. 降るそう, tras la forma simple, transmitiría lo que ha oído.',
          },
        },
      },
      {
        id: 'sou-look-cake',
        setting: 'shop',
        register: 'polite',
        speakers: ['エマ', '高橋'],
        lines: [
          {
            by: 0,
            ja: 'わあ、このケーキ、おいしそうですね。',
            focus: 'おいしそう',
            tr: {
              en: 'Wow, this cake looks delicious.',
              fr: 'Oh, ce gâteau a l’air délicieux.',
              es: '¡Vaya, esta tarta tiene una pinta deliciosa!',
            },
          },
          {
            by: 1,
            ja: 'ありがとうございます。今朝焼いたばかりなんですよ。',
            tr: {
              en: 'Thank you. We baked it just this morning.',
              fr: 'Merci. Nous l’avons fait cuire ce matin même.',
              es: 'Gracias. La hemos horneado esta misma mañana.',
            },
          },
          {
            by: 0,
            ja: 'じゃあ、これを二つください。',
            tr: {
              en: 'Then I’ll take two of these, please.',
              fr: 'Alors j’en prends deux, s’il vous plaît.',
              es: 'Entonces, deme dos, por favor.',
            },
          },
        ],
        blank: {
          line: 0,
          distractors: ['おいしいそう', 'おいしかったそう', 'おいしいはず'],
          why: {
            en: 'Emma judges by what she sees in the shop (わあ、このケーキ), so おいしそう: it looks delicious. おいしいそう would mean someone told her it is.',
            fr: 'Emma juge d’après ce qu’elle voit en boutique (わあ、このケーキ), donc おいしそう : il a l’air délicieux. おいしいそう voudrait dire qu’on lui a dit qu’il l’est.',
            es: 'Emma juzga por lo que ve en la tienda (わあ、このケーキ), así que おいしそう: tiene buena pinta. おいしいそう significaría que alguien le ha dicho que lo está.',
          },
        },
      },
      {
        id: 'sou-look-sleepy',
        setting: 'work',
        register: 'polite',
        speakers: ['佐藤', 'マリア'],
        lines: [
          {
            by: 0,
            ja: 'マリアさん、眠そうですね。大丈夫ですか。',
            focus: '眠そう',
            tr: {
              en: 'Maria, you look sleepy. Are you all right?',
              fr: 'Maria, vous avez l’air d’avoir sommeil. Ça va ?',
              es: 'Maria, parece que tiene sueño. ¿Está bien?',
            },
          },
          {
            by: 1,
            ja: 'はい。昨日、遅くまで仕事をしていたので。',
            tr: {
              en: 'Yes. I was working late yesterday.',
              fr: 'Oui. Hier, j’ai travaillé tard.',
              es: 'Sí. Ayer estuve trabajando hasta tarde.',
            },
          },
          {
            by: 0,
            ja: '今日は早く帰ってくださいね。',
            tr: {
              en: 'Please go home early today.',
              fr: 'Rentrez tôt aujourd’hui.',
              es: 'Hoy váyase pronto a casa, ¿eh?',
            },
          },
        ],
        blank: {
          line: 0,
          distractors: ['眠いそう', '眠いはず', '眠いつもり'],
          why: {
            en: 'Mr Sato can see her face, so the stem form 眠そう: she looks sleepy. 眠いそう would mean he heard she is.',
            fr: 'M. Sato voit son visage, donc la forme en radical 眠そう : elle a l’air d’avoir sommeil. 眠いそう voudrait dire qu’on lui a dit qu’elle l’est.',
            es: 'El señor Sato le ve la cara, así que la forma con la raíz 眠そう: parece que tiene sueño. 眠いそう significaría que se lo han contado.',
          },
        },
      },
    ],
  },
  {
    grammarId: 'sou-hearsay',
    compare: 'sou-look',
    dialogues: [
      {
        id: 'sou-hearsay-picnic',
        setting: 'family',
        register: 'plain',
        speakers: ['ハナ', 'ケイ'],
        lines: [
          {
            by: 0,
            ja: '明日のピクニック、大丈夫かな。',
            tr: {
              en: 'I wonder if tomorrow’s picnic will be OK.',
              fr: 'Je me demande si le pique-nique de demain va tenir.',
              es: 'Me pregunto si podremos hacer el pícnic mañana.',
            },
          },
          {
            by: 1,
            ja: '天気予報によると、明日は雨が降るそうだよ。',
            focus: '降るそう',
            tr: {
              en: 'According to the forecast, it’s going to rain tomorrow.',
              fr: 'D’après la météo, il va pleuvoir demain.',
              es: 'Según el pronóstico, mañana va a llover.',
            },
          },
          {
            by: 0,
            ja: 'えー、残念。じゃあ、来週にしよう。',
            tr: {
              en: 'Oh no, what a shame. Let’s make it next week, then.',
              fr: 'Oh non, dommage. Alors faisons-le la semaine prochaine.',
              es: 'Vaya, qué pena. Pues lo dejamos para la semana que viene.',
            },
          },
        ],
        blank: {
          line: 1,
          distractors: ['降りそう', '降るつもり', '降ったばかり'],
          why: {
            en: 'The news comes from the forecast (天気予報によると), so the plain form + そう passes it on: 降るそう. 降りそう would be Kei’s own impression from looking at the sky.',
            fr: 'L’information vient de la météo (天気予報によると) : la forme neutre + そう la rapporte, 降るそう. 降りそう serait l’impression de Kei en regardant le ciel.',
            es: 'El dato viene del pronóstico (天気予報によると): la forma simple + そう lo transmite, 降るそう. 降りそう sería la impresión de Kei al mirar el cielo.',
          },
        },
      },
      {
        id: 'sou-hearsay-colleague',
        setting: 'work',
        register: 'polite',
        speakers: ['リン', '田中'],
        lines: [
          {
            by: 0,
            ja: '来週、新しい人が来るんですか。',
            tr: {
              en: 'Is someone new starting next week?',
              fr: 'Quelqu’un de nouveau arrive la semaine prochaine ?',
              es: '¿La semana que viene viene alguien nuevo?',
            },
          },
          {
            by: 1,
            ja: 'ええ。部長の話では、アメリカから来るそうですよ。',
            focus: '来るそう',
            tr: {
              en: 'Yes. According to the manager, they’re coming from America.',
              fr: 'Oui. D’après le directeur, cette personne vient des États-Unis.',
              es: 'Sí. Según el director, viene de Estados Unidos.',
            },
          },
          {
            by: 0,
            ja: 'へえ。英語で話してみたいです。',
            tr: {
              en: 'Oh! I’d like to try talking in English.',
              fr: 'Tiens ! J’aimerais essayer de parler anglais.',
              es: '¡Vaya! Me gustaría probar a hablar en inglés.',
            },
          },
        ],
        blank: {
          line: 1,
          distractors: ['来そう', '来るつもり', '来るところ'],
          why: {
            en: 'Mr Tanaka is repeating what the manager said (部長の話では), so 来るそう. 来そう, from the stem, would be his own guess from what he sees.',
            fr: 'M. Tanaka répète ce qu’a dit le directeur (部長の話では), donc 来るそう. 来そう, sur le radical, serait sa propre supposition d’après ce qu’il voit.',
            es: 'El señor Tanaka repite lo que dijo el director (部長の話では), así que 来るそう. 来そう, con la raíz, sería su propia suposición por lo que ve.',
          },
        },
      },
    ],
  },
  {
    grammarId: 'rashii',
    compare: 'you-da',
    dialogues: [
      {
        id: 'rashii-ramen',
        setting: 'friends',
        register: 'plain',
        speakers: ['ケン', 'ユキ'],
        lines: [
          {
            by: 0,
            ja: '駅の前に、新しいラーメン屋ができたね。',
            tr: {
              en: 'A new ramen place has opened in front of the station.',
              fr: 'Un nouveau restaurant de ramen a ouvert devant la gare.',
              es: 'Han abierto un restaurante de ramen nuevo delante de la estación.',
            },
          },
          {
            by: 1,
            ja: 'うん。ケンはもう行った？',
            tr: {
              en: 'Yeah. Have you been yet?',
              fr: 'Oui. Tu y es déjà allé ?',
              es: 'Sí. ¿Ya has ido?',
            },
          },
          {
            by: 0,
            ja: 'まだ。でも兄の話だと、すごくおいしいらしいよ。',
            focus: 'おいしいらしい',
            tr: {
              en: 'Not yet. But according to my brother, it’s really good.',
              fr: 'Pas encore. Mais d’après mon frère, c’est vraiment bon.',
              es: 'Todavía no. Pero según mi hermano, está buenísimo.',
            },
          },
        ],
        blank: {
          line: 2,
          distractors: ['おいしそう', 'おいしいつもり', 'おいしかったばかり'],
          why: {
            en: 'Ken hasn’t been there (まだ) and repeats his brother (兄の話だと), so らしい: apparently, from what he heard. おいしそう would need him to see the food himself.',
            fr: 'Ken n’y est pas allé (まだ) et répète son frère (兄の話だと), donc らしい : apparemment, d’après ce qu’il a entendu. おいしそう supposerait qu’il ait vu les plats lui-même.',
            es: 'Ken no ha ido (まだ) y repite lo que dijo su hermano (兄の話だと), así que らしい: por lo visto, según lo que ha oído. おいしそう exigiría que viera la comida él mismo.',
          },
        },
      },
      {
        id: 'rashii-cold',
        setting: 'work',
        register: 'polite',
        speakers: ['マリア', '佐藤'],
        lines: [
          {
            by: 0,
            ja: '佐藤さん、課長は今日お休みですか。',
            tr: {
              en: 'Mr Sato, is the section chief off today?',
              fr: 'Monsieur Sato, le chef de service est absent aujourd’hui ?',
              es: 'Señor Sato, ¿el jefe de sección no viene hoy?',
            },
          },
          {
            by: 1,
            ja: 'ええ。かぜをひいたらしいです。さっき、奥さんから電話がありました。',
            focus: 'らしい',
            tr: {
              en: 'Yes. It seems he’s caught a cold. His wife phoned a moment ago.',
              fr: 'Oui. Il paraît qu’il a attrapé un rhume. Sa femme a téléphoné tout à l’heure.',
              es: 'Sí. Parece que se ha resfriado. Su mujer ha llamado hace un momento.',
            },
          },
          {
            by: 0,
            ja: 'そうですか。早くよくなるといいですね。',
            tr: {
              en: 'I see. I hope he gets better soon.',
              fr: 'Ah bon. J’espère qu’il ira vite mieux.',
              es: 'Vaya. Ojalá se mejore pronto.',
            },
          },
        ],
        blank: {
          line: 1,
          distractors: ['ばかり', 'ところ', 'はず'],
          why: {
            en: 'Mr Sato only knows through the phone call from the chief’s wife, so らしい: it seems, from what he heard. ばかり and ところ would say when it happened, and はず that he expects it.',
            fr: 'M. Sato ne le sait que par l’appel de la femme du chef, donc らしい : il paraît, d’après ce qu’il a entendu. ばかり et ところ diraient quand c’est arrivé, et はず qu’il s’y attend.',
            es: 'El señor Sato solo lo sabe por la llamada de la mujer del jefe, así que らしい: parece, según lo que ha oído. ばかり y ところ dirían cuándo pasó, y はず que lo espera.',
          },
        },
      },
    ],
  },
];
