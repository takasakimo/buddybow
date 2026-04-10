/**
 * 256パターン心理学的副業適性診断
 * 8次元 × H/L = 2^8 = 256 通りのパーソナリティタイプ
 */

// ── 型定義 ───────────────────────────────────────────────

export type DimensionId =
  | 'openness'       // 好奇心・探索性
  | 'diligence'      // 計画・実行力
  | 'sociability'    // 対人・発信力
  | 'empathy'        // 共感・支援志向
  | 'resilience'     // 安定・ストレス耐性
  | 'creativity'     // 創造・アイデア力
  | 'autonomy'       // 自律・主体性
  | 'monetization';  // 収益化・ビジネス感覚

export type DimensionLevel = 'H' | 'L';
export type PersonalityKey = string; // 例: "HHLHHLHL"

export interface P256Question {
  id: string;
  dimensionId: DimensionId;
  text: string;
  opts: [string, string, string, string];
  scores: [number, number, number, number]; // 各選択肢のスコア（1〜4）
}

export interface DimensionScore {
  dimensionId: DimensionId;
  rawScore: number;       // 5〜20
  level: DimensionLevel;  // ≥13 → H
}

export interface SideJob {
  id: string;
  title: string;
  description: string;
  requires: DimensionId[];
  avoids?: DimensionId[];
}

export interface P256Result {
  key: PersonalityKey;
  dimensionScores: DimensionScore[];
  personalityDescription: string;
  suitableJobs: SideJob[];
  advice: string[];
  archetype: { title: string; subtitle: string };
}

// ── 次元定義 ─────────────────────────────────────────────

export const DIMENSION_LABELS: Record<DimensionId, { ja: string; Hlabel: string; Llabel: string }> = {
  openness:      { ja: '好奇心・探索性',        Hlabel: '探索型',   Llabel: '安定型'   },
  diligence:     { ja: '計画・実行力',          Hlabel: '実行型',   Llabel: '柔軟型'   },
  sociability:   { ja: '対人・発信力',          Hlabel: '発信型',   Llabel: '内省型'   },
  empathy:       { ja: '共感・支援志向',        Hlabel: '共感型',   Llabel: '成果型'   },
  resilience:    { ja: '安定・ストレス耐性',    Hlabel: '耐性型',   Llabel: '慎重型'   },
  creativity:    { ja: '創造・アイデア力',      Hlabel: '創造型',   Llabel: '実務型'   },
  autonomy:      { ja: '自律・主体性',          Hlabel: '自律型',   Llabel: '協調型'   },
  monetization:  { ja: '収益化・ビジネス感覚',  Hlabel: 'ビジネス型', Llabel: 'スキル型' },
};

// 8次元の順序（PersonalityKeyの文字列順）
export const DIMENSION_ORDER: DimensionId[] = [
  'openness', 'diligence', 'sociability', 'empathy',
  'resilience', 'creativity', 'autonomy', 'monetization',
];

// ── 40問の質問 ───────────────────────────────────────────

