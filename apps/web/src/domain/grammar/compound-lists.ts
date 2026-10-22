/** Word lists for the compound-verb detectors (N3), kept apart from the entries. */

/** Stems before かける / 出す / 合う where the compound means something else (話しかける…). */
export const NOT_KAKERU = [
  '話し',
  '呼び',
  '問い',
  '見',
  '腰',
  '出',
  '笑い',
  '押し',
  '追い',
  '詰め',
];
export const NOT_DASU = [
  '思い',
  '取り',
  '引き',
  '差し',
  '呼び',
  '追い',
  '持ち',
  '連れ',
  '抜き',
  '飛び',
];
export const FUSED_KAKERU = ['読みかける', '食べかける', '言いかける', '死にかける', '忘れかける'];
export const FUSED_DASU = [
  '降り出す',
  '走り出す',
  '笑い出す',
  '泣き出す',
  '言い出す',
  '歩き出す',
  '動き出す',
];
export const FUSED_KIRU = [
  '使い切る',
  '食べ切る',
  '読み切る',
  '売り切る',
  '言い切る',
  '飲み切る',
  'やり切る',
];
export const FUSED_NAOSU = [
  '書き直す',
  'やり直す',
  '見直す',
  '考え直す',
  '読み直す',
  '作り直す',
  '言い直す',
];
export const FUSED_AU = ['話し合う', '助け合う', '教え合う', '分け合う', '言い合う', '愛し合う'];
