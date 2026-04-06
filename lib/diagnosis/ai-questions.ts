export type Axis =
  | 'exploration'
  | 'automation'
  | 'continuity'
  | 'affinity'
  | 'problemFind'
  | 'creativity'
  | 'processing'
  | 'collaboration';

export const AXIS_LABELS: Record<Axis, string> = {
  exploration: '探索力',
  automation: '自動化思考',
  continuity: '学習継続力',
  affinity: 'AI親和性',
  problemFind: '問題発見力',
  creativity: '創造応用力',
  processing: '情報処理力',
  collaboration: '協働適応力',
};

export interface AiQuestion {
  id: string;
  axis: Axis;
  text: string;
  opts: string[];
  scores: number[];
}

export const AI_QUESTIONS: AiQuestion[] = [
  // Part 1: Q1–10
  { id: 'q1',  axis: 'exploration',   text: '新しいアプリやサービスを見かけたとき、とりあえず触ってみることが多い',                          opts: ['よくある', 'たまにある', 'あまりない', 'ほぼない'],                                             scores: [4,3,2,1] },
  { id: 'q2',  axis: 'exploration',   text: '使っているツールやサービスの「仕組み」が気になって調べることがある',                              opts: ['よくある', 'たまにある', 'あまりない', 'ほぼない'],                                             scores: [4,3,2,1] },
  { id: 'q3',  axis: 'exploration',   text: '使い慣れたやり方やツールを、あえて変えようとは思わない方だ',                                      opts: ['全然そうでない', 'あまりそうでない', 'まあそう', 'かなりそう'],                                scores: [4,3,2,1] },
  { id: 'q4',  axis: 'automation',    text: '同じ作業を繰り返しているとき、「もっと楽にならないか」と考えることがある',                        opts: ['よくある', 'たまにある', 'あまりない', 'ほぼない'],                                             scores: [4,3,2,1] },
  { id: 'q5',  axis: 'automation',    text: 'ショートカットキーや関数・テンプレートなど、手間を減らす工夫をしたことがある',                      opts: ['日常的にしている', 'たまにしている', 'あまりしていない', 'していない'],                        scores: [4,3,2,1] },
  { id: 'q6',  axis: 'automation',    text: '「今のやり方で特に困っていない」と感じることが多い',                                              opts: ['ほぼない', 'たまにある', 'よくある', 'いつもそう'],                                            scores: [4,3,2,1] },
  { id: 'q7',  axis: 'continuity',    text: '「やってみたい」と思ったことを、実際に動き出すまでにどのくらいかかる？',                          opts: ['すぐ動き出す', '数日以内には動く', 'なかなか動き出せない', 'ほぼ動かない'],                    scores: [4,3,2,1] },
  { id: 'q8',  axis: 'continuity',    text: '過去に独学で何かを続けた経験がある（語学・運動・趣味・資格など）',                                opts: ['複数ある', '1つある', '途中でやめたことならある', 'ほぼない'],                                  scores: [4,3,2,1] },
  { id: 'q9',  axis: 'continuity',    text: '「やろうと思っていたこと」が1ヶ月後も続いていることは少ない',                                    opts: ['ほぼない', 'たまにある', 'よくある', 'いつもそう'],                                            scores: [4,3,2,1] },
  { id: 'q10', axis: 'continuity',    text: '学んでいて行き詰まったとき、どうすることが多い？',                                                opts: ['別の方法を探して続ける', '少し休んでまた再開する', 'そのまま止まりがち', 'やめてしまうことが多い'], scores: [4,3,2,1] },
  // Part 2: Q11–20
  { id: 'q11', axis: 'affinity',      text: 'ChatGPTやAIツールを使ったことがある',                                                              opts: ['日常的に使う', '何度か使った', '一度だけある', '使ったことない'],                               scores: [4,3,2,1] },
  { id: 'q12', axis: 'affinity',      text: '「AIは自分には難しい」と感じることがある',                                                        opts: ['ほぼない', 'たまにある', 'よくある', 'いつもそう'],                                            scores: [4,3,2,1] },
  { id: 'q13', axis: 'affinity',      text: 'AIが自分の仕事や生活に影響を与えると思っている',                                                  opts: ['かなり思う', 'まあ思う', 'あまり思わない', '思わない'],                                        scores: [4,3,2,1] },
  { id: 'q14', axis: 'affinity',      text: '新しいアプリやデジタルサービスに馴染むのは早い方だと思う？',                                      opts: ['早い方だと思う', 'どちらかといえば早い', 'どちらかといえば遅い', '遅い方だと思う'],             scores: [4,3,2,1] },
  { id: 'q15', axis: 'problemFind',   text: '仕事や日常で「なんかうまくいっていないな」と感じることがある',                                    opts: ['よくある', 'たまにある', 'あまりない', 'ほぼない'],                                             scores: [4,3,2,1] },
  { id: 'q16', axis: 'problemFind',   text: '物事がうまくいかないとき、「なぜそうなったのか」を考える方だ',                                    opts: ['よくある', 'たまにある', 'あまりない', 'ほぼない'],                                             scores: [4,3,2,1] },
  { id: 'q17', axis: 'problemFind',   text: '話し合いや会議で、自分から課題や疑問を口にすることがある',                                        opts: ['よくある', 'たまにある', 'あまりない', 'ほぼない'],                                             scores: [4,3,2,1] },
  { id: 'q18', axis: 'problemFind',   text: '「今のやり方に特に問題はない」と思うことが多い',                                                  opts: ['ほぼない', 'たまにある', 'よくある', 'いつもそう'],                                            scores: [4,3,2,1] },
  { id: 'q19', axis: 'creativity',    text: 'バラバラな情報やアイデアを組み合わせて考えることがある',                                          opts: ['よくある', 'たまにある', 'あまりない', 'ほぼない'],                                             scores: [4,3,2,1] },
  { id: 'q20', axis: 'creativity',    text: '使っているツールや方法を「もっとこう使えば」とアレンジして試すことがある',                          opts: ['よくある', 'たまにある', 'あまりない', 'ほぼない'],                                             scores: [4,3,2,1] },
  // Part 3: Q21–30
  { id: 'q21', axis: 'creativity',    text: 'やり方が決まっているなら、その通りにやる方が安心する',                                            opts: ['ほぼない', 'たまにそう', 'よくそう', 'いつもそう'],                                            scores: [4,3,2,1] },
  { id: 'q22', axis: 'processing',    text: '長い文章や説明を読むとき、まず要点をつかもうとする方だ',                                          opts: ['よくある', 'たまにある', 'あまりない', 'ほぼない'],                                             scores: [4,3,2,1] },
  { id: 'q23', axis: 'processing',    text: '仕事やプロジェクトで複数のことを同時並行で進めることが多い',                                      opts: ['日常的にある', 'たまにある', 'あまりない', 'ほぼない'],                                         scores: [4,3,2,1] },
  { id: 'q24', axis: 'processing',    text: '資料を読むとき、細部より先に全体の流れを確認することがある',                                      opts: ['よくある', 'たまにある', 'あまりない', 'ほぼない'],                                             scores: [4,3,2,1] },
  { id: 'q25', axis: 'processing',    text: '情報が多すぎると、何から手をつければいいか迷って止まることがある',                                opts: ['ほぼない', 'たまにある', 'よくある', 'いつもそう'],                                            scores: [4,3,2,1] },
  { id: 'q26', axis: 'collaboration', text: '新しい環境や初対面の人がいる場でも、比較的早く慣れる方だと思う',                                  opts: ['かなりそう', 'まあそう', 'あまり違う', '全然違う'],                                            scores: [4,3,2,1] },
  { id: 'q27', axis: 'collaboration', text: 'チームで動くとき、状況に合わせて自分の動き方を変えることがある',                                  opts: ['よくある', 'たまにある', 'あまりない', 'ほぼない'],                                             scores: [4,3,2,1] },
  { id: 'q28', axis: 'collaboration', text: '自分と意見が違う人と作業するのは、どちらかといえばストレスを感じる',                              opts: ['ほぼない', 'たまにある', 'よくある', 'いつもそう'],                                            scores: [4,3,2,1] },
  { id: 'q29', axis: 'collaboration', text: '新しいことを学ぶとき、一人でやるより誰かと一緒の方が続きやすい',                                  opts: ['かなりそう', 'まあそう', 'どちらでもない', '一人の方が続く'],                                  scores: [4,3,2,1] },
  { id: 'q30', axis: 'collaboration', text: '人から指摘やフィードバックをもらったとき、次に活かそうとすることが多い',                          opts: ['よくある', 'たまにある', 'あまりない', 'ほぼない'],                                             scores: [4,3,2,1] },
];