export const P256_QUESTIONS: P256Question[] = [
  // D1: openness（好奇心・探索性）Q01–Q05
  {
    id: 'p_q01', dimensionId: 'openness',
    text: '知らないアプリやサービスを見かけると、とにかく触ってみたくなる',
    opts: ['よくある', 'たまにある', 'あまりない', 'ほぼない'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q02', dimensionId: 'openness',
    text: '「なぜそうなるのか」と仕組みを調べることに楽しさを感じる',
    opts: ['よくある', 'たまにある', 'あまりない', 'ほぼない'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q03', dimensionId: 'openness',
    text: '副業や新しいことへの挑戦に、不安よりわくわくの方が大きい',
    opts: ['かなりそう', 'まあそう', 'あまりそうでない', 'そうでない'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q04', dimensionId: 'openness',
    text: '使い慣れたやり方を変えることに積極的だ',
    opts: ['かなりそう', 'まあそう', 'あまりそうでない', 'そうでない'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q05', dimensionId: 'openness',
    text: '本や記事で「面白そう」と思ったことを実際に試したことがある',
    opts: ['よくある', 'たまにある', 'あまりない', 'ほぼない'],
    scores: [4, 3, 2, 1],
  },

  // D2: diligence（計画・実行力）Q06–Q10
  {
    id: 'p_q06', dimensionId: 'diligence',
    text: 'やることリストや計画を作って物事を進めることが多い',
    opts: ['日常的にする', 'たまにする', 'あまりしない', 'ほぼしない'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q07', dimensionId: 'diligence',
    text: '締め切りや目標日を決めると、ほぼ守れる方だ',
    opts: ['かなりそう', 'まあそう', 'あまりそうでない', 'そうでない'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q08', dimensionId: 'diligence',
    text: '始めたことを途中で放置することがよくある',
    opts: ['ほぼない', 'たまにある', 'よくある', 'いつもそう'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q09', dimensionId: 'diligence',
    text: '「後でやろう」と思ったことが結局できないことが多い',
    opts: ['ほぼない', 'たまにある', 'よくある', 'いつもそう'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q10', dimensionId: 'diligence',
    text: '副業活動のための時間を毎週確保できる自信がある',
    opts: ['自信がある', 'まあある', 'あまりない', 'ない'],
    scores: [4, 3, 2, 1],
  },

  // D3: sociability（対人・発信力）Q11–Q15
  {
    id: 'p_q11', dimensionId: 'sociability',
    text: '初対面の人とも比較的すぐ話せる方だ',
    opts: ['かなりそう', 'まあそう', 'あまりそうでない', 'そうでない'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q12', dimensionId: 'sociability',
    text: 'SNSや情報発信に対して抵抗感は少ない',
    opts: ['ほぼない', 'たまにある', 'よくある', '強く感じる'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q13', dimensionId: 'sociability',
    text: '自分の考えや経験を人に話すのが好きだ',
    opts: ['かなりそう', 'まあそう', 'あまりそうでない', 'そうでない'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q14', dimensionId: 'sociability',
    text: '一人で黙々と作業する方が、人と話し合うより得意だ',
    opts: ['そうでない', 'あまりそうでない', 'まあそう', 'かなりそう'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q15', dimensionId: 'sociability',
    text: '自分のスキルや実績を他者にアピールすることは苦手ではない',
    opts: ['かなりそう', 'まあそう', 'あまりそうでない', 'そうでない'],
    scores: [4, 3, 2, 1],
  },

  // D4: empathy（共感・支援志向）Q16–Q20
  {
    id: 'p_q16', dimensionId: 'empathy',
    text: '人が困っているのを見ると、自然と助けたくなる',
    opts: ['よくある', 'たまにある', 'あまりない', 'ほぼない'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q17', dimensionId: 'empathy',
    text: '相手の気持ちや状況を想像してから行動することが多い',
    opts: ['よくある', 'たまにある', 'あまりない', 'ほぼない'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q18', dimensionId: 'empathy',
    text: '人の話を聞くとき、じっくり最後まで聞ける方だ',
    opts: ['よくある', 'たまにある', 'あまりない', 'ほぼない'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q19', dimensionId: 'empathy',
    text: '感情より論理・効率で判断することが多い',
    opts: ['そうでない', 'あまりそうでない', 'まあそう', 'かなりそう'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q20', dimensionId: 'empathy',
    text: '誰かの役に立つことで、自分もやりがいを感じられる',
    opts: ['かなりそう', 'まあそう', 'あまりそうでない', 'そうでない'],
    scores: [4, 3, 2, 1],
  },

  // D5: resilience（安定・ストレス耐性）Q21–Q25
  {
    id: 'p_q21', dimensionId: 'resilience',
    text: '新しい環境や急な変化でもあまり動じない方だ',
    opts: ['かなりそう', 'まあそう', 'あまりそうでない', 'そうでない'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q22', dimensionId: 'resilience',
    text: '失敗しても「次はどうするか」と比較的早く切り替えられる',
    opts: ['よくある', 'たまにある', 'あまりない', 'ほぼない'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q23', dimensionId: 'resilience',
    text: '副業がうまくいかない時期でも続けられる自信がある',
    opts: ['自信がある', 'まあある', 'あまりない', 'ない'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q24', dimensionId: 'resilience',
    text: '不確実なことへの不安が強く、動き出しにくいことがある',
    opts: ['ほぼない', 'たまにある', 'よくある', 'いつもそう'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q25', dimensionId: 'resilience',
    text: '本業と副業を並行することへのプレッシャーはあまり感じない',
    opts: ['かなりそう', 'まあそう', 'あまりそうでない', 'そうでない'],
    scores: [4, 3, 2, 1],
  },

  // D6: creativity（創造・アイデア力）Q26–Q30
  {
    id: 'p_q26', dimensionId: 'creativity',
    text: 'バラバラな情報やアイデアを組み合わせて新しいものを考えることがある',
    opts: ['よくある', 'たまにある', 'あまりない', 'ほぼない'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q27', dimensionId: 'creativity',
    text: '「こうすればもっとよくなる」と改善案が浮かぶことが多い',
    opts: ['よくある', 'たまにある', 'あまりない', 'ほぼない'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q28', dimensionId: 'creativity',
    text: '人と同じやり方より、自分なりのやり方を試してみたい',
    opts: ['かなりそう', 'まあそう', 'あまりそうでない', 'そうでない'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q29', dimensionId: 'creativity',
    text: 'マニュアルや手順通りに進める方が安心する',
    opts: ['そうでない', 'あまりそうでない', 'まあそう', 'かなりそう'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q30', dimensionId: 'creativity',
    text: '副業で「自分だけのコンテンツや商品」を持ってみたいと思う',
    opts: ['かなりそう', 'まあそう', 'あまりそうでない', 'そうでない'],
    scores: [4, 3, 2, 1],
  },

  // D7: autonomy（自律・主体性）Q31–Q35
  {
    id: 'p_q31', dimensionId: 'autonomy',
    text: '誰かに言われなくても、自分から動き出せる方だ',
    opts: ['かなりそう', 'まあそう', 'あまりそうでない', 'そうでない'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q32', dimensionId: 'autonomy',
    text: '目標が決まったら、自分でやり方を考えて進められる',
    opts: ['かなりそう', 'まあそう', 'あまりそうでない', 'そうでない'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q33', dimensionId: 'autonomy',
    text: '何かを始めるとき、誰かに背中を押してもらわないと動きにくい',
    opts: ['そうでない', 'あまりそうでない', 'まあそう', 'かなりそう'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q34', dimensionId: 'autonomy',
    text: '副業の方向性は、自分で調べて決めたいと思う',
    opts: ['かなりそう', 'まあそう', 'あまりそうでない', 'そうでない'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q35', dimensionId: 'autonomy',
    text: '進め方がわからないと行き詰まってしまうことが多い',
    opts: ['ほぼない', 'たまにある', 'よくある', 'いつもそう'],
    scores: [4, 3, 2, 1],
  },

  // D8: monetization（収益化・ビジネス感覚）Q36–Q40
  {
    id: 'p_q36', dimensionId: 'monetization',
    text: 'スキルや経験を「お金に変える」ことへの抵抗感は少ない',
    opts: ['ほぼない', 'たまにある', 'よくある', '強く感じる'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q37', dimensionId: 'monetization',
    text: '自分の仕事や経験が「誰かの役に立ち対価を得る」とイメージできる',
    opts: ['かなりできる', 'まあできる', 'あまりできない', 'できない'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q38', dimensionId: 'monetization',
    text: '価格交渉や自分の値段を決めることに強い苦手意識がある',
    opts: ['ほぼない', 'たまにある', 'よくある', '強く感じる'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q39', dimensionId: 'monetization',
    text: '副業で月◯万円という具体的な目標金額をイメージしている',
    opts: ['明確にある', 'ぼんやりある', 'あまりない', 'ない'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'p_q40', dimensionId: 'monetization',
    text: 'ビジネスや稼ぐ仕組みに興味・関心がある',
    opts: ['かなりある', 'まあある', 'あまりない', 'ない'],
    scores: [4, 3, 2, 1],
  },
];

// ── 副業リスト ────────────────────────────────────────────

export const SIDE_JOBS: SideJob[] = [
  {
    id: 'content_writer',
    title: 'コンテンツライター',
    description: 'ブログ・SNS・記事の文章制作。AIツールと組み合わせると高効率。',
    requires: ['openness', 'creativity'],
  },
  {
    id: 'sns_operator',
    title: 'SNS運用代行',
    description: '企業のSNSアカウントを管理・投稿。発信力と計画性が活きる。',
    requires: ['sociability', 'creativity', 'diligence'],
  },
  {
    id: 'online_coach',
    title: 'オンラインコーチ・講師',
    description: '自分の経験・知識をZoomなどで教える。共感力と発信力が鍵。',
    requires: ['sociability', 'empathy', 'autonomy'],
  },
  {
    id: 'web_designer',
    title: 'Webデザイナー',
    description: 'サイトやバナーのデザイン制作。創造性と計画的な実行力が活きる。',
    requires: ['creativity', 'diligence'],
  },
  {
    id: 'programmer',
    title: 'プログラミング副業',
    description: 'Webアプリや自動化ツールの開発。論理的思考と自律性が活きる。',
    requires: ['diligence', 'autonomy', 'openness'],
    avoids: ['sociability'],
  },
  {
    id: 'consultant',
    title: 'フリーランスコンサルタント',
    description: '業界知識や専門スキルを企業に提供。ビジネス感覚と自律性が必須。',
    requires: ['autonomy', 'monetization', 'resilience'],
  },
  {
    id: 'video_editor',
    title: '動画編集者',
    description: 'YouTube・TikTok等の動画編集。コツコツ型で創造的な人に向いている。',
    requires: ['diligence', 'creativity'],
    avoids: ['sociability'],
  },
  {
    id: 'data_entry',
    title: 'データ入力・事務代行',
    description: '確実・丁寧な作業で信頼を積む。計画型×安定志向に最適。',
    requires: ['diligence'],
    avoids: ['openness', 'creativity'],
  },
  {
    id: 'translator',
    title: '翻訳・ライティング',
    description: '語学や文章力を活かした翻訳・校正業務。コツコツ型向き。',
    requires: ['diligence', 'openness'],
    avoids: ['sociability'],
  },
  {
    id: 'counselor',
    title: 'カウンセラー・メンター',
    description: '人の悩みを聴いてサポートする仕事。高い共感力と発信力が活きる。',
    requires: ['empathy', 'sociability', 'resilience'],
  },
  {
    id: 'handmade',
    title: 'ハンドメイド・クリエイティブ販売',
    description: '自分の作品をネット販売。創造性と計画的な出品が鍵。',
    requires: ['creativity', 'diligence'],
    avoids: ['sociability'],
  },
  {
    id: 'affiliate',
    title: 'アフィリエイト・情報発信',
    description: 'ブログやSNSで商品を紹介して収益化。自律性と探索性が活きる。',
    requires: ['autonomy', 'openness', 'monetization'],
  },
  {
    id: 'project_manager',
    title: 'フリーランスPM・ディレクター',
    description: 'プロジェクト進行管理やチーム調整。計画力・対人力・自律性が必要。',
    requires: ['diligence', 'autonomy', 'sociability', 'resilience'],
  },
  {
    id: 'sales_support',
    title: 'セールス・営業支援',
    description: '商品やサービスの提案・販売サポート。発信力とビジネス感覚が直結。',
    requires: ['sociability', 'monetization', 'resilience'],
  },
  {
    id: 'virtual_assistant',
    title: 'オンライン秘書・事務アシスタント',
    description: 'スケジュール管理・メール対応・資料作成など。丁寧さと共感力が強み。',
    requires: ['diligence', 'empathy'],
    avoids: ['autonomy', 'creativity'],
  },
  {
    id: 'ai_consultant',
    title: 'AI活用コンサルタント・支援',
    description: 'AIツールの導入・活用を支援する仕事。探索性とビジネス感覚の掛け合わせ。',
    requires: ['openness', 'monetization', 'autonomy'],
  },
  {
    id: 'course_creator',
    title: 'オンライン講座制作',
    description: '自分の知識をUdemyやnoteで販売。創造性・発信力・ビジネス感覚の三位一体。',
    requires: ['creativity', 'sociability', 'monetization'],
  },
];

// ── アーキタイプ（上位3軸から自動決定）─────────────────────

const ARCHETYPE_MAP: Array<{
  dims: DimensionId[];
  title: string;
  subtitle: string;
}> = [
  { dims: ['sociability', 'creativity', 'monetization'], title: '発信クリエイター', subtitle: 'コンテンツとビジネスセンスを武器にする発信型' },
  { dims: ['diligence', 'autonomy', 'resilience'],       title: '自律実行者',       subtitle: '計画と粘り強さで着実に結果を積み上げるタイプ' },
  { dims: ['empathy', 'sociability', 'creativity'],      title: 'エンパワラー',     subtitle: '人の力を引き出しながら共に成長するサポート型' },
  { dims: ['openness', 'creativity', 'autonomy'],        title: 'イノベーター',     subtitle: '好奇心と独創性で新しい価値を生み出すタイプ' },
  { dims: ['diligence', 'creativity', 'openness'],       title: 'クラフトマン',     subtitle: '丁寧な仕事と探求心で専門性を磨くタイプ' },
  { dims: ['monetization', 'autonomy', 'resilience'],    title: 'アントレプレナー', subtitle: 'ビジネス感覚と自律性でゼロから稼ぐタイプ' },
  { dims: ['empathy', 'diligence', 'resilience'],        title: '信頼の職人',       subtitle: '誠実さと粘り強さで長期の信頼関係を築くタイプ' },
  { dims: ['sociability', 'resilience', 'autonomy'],     title: 'リーダーシップ型', subtitle: '場をリードし、チームや顧客を動かすタイプ' },
];

// ── 説明文ブロック ───────────────────────────────────────

const DESC_BLOCKS: Record<DimensionId, { H: string; L: string }> = {
  openness: {
    H: '新しいことへの好奇心が旺盛で、変化をチャンスとして前向きに受け入れられます。',
    L: '実績と安定を大切にし、慎重に確かめながら前進するタイプです。',
  },
  diligence: {
    H: '計画を立て着実に実行する力があり、決めたことをやり切る粘り強さがあります。',
    L: '柔軟にその場で判断しながら進むスタイルで、状況変化への適応が得意です。',
  },
  sociability: {
    H: '人と関わり自分を発信することが自然にできる対人力の持ち主です。',
    L: '内省を深めながら独自の世界を築く、一人での集中作業が得意なタイプです。',
  },
  empathy: {
    H: '他者の感情や状況に敏感で、人の役に立つことに深いやりがいを感じます。',
    L: '論理と成果を重視した判断ができ、感情に流されず物事を進められます。',
  },
  resilience: {
    H: '変化やプレッシャーにも動じない精神的タフさが、長期挑戦の土台となります。',
    L: '慎重に一歩一歩進むことで、ミスを減らし確実に前進するタイプです。',
  },
  creativity: {
    H: '独自のアイデアを生み出し、既存の枠を超えた発想で価値を作れます。',
    L: '確実な実務遂行と再現性の高い仕事ぶりで、信頼と実績を積み上げます。',
  },
  autonomy: {
    H: '自分で考え、判断し、動ける主体性があり、指示待ちにならない力があります。',
    L: 'チームや仲間と連携しながら動くことで、より大きな成果を出せるタイプです。',
  },
  monetization: {
    H: '価値とお金を結びつける感覚があり、収益化への心理的ハードルが低いです。',
    L: 'スキルや経験を磨くことに真剣で、質を高めることが強みの原点です。',
  },
};

// ── アドバイスブロック ───────────────────────────────────

const ADVICE_L_BLOCKS: Record<DimensionId, string> = {
  openness:
    '新しいツールを週1つだけ試す習慣から始めましょう。まず触れることで、好奇心の筋肉が育ちます。',
  diligence:
    '副業の時間を手帳に「予約」として入れる。やると決めた日は何があっても30分だけ着手することが継続の鍵です。',
  sociability:
    '最初はSNSで発信より「見る・いいね」から。少しずつ存在感を出すことで自然に発信力が育ちます。',
  empathy:
    'クライアントの「困りごと」を言語化する練習を。相手の視点を持つことが収益に直結します。',
  resilience:
    '副業初期の「うまくいかない期間」は全員が通る道です。3ヶ月は結果ではなく習慣を目標に設定しましょう。',
  creativity:
    'アイデアは「組み合わせ」から生まれます。他業界の成功事例を自分の副業に当てはめてみましょう。',
  autonomy:
    'コミュニティや伴走者を積極的に活用しましょう。「一人でやらなければ」と思わなくて大丈夫です。',
  monetization:
    '「無料でやってみる → 感謝をもらう → 値段をつける」のステップが心理的ハードルを下げます。まず小さく試しましょう。',
};

const KEY_COMBO_TIPS: Array<{
  pattern: Partial<Record<DimensionId, DimensionLevel>>;
  tip: string;
}> = [
  {
    pattern: { sociability: 'H', monetization: 'H', creativity: 'H' },
    tip: 'SNSコンテンツ販売やオンライン講座が最短ルートです。発信×販売の適性が高く、早期収益化が狙えます。',
  },
  {
    pattern: { diligence: 'H', autonomy: 'H', sociability: 'L' },
    tip: 'コツコツ型×自律型。プログラミングや動画編集など技術系副業で着実に実績を積みましょう。',
  },
  {
    pattern: { empathy: 'H', sociability: 'H', creativity: 'L' },
    tip: 'コーチング・カウンセリング・オンライン秘書が適職候補。人を支える仕事で高い評価を得やすいタイプです。',
  },
  {
    pattern: { monetization: 'L', diligence: 'L' },
    tip: 'まず「一つ完成させる体験」を積むことが最優先です。週単位の小さなゴールを設定して動き出しましょう。',
  },
  {
    pattern: { openness: 'H', autonomy: 'H', monetization: 'H' },
    tip: 'AI活用コンサルやアフィリエイト、情報発信など「探索×自律×収益化」の三位一体が最も輝くフィールドです。',
  },
];

// ── エンジン関数 ──────────────────────────────────────────

export function calculateP256Result(selectedIndexes: number[]): P256Result {
  // 1. 次元ごとのスコア集計
  const rawScores: Record<DimensionId, number> = {
    openness: 0, diligence: 0, sociability: 0, empathy: 0,
    resilience: 0, creativity: 0, autonomy: 0, monetization: 0,
  };

  P256_QUESTIONS.forEach((q, i) => {
    const idx = selectedIndexes[i] ?? 0;
    rawScores[q.dimensionId] += q.scores[idx];
  });

  // 2. H/L判定（閾値13以上=H）
  const levels: Record<DimensionId, DimensionLevel> = {} as Record<DimensionId, DimensionLevel>;
  const dimensionScores: DimensionScore[] = DIMENSION_ORDER.map((dim) => {
    const level: DimensionLevel = rawScores[dim] >= 13 ? 'H' : 'L';
    levels[dim] = level;
    return { dimensionId: dim, rawScore: rawScores[dim], level };
  });

  // 3. PersonalityKey（8文字）
  const key: PersonalityKey = DIMENSION_ORDER.map((d) => levels[d]).join('');

  // 4. アーキタイプ（Hの次元と一致度でマッチング）
  const hDims = DIMENSION_ORDER.filter((d) => levels[d] === 'H');
  let bestArchetype = ARCHETYPE_MAP[0];
  let bestScore = 0;
  for (const arch of ARCHETYPE_MAP) {
    const score = arch.dims.filter((d) => hDims.includes(d)).length;
    if (score > bestScore) { bestScore = score; bestArchetype = arch; }
  }
  const archetype = { title: bestArchetype.title, subtitle: bestArchetype.subtitle };

  // 5. 説明文の生成
  const personalityDescription = buildDescription(levels, hDims);

  // 6. 向いている副業（マッチスコア順上位5件）
  const suitableJobs = rankJobs(levels).slice(0, 5);

  // 7. アドバイス生成
  const advice = buildAdvice(levels);

  return { key, dimensionScores, personalityDescription, suitableJobs, advice, archetype };
}

function buildDescription(levels: Record<DimensionId, DimensionLevel>, hDims: DimensionId[]): string {
  const d = (dim: DimensionId) => DESC_BLOCKS[dim][levels[dim]];

  // H次元が多い順に核となる特性を先に書く
  const top = hDims.slice(0, 3);
  const sentences: string[] = [];

  // イントロ: openness + autonomy
  const intro = `${d('openness')}${d('autonomy')}`;
  sentences.push(intro);

  // 仕事スタイル: diligence + resilience
  const work = `${d('diligence')}${d('resilience')}`;
  sentences.push(work);

  // 対人・創造: sociability/empathy + creativity
  if (top.includes('sociability') || levels['sociability'] === 'H') {
    sentences.push(d('sociability'));
  } else {
    sentences.push(d('empathy'));
  }
  sentences.push(d('creativity'));

  // 副業ポテンシャル: monetization
  sentences.push(d('monetization'));

  return sentences.join('\n\n');
}

function rankJobs(levels: Record<DimensionId, DimensionLevel>): SideJob[] {
  return SIDE_JOBS
    .map((job) => {
      const matchScore = job.requires.filter((d) => levels[d] === 'H').length;
      const avoidPenalty = (job.avoids ?? []).filter((d) => levels[d] === 'H').length;
      return { job, score: matchScore - avoidPenalty * 0.5 };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ job }) => job);
}

function buildAdvice(levels: Record<DimensionId, DimensionLevel>): string[] {
  const tips: string[] = [];

  // キーコンボルールを先にチェック
  for (const combo of KEY_COMBO_TIPS) {
    const matches = Object.entries(combo.pattern).every(
      ([dim, level]) => levels[dim as DimensionId] === level
    );
    if (matches) {
      tips.push(combo.tip);
      break;
    }
  }

  // L次元からアドバイスを追加（最大3件になるまで）
  const lDims = DIMENSION_ORDER.filter((d) => levels[d] === 'L');
  // 優先度: monetization > autonomy > diligence > resilience > openness > ...
  const priority: DimensionId[] = [
    'monetization', 'autonomy', 'diligence', 'resilience', 'openness',
    'sociability', 'creativity', 'empathy',
  ];
  for (const dim of priority) {
    if (tips.length >= 3) break;
    if (lDims.includes(dim)) {
      tips.push(ADVICE_L_BLOCKS[dim]);
    }
  }

  // 全部Hの場合
  if (tips.length === 0) {
    tips.push('すべての次元でH判定です。あなたはすでに副業の土台が整っています。次のステップは「単価を上げること」と「仕組み化」です。');
    tips.push('強みをさらに尖らせるために、得意な1分野に集中して実績を作る時期です。');
    tips.push('メンターや同じレベルの仲間との対話が、次のステージへの最短ルートになります。');
  }

  return tips;
}
