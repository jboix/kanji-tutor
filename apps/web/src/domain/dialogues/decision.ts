/** Dialogues for deciding: 〜ことにする (one's own choice) and 〜ことになる (decided for one). */
import type { GrammarDialogues } from './types.ts';

export const DECISION_DIALOGUES: readonly GrammarDialogues[] = [
  {
    grammarId: 'koto-ni-suru',
    compare: 'koto-ni-naru',
    dialogues: [
      {
        id: 'koto-ni-suru-walk',
        setting: 'friends',
        register: 'plain',
        speakers: ['ユイ', 'ケン'],
        lines: [
          {
            by: 0,
            ja: 'あれ、ケン、今日は自転車じゃないの？',
            tr: {
              en: 'Oh, Ken, no bike today?',
              fr: 'Tiens, Ken, tu n’es pas à vélo aujourd’hui ?',
              es: 'Anda, Ken, ¿hoy no vienes en bici?',
            },
          },
          {
            by: 1,
            ja: 'うん。体のために、毎朝駅まで歩くことにしたんだ。',
            focus: 'ことにした',
            tr: {
              en: 'No. For my health, I’ve decided to walk to the station every morning.',
              fr: 'Non. Pour ma santé, j’ai décidé d’aller à pied à la gare tous les matins.',
              es: 'No. Por mi salud, he decidido ir andando a la estación todas las mañanas.',
            },
          },
          {
            by: 0,
            ja: 'へえ、だれかに言われたの？',
            tr: {
              en: 'Oh? Did someone tell you to?',
              fr: 'Ah bon ? Quelqu’un te l’a conseillé ?',
              es: '¿Ah, sí? ¿Te lo dijo alguien?',
            },
          },
          {
            by: 1,
            ja: 'ううん、自分で決めたんだよ。',
            tr: {
              en: 'No, I decided it myself.',
              fr: 'Non, c’est moi qui l’ai décidé.',
              es: 'No, lo decidí yo mismo.',
            },
          },
        ],
        blank: {
          line: 1,
          distractors: ['ことになった', 'ようになった', 'ことがある'],
          why: {
            en: 'Ken decided it himself (自分で決めた), so it is his own choice: ことにした. ことになった would mean someone else or circumstances decided it, and ようになった a change that just happened.',
            fr: 'Ken l’a décidé lui-même (自分で決めた) : c’est son propre choix, donc ことにした. ことになった voudrait dire que quelqu’un d’autre ou les circonstances ont décidé, et ようになった un changement qui s’est fait tout seul.',
            es: 'Ken lo decidió él mismo (自分で決めた): es su propia elección, así que ことにした. ことになった significaría que lo decidió otra persona o las circunstancias, y ようになった un cambio que ocurrió solo.',
          },
        },
      },
      {
        id: 'koto-ni-suru-summer',
        setting: 'work',
        register: 'polite',
        speakers: ['山田', 'リン'],
        lines: [
          {
            by: 0,
            ja: '夏休みはどうしますか。国に帰りますか。',
            tr: {
              en: 'What are you doing for the summer holidays? Going home?',
              fr: 'Que faites-vous pendant les vacances d’été ? Vous rentrez dans votre pays ?',
              es: '¿Qué va a hacer en las vacaciones de verano? ¿Vuelve a su país?',
            },
          },
          {
            by: 1,
            ja: 'いいえ。飛行機が高いので、今年は日本で旅行することにしました。',
            focus: 'ことにしました',
            tr: {
              en: 'No. Flights are expensive, so this year I’ve decided to travel in Japan.',
              fr: 'Non. L’avion coûte cher, alors cette année j’ai décidé de voyager au Japon.',
              es: 'No. El avión es caro, así que este año he decidido viajar por Japón.',
            },
          },
          {
            by: 0,
            ja: 'いいですね。どこへ行きますか。',
            tr: {
              en: 'Nice. Where are you going?',
              fr: 'Bonne idée. Où allez-vous ?',
              es: 'Qué bien. ¿Adónde va?',
            },
          },
          {
            by: 1,
            ja: '北海道です。もう切符も買いました。',
            tr: {
              en: 'Hokkaido. I’ve already bought the tickets.',
              fr: 'À Hokkaidō. J’ai déjà acheté les billets.',
              es: 'A Hokkaido. Ya he comprado los billetes.',
            },
          },
        ],
        blank: {
          line: 1,
          distractors: ['ことになりました', 'ようになりました', 'ことがあります'],
          why: {
            en: 'Lin is asked what she will do and gives her own reason (飛行機が高いので): she made the choice, so ことにしました. ことになりました would present it as decided for her.',
            fr: 'On demande à Lin ce qu’elle va faire, et elle donne sa propre raison (飛行機が高いので) : c’est son choix, donc ことにしました. ことになりました le présenterait comme décidé pour elle.',
            es: 'Le preguntan a Lin qué va a hacer y da su propio motivo (飛行機が高いので): la decisión es suya, así que ことにしました. ことになりました lo presentaría como algo decidido por otros.',
          },
        },
      },
    ],
  },
  {
    grammarId: 'koto-ni-naru',
    compare: 'koto-ni-suru',
    dialogues: [
      {
        id: 'koto-ni-naru-osaka',
        setting: 'work',
        register: 'polite',
        speakers: ['リン', '田中'],
        lines: [
          {
            by: 0,
            ja: '田中さん、元気がないですね。どうしたんですか。',
            tr: {
              en: 'Mr Tanaka, you look down. What’s wrong?',
              fr: 'Monsieur Tanaka, vous avez l’air abattu. Qu’est-ce qui se passe ?',
              es: 'Señor Tanaka, le veo desanimado. ¿Qué le pasa?',
            },
          },
          {
            by: 1,
            ja: '社長が決めて、来月から大阪の店で働くことになったんです。',
            focus: 'ことになった',
            tr: {
              en: 'The boss decided it: from next month I’m going to work at the Osaka shop.',
              fr: 'Le patron l’a décidé : à partir du mois prochain, je vais travailler au magasin d’Osaka.',
              es: 'Lo ha decidido el jefe: a partir del mes que viene voy a trabajar en la tienda de Osaka.',
            },
          },
          {
            by: 0,
            ja: 'えっ、急ですね。さびしくなります。',
            tr: {
              en: 'What? That’s sudden. I’ll miss you.',
              fr: 'Quoi ? C’est soudain. Vous allez me manquer.',
              es: '¿Cómo? Qué repentino. Le echaré de menos.',
            },
          },
        ],
        blank: {
          line: 1,
          distractors: ['ことにした', 'ようになった', 'ようにした'],
          why: {
            en: 'The boss made the decision (社長が決めて), not Mr Tanaka, so ことになった: it was decided for him. ことにした would mean he chose it himself.',
            fr: 'C’est le patron qui a décidé (社長が決めて), pas M. Tanaka : on a décidé pour lui, donc ことになった. ことにした voudrait dire qu’il l’a choisi lui-même.',
            es: 'Lo decidió el jefe (社長が決めて), no el señor Tanaka: lo decidieron por él, así que ことになった. ことにした significaría que lo eligió él.',
          },
        },
      },
      {
        id: 'koto-ni-naru-meeting',
        setting: 'work',
        register: 'polite',
        speakers: ['マリア', '佐藤'],
        lines: [
          {
            by: 0,
            ja: '佐藤さん、明日の会議は何時からですか。',
            tr: {
              en: 'Mr Sato, what time does tomorrow’s meeting start?',
              fr: 'Monsieur Sato, à quelle heure commence la réunion de demain ?',
              es: 'Señor Sato, ¿a qué hora empieza la reunión de mañana?',
            },
          },
          {
            by: 1,
            ja: '部長の都合で、午後二時から始めることになりました。',
            focus: 'ことになりました',
            tr: {
              en: 'Because of the manager’s schedule, it’s been set to start at two in the afternoon.',
              fr: 'À cause de l’emploi du temps du directeur, elle a été fixée à quatorze heures.',
              es: 'Por la agenda del director, se ha decidido empezar a las dos de la tarde.',
            },
          },
          {
            by: 0,
            ja: 'わかりました。じゃあ、午前中に資料を作っておきます。',
            tr: {
              en: 'Got it. Then I’ll prepare the documents in the morning.',
              fr: 'D’accord. Alors je préparerai les documents dans la matinée.',
              es: 'Entendido. Entonces prepararé los documentos por la mañana.',
            },
          },
        ],
        blank: {
          line: 1,
          distractors: ['ことにしました', 'ようになりました', 'ようにしました'],
          why: {
            en: 'The time changed because of the manager’s schedule (部長の都合で), not by Mr Sato’s choice, so ことになりました. ことにしました would mean Mr Sato decided it himself.',
            fr: 'L’heure a changé à cause de l’emploi du temps du directeur (部長の都合で), pas par choix de M. Sato : ことになりました. ことにしました voudrait dire que M. Sato l’a décidé lui-même.',
            es: 'La hora cambió por la agenda del director (部長の都合で), no porque lo eligiera el señor Sato: ことになりました. ことにしました significaría que lo decidió él.',
          },
        },
      },
      {
        id: 'koto-ni-naru-saturday',
        setting: 'school',
        register: 'plain',
        speakers: ['ユウタ', 'アキ'],
        lines: [
          {
            by: 0,
            ja: '聞いた？来年から、土曜日も授業をすることになったんだって。',
            focus: 'ことになった',
            tr: {
              en: 'Did you hear? From next year, we’re going to have classes on Saturdays too.',
              fr: 'Tu as entendu ? À partir de l’année prochaine, on aura aussi cours le samedi.',
              es: '¿Te has enterado? A partir del año que viene vamos a tener clase también los sábados.',
            },
          },
          {
            by: 1,
            ja: 'えー、だれが決めたの？',
            tr: {
              en: 'What? Who decided that?',
              fr: 'Quoi ? Qui a décidé ça ?',
              es: '¿Qué? ¿Quién lo ha decidido?',
            },
          },
          {
            by: 0,
            ja: '校長先生だよ。ぼくたちには何も聞かなかった。',
            tr: {
              en: 'The head teacher. He didn’t ask us at all.',
              fr: 'Le directeur. Il ne nous a rien demandé.',
              es: 'El director. A nosotros no nos preguntó nada.',
            },
          },
        ],
        blank: {
          line: 0,
          distractors: ['ことにした', 'ようになった', 'ことがある'],
          why: {
            en: 'The head teacher decided without asking the students, so for Yuta it was decided for them: ことになった. ことにした would mean the speaker made the decision.',
            fr: 'Le directeur a décidé sans demander l’avis des élèves : pour Yuta, la décision leur est imposée, donc ことになった. ことにした voudrait dire que c’est celui qui parle qui a décidé.',
            es: 'El director lo decidió sin preguntar a los alumnos: para Yuta, es una decisión tomada por otros, así que ことになった. ことにした significaría que lo decidió quien habla.',
          },
        },
      },
    ],
  },
];