// Max raw score per axis (question count × 4)
const AXIS_MAX: Record<Axis, number> = {
  exploration:   3 * 4, // 12
  automation:    3 * 4, // 12
  continuity:    4 * 4, // 16
  affinity:      4 * 4, // 16
  problemFind:   4 * 4, // 16
  creativity:    3 * 4, // 12
  processing:    4 * 4, // 16
  collaboration: 5 * 4, // 20
};

export type DiagnosisType = 'S' | 'A' | 'B' | 'C';

export const AI_TYPES: Record<DiagnosisType, { label: string; desc: string }> = {
  S: {
    label: 'AI活用・前進タイプ',
    desc: '変化を前向きに受け入れられる人。新しいツールや仕組みを自分で試し、日常に取り入れていく力があります。AI時代にすでに動き出している存在です。',
  },
  A: {
    label: 'AI活用・準備タイプ',
    desc: '一歩踏み出せば動き出せる人。土台はしっかりできています。あとは「最初の一歩」を具体的に決めて動き出すだけ。伴走があればすぐに加速できるタイプです。',
  },
  B: {
    label: 'AI活用・探索タイプ',
    desc: 'きっかけ待ちの人。関心はあるのに、なかなか動き出せていない状態。正しいきっかけと環境があれば、一気に動き出せる潜在力があります。',
  },
  C: {
    label: 'AI活用・これからタイプ',
    desc: '最初の一歩を踏み出す人。まだAI活用は始まっていないかもしれませんが、今が最高のスタートタイミングです。小さく始めて確実に積み上げていきましょう。',
  },
};

export interface DiagnosisResult {
  type: DiagnosisType;
  totalScore: number;
  axisScores: Record<Axis, number>;
}

export function calculateAiResult(answers: number[]): DiagnosisResult {
  const axisRaw: Record<Axis, number> = {
    exploration: 0, automation: 0, continuity: 0, affinity: 0,
    problemFind: 0, creativity: 0, processing: 0, collaboration: 0,
  };

  AI_QUESTIONS.forEach((q, i) => {
    axisRaw[q.axis] += q.scores[answers[i]] ?? 0;
  });

  let totalNormalized = 0;
  const axisScores = {} as Record<Axis, number>;

  (Object.keys(axisRaw) as Axis[]).forEach((axis) => {
    const normalized = Math.round((axisRaw[axis] / AXIS_MAX[axis]) * 100);
    axisScores[axis] = normalized;
    totalNormalized += normalized;
  });

  const totalScore = Math.round(totalNormalized / 8);

  let type: DiagnosisType;
  if (totalScore >= 81) type = 'S';
  else if (totalScore >= 77) type = 'A';
  else if (totalScore >= 73) type = 'B';
  else type = 'C';

  return { type, totalScore, axisScores };
}
