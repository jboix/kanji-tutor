/**
 * Particle cases (G5): [entry id, sentence, the particle's surface, whether it must match]. The
 * entry must match the first token spelled that way. Sentences are written for these tests.
 * Every use example of every entry is checked too, in detect.test.ts.
 */
export type ParticleCase = readonly [id: string, sentence: string, surface: string, hit: boolean];

export const PARTICLE_CASES: readonly ParticleCase[] = [
  ['particle-ga', '子供が泣いています。', 'が', true],
  ['particle-ga', '安いですが、買いません。', 'が', false],
  ['particle-ga-but', '安いですが、買いません。', 'が', true],
  ['particle-ga-but', '子供が泣いています。', 'が', false],
  ['particle-wa', '今日は月曜日です。', 'は', true],
  ['particle-wo', '手紙を書きます。', 'を', true],
  ['particle-ni', '三時に会いましょう。', 'に', true],
  ['particle-de', '駅で会いましょう。', 'で', true],
  ['particle-de', '本を読んで寝ました。', 'で', false],
  ['particle-to', '兄と弟がいます。', 'と', true],
  ['particle-mo', '弟も来ます。', 'も', true],
  ['particle-no', '私の傘です。', 'の', true],
  ['particle-e', '駅へ行きます。', 'へ', true],
  ['particle-kara-from', '東京から来ました。', 'から', true],
  ['particle-kara-from', '眠いから寝ます。', 'から', false],
  ['particle-kara-because', '眠いから寝ます。', 'から', true],
  ['particle-kara-because', '東京から来ました。', 'から', false],
  ['particle-made', '駅まで歩きます。', 'まで', true],
  ['particle-ya', '犬や猫が好きです。', 'や', true],
  ['particle-ka', '学生ですか。', 'か', true],
  ['particle-ne', 'きれいですね。', 'ね', true],
  ['particle-yo', '行きますよ。', 'よ', true],
  ['particle-kedo', '寒いけど、行きます。', 'けど', true],
  ['particle-yori', '夏より冬が好きです。', 'より', true],
  ['particle-shika', '一つしかない。', 'しか', true],
  ['particle-dake', '少しだけ食べます。', 'だけ', true],
  ['particle-node', '忙しいので、行けません。', 'ので', true],
  ['particle-noni', '約束したのに、来なかった。', 'のに', true],
];
