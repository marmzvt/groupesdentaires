'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

interface QuestionStat {
  title: string;
  type: string;
  total?: number;
  average?: number;
  min?: number;
  max?: number;
  count?: number;
  distribution?: { value: string | number; label?: string; count: number; percentage?: number; avgPercentage?: number }[];
}

interface Stats {
  total: number;
  totalCompleted: number;
  filteredCount: number;
  completionRate: number;
  questionStats: Record<string, QuestionStat>;
  textResponses: Record<string, string[]>;
  textQuestionTitles: Record<string, string>;
  dailyResponses: { date: string; count: number }[];
  filters: {
    startYear: number | null;
  };
}

interface Response {
  id: string;
  createdAt: string;
  completed: boolean;
  data: Record<string, any>;
}

// Cool gradient color palette
const CHART_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#a855f7', // Purple
  '#d946ef', // Fuchsia
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
];

const q2Labels: Record<string, string> = {
  A: 'Cabinet individuel',
  B: 'Cabinet de groupe',
  C: 'Salarié cabinet privé',
  D: 'Salarié centre dentaire',
  E: 'Autre mode',
  F: 'Première expérience',
};

const segmentLabels: Record<string, string> = {
  preventifs: 'Soins préventifs',
  hygiene: 'Soins de base',
  protheses: 'Prothèses',
  implants: 'Implants/parodontie',
  orthodontie: 'Orthodontie/esthétiques',
};

const questionTitles: Record<string, string> = {
  Q0: 'Type de structure',
  Q1: 'Année début exercice',
  Q2: 'Mode d\'exercice précédent',
  Q3: 'Années d\'affiliation',
  Q4: 'Soutien administratif (Groupe)',
  Q5: 'Développement professionnel (Groupe)',
  Q6: 'Formation continue (Groupe)',
  Q7: 'Accès technologies (Groupe)',
  Q8: 'Qualité clinique (Groupe)',
  Q9: 'Présence confrères (Groupe)',
  Q10: 'Satisfaction patients (Groupe)',
  Q11: 'Sécurité risques (Groupe)',
  Q12: 'Équilibre vie pro/perso (Groupe)',
  Q13: 'Satisfaction globale (Groupe)',
  Q4i: 'Gestion administrative (Indép.)',
  Q5i: 'Développement professionnel (Indép.)',
  Q6i: 'Formation continue (Indép.)',
  Q7i: 'Accès technologies (Indép.)',
  Q8i: 'Qualité clinique (Indép.)',
  Q9i: 'Accès confrères (Indép.)',
  Q10i: 'Sécurité risques (Indép.)',
  Q11i: 'Équilibre vie pro/perso (Indép.)',
  Q12i: 'Satisfaction globale (Indép.)',
  Q20: 'Intention rejoindre groupe',
  Q21: 'Avantages perçus groupes',
  Q22: 'Réticences groupes',
  Q14: 'Segments actuels actifs',
  Q14b: 'Répartition actuelle (%)',
  Q15: 'Segments anticipés en hausse',
  Q15b: 'Répartition future (%)',
  Q16: 'Structure',
  Q17: 'Autorisation contact',
  Q18: 'Email',
};

