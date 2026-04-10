'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { Map, ArrowLeft } from 'lucide-react';
import { buildSubItemTree } from '@/lib/sub-item-tree';

interface MilestoneEntry {
  id: string;
  progress: string | null;
  memo: string | null;
  thought: string | null;
  question: string | null;
  adminProgressReply: string | null;
  adminMemoReply: string | null;
  adminThoughtReply: string | null;
  adminQuestionReply: string | null;
}

interface SubItemTraineeEntry {
  id: string;
  progress: string | null;
  memo: string | null;
  thought: string | null;
  question: string | null;
  adminProgressReply: string | null;
  adminMemoReply: string | null;
  adminThoughtReply: string | null;
  adminQuestionReply: string | null;
}

interface MilestoneSubItem {
  id: string;
  parentId: string | null;
  title: string;
  description: string | null;
  order: number;
  completed: boolean;
  completedAt: string | null;
  traineeEntry?: SubItemTraineeEntry | null;
  children?: MilestoneSubItem[];
}

interface Milestone {
  id: string;
  month: number;
  title: string;
  description: string | null;
  targetDate: string;
  completed: boolean;
  traineeEntry?: MilestoneEntry | null;
  subItems?: MilestoneSubItem[];
}

interface Roadmap {
  id: string;
  title: string;
  description: string | null;
  targetMonths: number;
  startDate: string;
  endDate: string;
  milestones: Milestone[];
}

