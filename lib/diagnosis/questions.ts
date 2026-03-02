/**
 * 行動タイプ診断 - 性格診断の一環として設計
 * メンター・副業・ビジネス用語を排除し、純粋な行動パターン・考え方の質問のみ
 */

export type AnswerKey = 'A' | 'B' | 'C' | 'D';

export interface Question {
  id: string;
  text: string;
  options: { key: AnswerKey; text: string }[];
}

export const DIAGNOSIS_QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: '新しいことに取り組むとき、あなたはどうなりがちですか？',
    options: [
      { key: 'A', text: 'まず情報を集めてから動きたい' },
      { key: 'B', text: '少し試してみて、感じながら進めたい' },
      { key: 'C', text: '計画を立ててから着実に進めたい' },
      { key: 'D', text: '直感で動いて、後から調整したい' },
    ],
  },
  {
    id: 'q2',
    text: '「やろう」と思ったこと、実際に続けられていますか？',
    options: [
      { key: 'A', text: '分析しすぎて、なかなか踏み出せないことが多い' },
      { key: 'B', text: '気分に左右されて、続いたり続かなかったり' },
      { key: 'C', text: 'ルーティンに組み込めば、わりと続く方' },
      { key: 'D', text: '興味が移ると、ついサボってしまう' },
    ],
  },
  {
    id: 'q3',
    text: '決めなきゃいけないことがあるとき、あなたは？',
    options: [
      { key: 'A', text: '情報が足りないと判断できなくて困る' },
      { key: 'B', text: '誰かと話すと、なんとなく決まりやすい' },
      { key: 'C', text: '期限を決めて、その中で決めるようにしている' },
      { key: 'D', text: '直感でパッと決めることが多い' },
    ],
  },
  {
    id: 'q4',
    text: '1週間のスケジュール、どれに近いですか？',
    options: [
      { key: 'A', text: 'やることが多すぎて、頭の中がごちゃついている' },
      { key: 'B', text: 'その日の気分で変わるので、あまり決めていない' },
      { key: 'C', text: '曜日ごと・時間帯ごとにある程度決まっている' },
      { key: 'D', text: '締め切りに追われて動くことが多い' },
    ],
  },
  {
    id: 'q5',
    text: '「失敗したかも」と感じたとき、あなたは？',
    options: [
      { key: 'A', text: 'どこが悪かったか、分析して次に活かしたい' },
      { key: 'B', text: '誰かに話すと、少し楽になる' },
      { key: 'C', text: '一度リセットして、計画を立て直したい' },
      { key: 'D', text: '気にしすぎず、次に進みたい' },
    ],
  },
  {
    id: 'q6',
    text: '目標を立てるとき、あなたはどれに近いですか？',
    options: [
      { key: 'A', text: '細かく分解して、やるべきことを明確にしたい' },
      { key: 'B', text: '大きなイメージはあるが、具体的には曖昧になりがち' },
      { key: 'C', text: '期限と数字を決めて、逆算して考える' },
      { key: 'D', text: 'あまり計画せず、そのときの感覚で動く' },
    ],
  },
  {
    id: 'q7',
    text: '一人で過ごす時間と、人と過ごす時間、どちらがエネルギーになりますか？',
    options: [
      { key: 'A', text: '一人で考える時間の方が大切' },
      { key: 'B', text: '人との対話でアイデアややる気が出る' },
      { key: 'C', text: '両方必要。メリハリをつけて使いたい' },
      { key: 'D', text: '状況による。その日によって変わる' },
    ],
  },
  {
    id: 'q8',
    text: '「やらなきゃ」と思っているのに動けないとき、あなたは？',
    options: [
      { key: 'A', text: 'なぜ動けないのか、原因を考えてしまう' },
      { key: 'B', text: '誰かがそばにいてくれたら、動けるかも' },
      { key: 'C', text: 'まず小さく1歩だけ、と決めると動ける' },
      { key: 'D', text: '気分が乗るまで、別のことをしてしまう' },
    ],
  },
];

/** 診断結果の型定義 */
export const PERSONALITY_TYPES: Record<string, { name: string; description: string }> = {
  完璧主義: {
    name: '完璧主義',
    description: '準備が整うまで動けないタイプ。質へのこだわりが強く、納得いくまで踏み出せない傾向が。まず「60点でOK」と決めて一小歩踏み出す習慣が、動きやすさの鍵になります。',
  },
  教材コレクター: {
    name: '教材コレクター',
    description: '学ぶことを続けるが、知識が積み上がって実行に移せないタイプ。インプットは得意。アウトプットの「場」を一つ決めて、学んだことを試してみる仕組みをつくると力を発揮できます。',
  },
  一匹狼: {
    name: '一匹狼',
    description: '一人で進めることが多いタイプ。自立心が強く、自分のペースを大切にする一方、行き詰まると一人で抱えがち。たまに誰かに話すだけで、突破口が見えることもあります。',
  },
  気分屋サーファー: {
    name: '気分屋サーファー',
    description: '気分や波に乗って動くタイプ。乗っているときは一気に進む一方、乗れないと止まりやすい。気分に左右されずに続けるには、無理のない「最低限やること」を決めておくのがおすすめです。',
  },
};

/** 回答から最多のキーを取得し、結果タイプにマッピング */
const KEY_TO_TYPE: Record<AnswerKey, string> = {
  A: '完璧主義',
  B: '教材コレクター',
  C: '一匹狼',
  D: '気分屋サーファー',
};

export function calculateResult(answers: AnswerKey[]): string {
  const counts: Record<string, number> = { 完璧主義: 0, 教材コレクター: 0, 一匹狼: 0, 気分屋サーファー: 0 };
  for (const key of answers) {
    const type = KEY_TO_TYPE[key];
    counts[type] = (counts[type] || 0) + 1;
  }
  const entries = Object.entries(counts);
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}