// Helper to format value with labels
const formatValue = (qId: string, value: any): string => {
  if (value === undefined || value === null) return '-';

  if (qId === 'Q2' && Array.isArray(value)) {
    return value.map(v => q2Labels[v] || v).join(', ');
  }

  if ((qId === 'Q14' || qId === 'Q15') && Array.isArray(value)) {
    return value.map(v => segmentLabels[v] || v).join(', ');
  }

  if ((qId === 'Q14b' || qId === 'Q15b') && typeof value === 'object') {
    return Object.entries(value)
      .map(([k, v]) => `${segmentLabels[k] || k}: ${v}%`)
      .join(', ');
  }

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  return String(value);
};

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'questions' | 'responses' | 'browser'>('questions');
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette réponse ?')) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/responses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setResponses((prev) => prev.filter((r) => r.id !== id));
        fetchData();
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setDeleting(null);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, responsesRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/responses?limit=100'),
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (responsesRes.ok) {
        const data = await responsesRes.json();
        setResponses(data.responses);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = () => {
    window.open('/api/export', '_blank');
  };

  const handleExcelExport = () => {
    window.open('/api/export-excel', '_blank');
  };

  // Render bar chart with gradient colors
  const renderBarChart = (stat: QuestionStat, horizontal = true) => {
    if (!stat.distribution || stat.distribution.length === 0) {
      return <div className="text-gray-400 text-center py-8">Pas de données</div>;
    }

    if (horizontal) {
      return (
        <ResponsiveContainer width="100%" height={Math.max(200, stat.distribution.length * 40)}>
          <BarChart data={stat.distribution} layout="vertical" barSize={24}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 11 }}
              width={140}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
              formatter={(value, name, props) => {
                if (stat.type === 'percentage') {
                  return [`${props.payload.avgPercentage}%`, 'Moyenne'];
                }
                return [`${value} (${props.payload.percentage}%)`, 'Réponses'];
              }}
            />
            <Bar
              dataKey={stat.type === 'percentage' ? 'avgPercentage' : 'count'}
              radius={[0, 4, 4, 0]}
            >
              {stat.distribution.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={stat.distribution} barSize={30}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-45} textAnchor="end" height={80} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
            formatter={(value, name, props) => [`${value} (${props.payload.percentage}%)`, 'Réponses']}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {stat.distribution.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Render scale chart (0-10) with gradient
  const renderScaleChart = (stat: QuestionStat) => {
    if (!stat.distribution) return null;

    return (
      <div>
        <div className="text-center mb-4">
          <span className="text-3xl font-bold" style={{ color: CHART_COLORS[0] }}>{stat.average}</span>
          <span className="text-gray-500 ml-2">/ 10 (moyenne)</span>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={stat.distribution} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="value" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {stat.distribution.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Render numeric stat
  const renderNumericStat = (stat: QuestionStat, qId?: string) => {
    let unit = '';
    if (qId === 'Q3') {
      unit = 'années en moyenne';
    } else if (qId === 'Q1') {
      unit = '(année moyenne)';
    }

    return (
      <div className="text-center py-6">
        <div className="text-4xl font-bold" style={{ color: CHART_COLORS[0] }}>{stat.average}</div>
        {unit && (
          <div className="text-sm text-gray-500 mt-2">
            {unit}
          </div>
        )}
        <div className="text-xs text-gray-400 mt-1">
          (min: {stat.min}, max: {stat.max}, n={stat.count})
        </div>
      </div>
    );
  };

  // Render percentage distribution as pie chart
  const renderPercentageChart = (stat: QuestionStat) => {
    if (!stat.distribution) return null;

    const data = stat.distribution.map((d, i) => ({
      name: d.label,
      value: d.avgPercentage || 0,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));

    return (
      <div>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${value}%`}
              outerRadius={80}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value}%`} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {data.map((entry, index) => (
            <div key={index} className="flex items-center gap-1 text-xs">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: entry.fill }} />
              <span>{entry.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render question chart based on type
  const renderQuestionChart = (stat: QuestionStat, qId?: string) => {
    if (!stat) return null;

    switch (stat.type) {
      case 'numeric':
        return renderNumericStat(stat, qId);
      case 'scale':
        return renderScaleChart(stat);
      case 'percentage':
        return renderPercentageChart(stat);
      case 'single':
      case 'multiple':
      default:
        return renderBarChart(stat, true);
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const questionGroups = [
    { title: 'Profil', ids: ['Q1', 'Q2', 'Q3'], textIds: [] as string[] },
    { title: 'Évaluation structure (Échelles 0-10)', ids: ['Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10', 'Q11', 'Q12', 'Q13'], textIds: [] as string[] },
    { title: 'Activité actuelle', ids: ['Q14', 'Q14b'], textIds: [] as string[] },
    { title: 'Activité future', ids: ['Q15', 'Q15b'], textIds: [] as string[] },
    { title: 'Contact', ids: ['Q17'], textIds: ['Q16'] },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Tableau de bord - Groupes Dentaires</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/analysis"
              className="px-4 py-2 bg-purple-500 text-white font-medium rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analyse Statistique
            </Link>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exporter CSV
            </button>
            <button
              onClick={handleExcelExport}
              className="px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Excel structuré
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-sm font-medium text-gray-500 mb-1">Total réponses</div>
            <div className="text-3xl font-bold text-gray-900">{stats?.total || 0}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-sm font-medium text-gray-500 mb-1">Complétées</div>
            <div className="text-3xl font-bold text-green-600">{stats?.totalCompleted || 0}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-sm font-medium text-gray-500 mb-1">Taux complétion</div>
            <div className="text-3xl font-bold text-primary-600">{stats?.completionRate || 0}%</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-sm font-medium text-gray-500 mb-1">Affichées</div>
            <div className="text-3xl font-bold text-purple-600">{stats?.filteredCount || 0}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'questions', label: 'Statistiques' },
            { key: 'browser', label: 'Navigateur réponses' },
            { key: 'responses', label: `Liste (${responses.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'browser' && responses.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            {/* Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentResponseIndex(Math.max(0, currentResponseIndex - 1))}
                disabled={currentResponseIndex === 0}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Précédent
              </button>

              <div className="flex items-center gap-4">
                <span className="text-lg font-semibold text-gray-900">
                  Réponse {currentResponseIndex + 1} / {responses.length}
                </span>
                <input
                  type="number"
                  min={1}
                  max={responses.length}
                  value={currentResponseIndex + 1}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) - 1;
                    if (val >= 0 && val < responses.length) {
                      setCurrentResponseIndex(val);
                    }
                  }}
                  className="w-20 px-2 py-1 border rounded text-center"
                />
              </div>

              <button
                onClick={() => setCurrentResponseIndex(Math.min(responses.length - 1, currentResponseIndex + 1))}
                disabled={currentResponseIndex === responses.length - 1}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Suivant
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Response details */}
            {(() => {
              const response = responses[currentResponseIndex];
              if (!response) return null;

              const data = response.data;
              const allQuestionIds = [
                'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10',
                'Q11', 'Q12', 'Q13', 'Q14', 'Q14b', 'Q15', 'Q15b', 'Q16', 'Q17'
              ];

              return (
                <div>
                  {/* Meta info */}
                  <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-xs text-gray-500">ID:</span>
                      <span className="ml-2 text-sm font-mono">{response.id}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Date:</span>
                      <span className="ml-2 text-sm">{new Date(response.createdAt).toLocaleString('fr-FR')}</span>
                    </div>
                    <div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${response.completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {response.completed ? 'Complété' : 'En cours'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(response.id)}
                      disabled={deleting === response.id}
                      className="ml-auto text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                    >
                      {deleting === response.id ? 'Suppression...' : 'Supprimer'}
                    </button>
                  </div>

                  {/* All answers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allQuestionIds.map((qId) => {
                      const value = data[qId];
                      if (value === undefined || value === null || value === '') return null;

                      const title = questionTitles[qId] || qId;
                      const displayValue = formatValue(qId, value);

                      return (
                        <div key={qId} className="p-3 border rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">{qId}</div>
                          <div className="text-sm text-gray-700 font-medium mb-1">{title}</div>
                          <div className="text-base text-gray-900 bg-gray-50 px-2 py-1 rounded">
                            {displayValue}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'browser' && responses.length === 0 && (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center text-gray-500">
            Aucune réponse à afficher
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-8">
            {questionGroups.map((group, groupIdx) => (
              <div key={group.title}>
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">{group.title}</h2>
                {/* Chart questions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {group.ids.map((qId) => {
                    const stat = stats?.questionStats?.[qId];
                    if (!stat) return null;
                    return (
                      <div key={qId} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-md font-semibold text-gray-900 mb-1">{stat.title}</h3>
                        <p className="text-xs text-gray-400 mb-4">
                          {qId} • {stat.total || stat.count || 0} réponses
                        </p>
                        {renderQuestionChart(stat, qId)}
                      </div>
                    );
                  })}
                </div>
                {/* Text responses for this section */}
                {group.textIds.length > 0 && (
                  <div className="mt-6 space-y-4">
                    {group.textIds.map((textId) => {
                      const textResponses = stats?.textResponses?.[textId] || [];
                      const textTitle = stats?.textQuestionTitles?.[textId];
                      if (textResponses.length === 0) return null;
                      return (
                        <div key={textId} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                          <h3 className="text-md font-semibold text-gray-900 mb-1">{textTitle}</h3>
                          <p className="text-xs text-gray-400 mb-4">{textId} • {textResponses.length} réponses</p>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {textResponses.map((text, idx) => (
                              <div
                                key={idx}
                                className="border-l-4 pl-3 py-1 text-sm text-gray-700"
                                style={{ borderColor: CHART_COLORS[groupIdx % CHART_COLORS.length] }}
                              >
                                {text}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'responses' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Année début
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Structure
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Contact OK
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {responses.map((response) => {
                    return (
                      <tr key={response.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(response.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              response.completed
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {response.completed ? 'Complété' : 'En cours'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {response.data.Q1 || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {response.data.Q16 || '-'}
                        </td>
                        <td className="px-6 py-4">
                          {response.data.Q17 && (
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                response.data.Q17 === 'oui'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {response.data.Q17 === 'oui' ? 'Oui' : 'Non'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(response.id)}
                            disabled={deleting === response.id}
                            className="text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                            title="Supprimer"
                          >
                            {deleting === response.id ? (
                              <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