export default function RoadmapPage() {
  const router = useRouter();
  const { status } = useSession();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }
    if (status === 'authenticated') {
      fetch('/api/mypage/roadmaps')
        .then((r) => r.ok && r.json())
        .then((data) => setRoadmaps(data || []))
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [status, router]);

  useEffect(() => {
    if (isLoading || !roadmaps.length || typeof window === 'undefined') return;
    const hash = window.location.hash.slice(1);
    if (!hash || !hash.match(/^(subitem|milestone)-/)) return;
    const t = setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
    return () => clearTimeout(t);
  }, [isLoading, roadmaps.length]);

  const handleSaveEntry = async (milestoneId: string, data: { progress?: string; memo?: string; thought?: string; question?: string }) => {
    const res = await fetch('/api/mypage/milestone-entry', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ milestoneId, ...data }),
    });
    if (res.ok) {
      const entry = await res.json();
      setRoadmaps((prev) =>
        prev.map((r) => ({
          ...r,
          milestones: r.milestones.map((m) =>
            m.id === milestoneId ? { ...m, traineeEntry: entry } : m
          ),
        }))
      );
    }
  };

  const handleSubItemUpdate = async (subItemId: string, data: { completed?: boolean; progress?: string; memo?: string; thought?: string; question?: string }) => {
    const res = await fetch('/api/mypage/sub-item', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subItemId, ...data }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRoadmaps((prev) =>
        prev.map((r) => ({
          ...r,
          milestones: r.milestones.map((m) => ({
            ...m,
            subItems: (m.subItems || []).map((s) =>
              s.id === subItemId ? { ...s, ...updated } : s
            ),
          })),
        }))
      );
    }
  };

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">読み込み中...</p>
      </div>
    );
  }

  const activeRoadmap = roadmaps[0];
  const totalItems =
    activeRoadmap?.milestones.reduce(
      (acc, m) =>
        acc +
        1 +
        (m.subItems?.length ?? 0),
      0
    ) ?? 0;
  const completedItems =
    activeRoadmap?.milestones.reduce(
      (acc, m) =>
        acc +
        (m.completed ? 1 : 0) +
        (m.subItems?.filter((s) => s.completed).length ?? 0),
      0
    ) ?? 0;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <Link
            href="/mypage"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm mb-4"
          >
            <ArrowLeft size={18} />
            マイページに戻る
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">ロードマップ</h1>
        </header>

        {isLoading ? (
          <p className="text-slate-500">読み込み中...</p>
        ) : !activeRoadmap ? (
          <div className="card p-8 text-center">
            <Map className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">ロードマップがまだ作成されていません</p>
            <p className="text-slate-500 text-sm mt-1">管理者がロードマップを追加すると、ここに表示されます</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-1">{activeRoadmap.title}</h2>
              {activeRoadmap.description && (
                <p className="text-sm text-slate-600 mb-4">{activeRoadmap.description}</p>
              )}
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-buddybow-orange h-2.5 rounded-full transition-all"
                    style={{
                      width: `${totalItems > 0 ? (completedItems / totalItems) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-sm text-slate-700 font-medium">
                  {completedItems}/{totalItems}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {new Date(activeRoadmap.startDate).toLocaleDateString('ja-JP')} 〜{' '}
                {new Date(activeRoadmap.endDate).toLocaleDateString('ja-JP')}（{activeRoadmap.targetMonths}ヶ月）
              </p>
            </div>

            {Array.from(new Set(activeRoadmap.milestones.map((m) => m.month ?? 1)))
              .sort((a, b) => a - b)
              .map((monthNum) => {
                const ms = activeRoadmap.milestones.filter((m) => (m.month ?? 1) === monthNum);
                return (
                  <div key={monthNum} className="card p-6">
                    <h3 className="text-base font-semibold text-slate-800 mb-4">
                      {monthNum}ヶ月目
                    </h3>
                    <div className="space-y-4">
                      {ms.map((milestone) => (
                        <div key={milestone.id} id={`milestone-${milestone.id}`} className="scroll-mt-6">
                        <MilestoneTraineeCard
                          milestone={milestone}
                          onSave={(data) => handleSaveEntry(milestone.id, data)}
                          onSubItemUpdate={handleSubItemUpdate}
                        />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function SubItemTreeTrainee({
  items,
  onUpdate,
  depth = 0,
}: {
  items: MilestoneSubItem[];
  onUpdate: (subItemId: string, data: { completed?: boolean; progress?: string; memo?: string; thought?: string; question?: string }) => Promise<void>;
  depth?: number;
}) {
  return (
    <div className="space-y-2" style={{ marginLeft: depth * 16 }}>
      {items.map((item) => (
        <SubItemTraineeNode key={item.id} item={item} onUpdate={onUpdate} depth={depth} />
      ))}
    </div>
  );
}

function SubItemTraineeNode({
  item,
  onUpdate,
  depth,
}: {
  item: MilestoneSubItem;
  onUpdate: (subItemId: string, data: { completed?: boolean; progress?: string; memo?: string; thought?: string; question?: string }) => Promise<void>;
  depth: number;
}) {
  const e = item.traineeEntry;
  const [progress, setProgress] = useState(e?.progress ?? '');
  const [memo, setMemo] = useState(e?.memo ?? '');
  const [thought, setThought] = useState(e?.thought ?? '');
  const [question, setQuestion] = useState(e?.question ?? '');
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === `#subitem-${item.id}`) {
      setExpanded(true);
    }
  }, [item.id]);

  const handleCheck = async () => {
    await onUpdate(item.id, { completed: !item.completed });
  };

  const handleSaveEntry = async () => {
    setSaving(true);
    await onUpdate(item.id, { progress, memo, thought, question });
    setSaving(false);
  };

  const hasAdminReply = e && (e.adminProgressReply || e.adminMemoReply || e.adminThoughtReply || e.adminQuestionReply);

  return (
    <div id={`subitem-${item.id}`} className="border-l-2 border-slate-200 pl-3 py-2 scroll-mt-6">
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="checkbox"
          checked={item.completed}
          onChange={handleCheck}
          className="rounded border-slate-300 text-buddybow-orange focus:ring-buddybow-orange"
        />
        <span
          className={`font-medium cursor-pointer ${item.completed ? 'text-slate-500 line-through' : 'text-slate-800'}`}
          onClick={() => setExpanded(!expanded)}
        >
          {item.title}
        </span>
      </div>
      {item.description && (
        <p className="text-sm text-slate-600 mt-1">{item.description}</p>
      )}
      {expanded && (
        <div className="mt-3 space-y-2 text-sm">
          <div>
            <label className="block text-slate-600 font-medium mb-1">進捗</label>
            <textarea
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              placeholder="進捗を記入..."
            />
          </div>
          <div>
            <label className="block text-slate-600 font-medium mb-1">メモ</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              placeholder="メモを記入..."
            />
          </div>
          <div>
            <label className="block text-slate-600 font-medium mb-1">思ったこと</label>
            <textarea
              value={thought}
              onChange={(e) => setThought(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              placeholder="思ったことを記入..."
            />
          </div>
          <div>
            <label className="block text-slate-600 font-medium mb-1">質問</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              placeholder="質問を記入..."
            />
          </div>
          {hasAdminReply && (
            <div className="p-3 bg-buddybow-orange/5 rounded-lg border border-buddybow-orange/20">
              <p className="text-xs font-semibold text-slate-600 mb-2">管理者からのコメント</p>
              <div className="space-y-1 text-slate-700">
                {e?.adminProgressReply && <div><span className="text-slate-500">進捗:</span> {e.adminProgressReply}</div>}
                {e?.adminMemoReply && <div><span className="text-slate-500">メモ:</span> {e.adminMemoReply}</div>}
                {e?.adminThoughtReply && <div><span className="text-slate-500">思ったこと:</span> {e.adminThoughtReply}</div>}
                {e?.adminQuestionReply && <div><span className="text-slate-500">質問:</span> {e.adminQuestionReply}</div>}
              </div>
            </div>
          )}
          <button
            onClick={handleSaveEntry}
            disabled={saving}
            className="px-4 py-2 bg-buddybow-orange text-white rounded-lg text-sm hover:bg-buddybow-orange-dark disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      )}
      {item.children && item.children.length > 0 && (
        <SubItemTreeTrainee items={item.children} onUpdate={onUpdate} depth={depth + 1} />
      )}
    </div>
  );
}

function MilestoneTraineeCard({
  milestone,
  onSave,
  onSubItemUpdate,
}: {
  milestone: Milestone;
  onSave: (data: { progress?: string; memo?: string; thought?: string; question?: string }) => Promise<void>;
  onSubItemUpdate: (subItemId: string, data: { completed?: boolean; progress?: string; memo?: string; thought?: string; question?: string }) => Promise<void>;
}) {
  const e = milestone.traineeEntry;
  const [progress, setProgress] = useState(e?.progress ?? '');
  const [memo, setMemo] = useState(e?.memo ?? '');
  const [thought, setThought] = useState(e?.thought ?? '');
  const [question, setQuestion] = useState(e?.question ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ progress, memo, thought, question });
    setSaving(false);
  };

  return (
    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            milestone.completed ? 'bg-green-500' : 'bg-slate-300'
          }`}
        />
        <span className={`font-medium ${milestone.completed ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
          {milestone.title}
        </span>
      </div>
      {milestone.description && (
        <p className="text-sm text-slate-600 mb-3">{milestone.description}</p>
      )}
      <div className="space-y-3 text-sm">
        <div>
          <label className="block text-slate-600 font-medium mb-1">進捗</label>
          <textarea
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            placeholder="進捗を記入..."
          />
        </div>
        <div>
          <label className="block text-slate-600 font-medium mb-1">メモ</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            placeholder="メモを記入..."
          />
        </div>
        <div>
          <label className="block text-slate-600 font-medium mb-1">思ったこと</label>
          <textarea
            value={thought}
            onChange={(e) => setThought(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            placeholder="思ったことを記入..."
          />
        </div>
        <div>
          <label className="block text-slate-600 font-medium mb-1">質問</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            placeholder="質問を記入..."
          />
        </div>
        {(e?.adminProgressReply || e?.adminMemoReply || e?.adminThoughtReply || e?.adminQuestionReply) && (
          <div className="mt-3 p-3 bg-buddybow-orange/5 rounded-lg border border-buddybow-orange/20">
            <p className="text-xs font-semibold text-slate-600 mb-2">管理者からのコメント</p>
            <div className="space-y-1 text-slate-700">
              {e.adminProgressReply && <div><span className="text-slate-500">進捗:</span> {e.adminProgressReply}</div>}
              {e.adminMemoReply && <div><span className="text-slate-500">メモ:</span> {e.adminMemoReply}</div>}
              {e.adminThoughtReply && <div><span className="text-slate-500">思ったこと:</span> {e.adminThoughtReply}</div>}
              {e.adminQuestionReply && <div><span className="text-slate-500">質問:</span> {e.adminQuestionReply}</div>}
            </div>
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-buddybow-orange text-white rounded-lg text-sm hover:bg-buddybow-orange-dark disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
      {(milestone.subItems?.length ?? 0) > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="text-sm font-medium text-slate-700 mb-3">サブ項目</div>
          <SubItemTreeTrainee
            items={buildSubItemTree(milestone.subItems || []) as MilestoneSubItem[]}
            onUpdate={onSubItemUpdate}
          />
        </div>
      )}
    </div>
  );
}
