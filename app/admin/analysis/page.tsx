'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
} from 'recharts';

interface AnalysisData {
  sampleSize: {
    total: number;
    group: number;
    independent: number;
    byStructure: Record<string, number>;
  };
  comparisons: any[];
  composites: any[];
  activityAnalysis: any;
  perceptionAnalysis: any;
  correlations: any;
  structureAnalysis: any;
  profileStats: any;
  methodology: any;
  error?: string;
}

export default function AnalysisPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'comparisons' | 'structures' | 'activity' | 'perception'>('overview');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAnalysis();
    }
  }, [status]);

  const fetchAnalysis = async () => {
    try {
      const res = await fetch('/api/analysis');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session) return null;

  if (data?.error || !data?.sampleSize || data.sampleSize.total === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/admin" className="text-primary-500 hover:underline mb-4 inline-block">
            &larr; Retour au dashboard
          </Link>
          <div className="bg-white rounded-xl p-8 shadow-sm text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Analyse Statistique</h1>
            <p className="text-gray-600">
              {data?.error || 'Pas encore de réponses complètes pour l\'analyse.'}
            </p>
            <p className="text-gray-500 mt-2">
              L'analyse sera disponible dès que des réponses seront collectées.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-primary-500 hover:underline text-sm">
              &larr; Retour au dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Analyse Statistique</h1>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div>N total = {data.sampleSize.total}</div>
            <div>Groupes: {data.sampleSize.group} | Indépendants: {data.sampleSize.independent}</div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-6">
            {[
              { id: 'overview', label: 'Vue d\'ensemble' },
              { id: 'comparisons', label: 'Groupe vs Indép.' },
              { id: 'structures', label: 'Entre structures' },
              { id: 'activity', label: 'Segments d\'activité' },
              { id: 'perception', label: 'Perceptions' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && <OverviewTab data={data} />}
        {activeTab === 'comparisons' && <ComparisonsTab data={data} />}
        {activeTab === 'structures' && <StructuresTab data={data} />}
        {activeTab === 'activity' && <ActivityTab data={data} />}
        {activeTab === 'perception' && <PerceptionTab data={data} />}
      </main>

      {/* Methodology Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto text-xs text-gray-500">
          <strong>Méthodologie:</strong> {data.methodology?.tests} |
          Taille d'effet: {data.methodology?.effectSize} |
          Correction: {data.methodology?.multipleComparison} |
          IC: {data.methodology?.confidenceIntervals}
        </div>
      </footer>
    </div>
  );
}

// ============================================
// OVERVIEW TAB
// ============================================

function OverviewTab({ data }: { data: AnalysisData }) {
  // Prepare comparison chart data
  const comparisonData = data.comparisons.map((c) => ({
    name: c.theme,
    group: c.groupStats.mean,
    independent: c.independentStats.mean,
    difference: c.difference,
  }));

  // Prepare composite radar data
  const radarData = data.composites.map((c: any) => ({
    subject: c.name,
    group: c.groupScore,
    independent: c.independentScore,
  }));

  return (
    <div className="space-y-8">
      {/* Sample Size Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-3xl font-bold text-gray-900">{data.sampleSize.total}</div>
          <div className="text-gray-500">Réponses totales</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-3xl font-bold text-primary-600">{data.sampleSize.group}</div>
          <div className="text-gray-500">Dentistes en groupe</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-3xl font-bold text-blue-600">{data.sampleSize.independent}</div>
          <div className="text-gray-500">Dentistes indépendants</div>
        </div>
      </div>

      {/* Main Comparison Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Comparaison des 9 thèmes (moyenne 0-10)
        </h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} layout="vertical" margin={{ left: 120 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 10]} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => value.toFixed(2)}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Legend />
              <Bar dataKey="group" name="Groupe dentaire" fill="#0ea5e9" />
              <Bar dataKey="independent" name="Indépendant" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Composite Indices Radar */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Indices composites
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 10]} />
              <Radar
                name="Groupe dentaire"
                dataKey="group"
                stroke="#0ea5e9"
                fill="#0ea5e9"
                fillOpacity={0.3}
              />
              <Radar
                name="Indépendant"
                dataKey="independent"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.3}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Profile Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Années d'expérience</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Groupe dentaire</span>
              <span className="font-medium">
                {data.profileStats?.yearsExperience?.group?.mean?.toFixed(1) || '-'} ans
                <span className="text-gray-400 text-sm ml-2">
                  (SD: {data.profileStats?.yearsExperience?.group?.sd?.toFixed(1) || '-'})
                </span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Indépendant</span>
              <span className="font-medium">
                {data.profileStats?.yearsExperience?.independent?.mean?.toFixed(1) || '-'} ans
                <span className="text-gray-400 text-sm ml-2">
                  (SD: {data.profileStats?.yearsExperience?.independent?.sd?.toFixed(1) || '-'})
                </span>
              </span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ancienneté dans la structure</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Groupe dentaire</span>
              <span className="font-medium">
                {data.profileStats?.yearsInStructure?.group?.mean?.toFixed(1) || '-'} ans
                <span className="text-gray-400 text-sm ml-2">
                  (SD: {data.profileStats?.yearsInStructure?.group?.sd?.toFixed(1) || '-'})
                </span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Indépendant</span>
              <span className="font-medium">
                {data.profileStats?.yearsInStructure?.independent?.mean?.toFixed(1) || '-'} ans
                <span className="text-gray-400 text-sm ml-2">
                  (SD: {data.profileStats?.yearsInStructure?.independent?.sd?.toFixed(1) || '-'})
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Structure Distribution */}
      {Object.keys(data.sampleSize.byStructure || {}).length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par structure</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(data.sampleSize.byStructure)
              .sort((a, b) => b[1] - a[1])
              .map(([structure, count]) => (
                <div key={structure} className="bg-gray-50 rounded-lg p-3">
                  <div className="font-medium text-gray-900">{count}</div>
                  <div className="text-sm text-gray-500 truncate">{getStructureLabel(structure)}</div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPARISONS TAB
// ============================================

function ComparisonsTab({ data }: { data: AnalysisData }) {
  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
        <strong>Note:</strong> Avec un échantillon de N={data.sampleSize.total}, seuls les effets de grande taille (r &gt; 0.5) seront détectables de manière fiable.
        Les p-values sont corrigées par Benjamini-Hochberg pour les comparaisons multiples.
      </div>

      {data.comparisons.map((comp: any) => (
        <div key={comp.variable} className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{comp.theme}</h3>
              <p className="text-sm text-gray-500">{comp.variable}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              comp.significantAfterCorrection
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {comp.significantAfterCorrection ? 'Significatif' : 'Non significatif'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Statistics Table */}
            <div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Statistique</th>
                    <th className="text-right py-2">Groupe (n={comp.groupStats.n})</th>
                    <th className="text-right py-2">Indép. (n={comp.independentStats.n})</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Moyenne (SD)</td>
                    <td className="text-right">{comp.groupStats.mean.toFixed(2)} ({comp.groupStats.sd.toFixed(2)})</td>
                    <td className="text-right">{comp.independentStats.mean.toFixed(2)} ({comp.independentStats.sd.toFixed(2)})</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Médiane [IQR]</td>
                    <td className="text-right">
                      {comp.groupStats.median.toFixed(1)} [{comp.groupStats.q1.toFixed(1)}-{comp.groupStats.q3.toFixed(1)}]
                    </td>
                    <td className="text-right">
                      {comp.independentStats.median.toFixed(1)} [{comp.independentStats.q1.toFixed(1)}-{comp.independentStats.q3.toFixed(1)}]
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2">Min - Max</td>
                    <td className="text-right">{comp.groupStats.min} - {comp.groupStats.max}</td>
                    <td className="text-right">{comp.independentStats.min} - {comp.independentStats.max}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Test Results */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Tests statistiques</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mann-Whitney U</span>
                  <span>{comp.mannWhitney.U.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">p-value (brute)</span>
                  <span>{comp.mannWhitney.pValue.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">p-value (ajustée BH)</span>
                  <span className="font-medium">{comp.adjustedPValue.toFixed(4)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between">
                  <span className="text-gray-600">Effet (rank-biserial r)</span>
                  <span className={getEffectClass(comp.effectSizes.rankBiserial)}>
                    {comp.effectSizes.rankBiserial.toFixed(3)} ({getEffectLabel(comp.effectSizes.rankBiserial)})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hedges' g</span>
                  <span>{comp.effectSizes.hedgesG.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">CLES</span>
                  <span>{(comp.effectSizes.cles * 100).toFixed(1)}%</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between">
                  <span className="text-gray-600">Différence moyenne</span>
                  <span>{comp.difference > 0 ? '+' : ''}{comp.difference.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IC 95% différence</span>
                  <span>[{comp.meanDiffCI.ci_lower.toFixed(2)}, {comp.meanDiffCI.ci_upper.toFixed(2)}]</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual difference indicator */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Favorise:</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    comp.difference > 0 ? 'bg-primary-500' : 'bg-purple-500'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.abs(comp.difference) * 10 + 50)}%`,
                    marginLeft: comp.difference < 0 ? 'auto' : 0,
                  }}
                />
              </div>
              <span className="text-sm font-medium">
                {comp.favoredGroup === 'group' ? 'Groupe' : comp.favoredGroup === 'independent' ? 'Indépendant' : 'Aucun'}
              </span>
            </div>
          </div>
        </div>
      ))}

      {/* Correlation with Satisfaction */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Corrélations avec la satisfaction globale (Spearman rho)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Groupe dentaire</h4>
            <div className="space-y-2">
              {Object.entries(data.correlations?.group || {}).map(([key, value]: [string, any]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-600">{key}</span>
                  <span className={value > 0.5 ? 'text-green-600 font-medium' : ''}>
                    {value.toFixed(3)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Indépendant</h4>
            <div className="space-y-2">
              {Object.entries(data.correlations?.independent || {}).map(([key, value]: [string, any]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-600">{key}</span>
                  <span className={value > 0.5 ? 'text-green-600 font-medium' : ''}>
                    {value.toFixed(3)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ACTIVITY TAB
// ============================================

function ActivityTab({ data }: { data: AnalysisData }) {
  const segments = data.activityAnalysis?.segments || [];
  const segmentLabels: Record<string, string> = {
    preventifs: 'Soins préventifs',
    hygiene: 'Hygiène de base',
    protheses: 'Prothèses',
    implants: 'Implants',
    orthodontie: 'Orthodontie/Esthétique',
  };

  const currentData = segments.map((seg: string) => ({
    name: segmentLabels[seg] || seg,
    group: data.activityAnalysis?.current?.[seg]?.group?.mean || 0,
    independent: data.activityAnalysis?.current?.[seg]?.independent?.mean || 0,
  }));

  const futureData = segments.map((seg: string) => ({
    name: segmentLabels[seg] || seg,
    group: data.activityAnalysis?.future?.[seg]?.group?.mean || 0,
    independent: data.activityAnalysis?.future?.[seg]?.independent?.mean || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Activity */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Répartition actuelle de l'activité (%)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentData} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 50]} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                <Legend />
                <Bar dataKey="group" name="Groupe" fill="#0ea5e9" />
                <Bar dataKey="independent" name="Indépendant" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Future Activity */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Répartition anticipée dans 5 ans (%)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={futureData} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 50]} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                <Legend />
                <Bar dataKey="group" name="Groupe" fill="#0ea5e9" />
                <Bar dataKey="independent" name="Indépendant" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl p-6 shadow-sm overflow-x-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Détail par segment</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Segment</th>
              <th className="text-center py-2" colSpan={2}>Actuel (%)</th>
              <th className="text-center py-2" colSpan={2}>Dans 5 ans (%)</th>
              <th className="text-center py-2" colSpan={2}>Évolution</th>
            </tr>
            <tr className="border-b text-gray-500">
              <th></th>
              <th className="text-center py-1">Groupe</th>
              <th className="text-center py-1">Indép.</th>
              <th className="text-center py-1">Groupe</th>
              <th className="text-center py-1">Indép.</th>
              <th className="text-center py-1">Groupe</th>
              <th className="text-center py-1">Indép.</th>
            </tr>
          </thead>
          <tbody>
            {segments.map((seg: string) => {
              const currentG = data.activityAnalysis?.current?.[seg]?.group?.mean || 0;
              const currentI = data.activityAnalysis?.current?.[seg]?.independent?.mean || 0;
              const futureG = data.activityAnalysis?.future?.[seg]?.group?.mean || 0;
              const futureI = data.activityAnalysis?.future?.[seg]?.independent?.mean || 0;
              const diffG = futureG - currentG;
              const diffI = futureI - currentI;

              return (
                <tr key={seg} className="border-b">
                  <td className="py-2">{segmentLabels[seg]}</td>
                  <td className="text-center">{currentG.toFixed(1)}</td>
                  <td className="text-center">{currentI.toFixed(1)}</td>
                  <td className="text-center">{futureG.toFixed(1)}</td>
                  <td className="text-center">{futureI.toFixed(1)}</td>
                  <td className={`text-center ${diffG > 0 ? 'text-green-600' : diffG < 0 ? 'text-red-600' : ''}`}>
                    {diffG > 0 ? '+' : ''}{diffG.toFixed(1)}
                  </td>
                  <td className={`text-center ${diffI > 0 ? 'text-green-600' : diffI < 0 ? 'text-red-600' : ''}`}>
                    {diffI > 0 ? '+' : ''}{diffI.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// PERCEPTION TAB
// ============================================

function PerceptionTab({ data }: { data: AnalysisData }) {
  const perception = data.perceptionAnalysis;

  if (!perception || perception.total === 0) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm text-center">
        <p className="text-gray-600">
          Pas encore de réponses d'indépendants pour l'analyse des perceptions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Likelihood to Join */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Intention de rejoindre un groupe dentaire (n={perception.total})
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { key: 'certainlyYes', label: 'Oui, certainement', color: 'green' },
            { key: 'maybeYes', label: 'Oui, peut-être', color: 'blue' },
            { key: 'probablyNot', label: 'Non, probablement pas', color: 'yellow' },
            { key: 'certainlyNot', label: 'Non, certainement pas', color: 'red' },
          ].map((item) => {
            const value = perception.likelihoodToJoin[item.key];
            return (
              <div key={item.key} className="bg-gray-50 rounded-lg p-4 text-center">
                <div className={`text-2xl font-bold text-${item.color}-600`}>
                  {value.pct.toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600 mt-1">{item.label}</div>
                <div className="text-xs text-gray-400">(n={value.count})</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Perceived Advantages */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Avantages perçus des groupes dentaires
          </h3>
          <div className="space-y-3">
            {perception.perceivedAdvantages.map((adv: any) => (
              <div key={adv.code} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{adv.label}</span>
                    <span className="text-gray-500">{adv.pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${adv.pct}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm text-gray-400 w-8">(n={adv.count})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reluctances */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Réticences vis-à-vis des groupes dentaires
          </h3>
          <div className="space-y-3">
            {perception.reluctances.map((rel: any) => (
              <div key={rel.code} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{rel.label}</span>
                    <span className="text-gray-500">{rel.pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-400 rounded-full"
                      style={{ width: `${rel.pct}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm text-gray-400 w-8">(n={rel.count})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Perception Gap Analysis */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Analyse de l'écart perception-réalité
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Comparaison entre ce que les indépendants perçoivent et la satisfaction réelle des dentistes en groupe.
        </p>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 italic">
            Cette analyse sera enrichie au fur et à mesure de la collecte des données,
            permettant de comparer les avantages perçus (Q21) avec les scores réels de satisfaction
            des dentistes en groupe sur chaque dimension.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// STRUCTURES TAB
// ============================================

function StructuresTab({ data }: { data: AnalysisData }) {
  const structureData = data.structureAnalysis;

  if (!structureData?.byStructure || structureData.byStructure.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm text-center">
        <p className="text-gray-600">
          Pas encore assez de réponses par structure pour l'analyse comparative.
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Minimum {structureData?.minN || 3} réponses par structure requis.
        </p>
      </div>
    );
  }

  const structures = structureData.byStructure;
  const themes = ['Administrative', 'Development', 'Education', 'Technology', 'Quality', 'Collaboration', 'Safety', 'WorkLife', 'Satisfaction'];

  // Prepare data for ranking chart
  const rankingData = structures.map((s: any) => ({
    name: getStructureLabel(s.structure),
    score: s.overallScore,
    n: s.n,
  }));

  // Prepare data for theme comparison
  const themeComparisonData = themes.map(theme => {
    const row: any = { theme: getThemeLabel(theme) };
    structures.forEach((s: any) => {
      row[s.structure] = s.themes[theme]?.mean || 0;
    });
    return row;
  });

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
        <strong>Note:</strong> Comparaisons entre structures dentaires (minimum n={structureData.minN} par structure).
        Les structures avec moins de réponses ne sont pas affichées.
      </div>

      {/* Overall Ranking */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Classement global par structure (score moyen 0-10)
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rankingData} layout="vertical" margin={{ left: 120 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 10]} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number, name: string, props: any) => [
                  `${value.toFixed(2)} (n=${props.payload.n})`,
                  'Score moyen'
                ]}
              />
              <Bar dataKey="score" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                {rankingData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#22c55e' : index === rankingData.length - 1 ? '#ef4444' : '#8b5cf6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Theme-by-Theme Comparison Table */}
      <div className="bg-white rounded-xl p-6 shadow-sm overflow-x-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Comparaison par thème
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-2">Thème</th>
              {structures.map((s: any) => (
                <th key={s.structure} className="text-center py-2 px-2">
                  <div>{getStructureLabel(s.structure)}</div>
                  <div className="text-xs text-gray-400 font-normal">(n={s.n})</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {themes.map((theme) => {
              const values = structures.map((s: any) => s.themes[theme]?.mean || 0);
              const maxVal = Math.max(...values);
              const minVal = Math.min(...values);

              return (
                <tr key={theme} className="border-b">
                  <td className="py-2 px-2 font-medium">{getThemeLabel(theme)}</td>
                  {structures.map((s: any) => {
                    const val = s.themes[theme]?.mean || 0;
                    const isMax = val === maxVal && maxVal !== minVal;
                    const isMin = val === minVal && maxVal !== minVal;
                    return (
                      <td
                        key={s.structure}
                        className={`text-center py-2 px-2 ${
                          isMax ? 'bg-green-50 text-green-700 font-semibold' :
                          isMin ? 'bg-red-50 text-red-700' : ''
                        }`}
                      >
                        {val.toFixed(1)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pairwise Comparisons */}
      {structureData.pairwiseComparisons && structureData.pairwiseComparisons.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Comparaisons pairées (Satisfaction globale)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Structure 1</th>
                  <th className="text-left py-2">Structure 2</th>
                  <th className="text-center py-2">Différence</th>
                  <th className="text-center py-2">Effet (r)</th>
                  <th className="text-center py-2">Interprétation</th>
                </tr>
              </thead>
              <tbody>
                {structureData.pairwiseComparisons.map((comp: any, idx: number) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2">
                      {getStructureLabel(comp.structure1)}
                      <span className="text-gray-400 text-xs ml-1">(n={comp.n1})</span>
                    </td>
                    <td className="py-2">
                      {getStructureLabel(comp.structure2)}
                      <span className="text-gray-400 text-xs ml-1">(n={comp.n2})</span>
                    </td>
                    <td className={`text-center py-2 ${comp.diff > 0 ? 'text-green-600' : comp.diff < 0 ? 'text-red-600' : ''}`}>
                      {comp.diff > 0 ? '+' : ''}{comp.diff.toFixed(2)}
                    </td>
                    <td className="text-center py-2">
                      {comp.effectSize.toFixed(3)}
                    </td>
                    <td className="text-center py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getEffectBadgeClass(comp.effectSize)}`}>
                        {getEffectLabel(comp.effectSize)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Structure Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {structures.map((s: any) => (
          <div key={s.structure} className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {getStructureLabel(s.structure)}
              </h3>
              <span className="text-sm text-gray-500">n={s.n}</span>
            </div>
            <div className="space-y-2">
              {themes.map(theme => {
                const stats = s.themes[theme];
                if (!stats || stats.n === 0) return null;
                return (
                  <div key={theme} className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 w-24">{getThemeLabel(theme)}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${(stats.mean / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-10 text-right">{stats.mean.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Score global moyen</span>
                <span className="font-semibold text-primary-600">{s.overallScore.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getThemeLabel(theme: string): string {
  const labels: Record<string, string> = {
    Administrative: 'Admin.',
    Development: 'Dév. pro.',
    Education: 'Formation',
    Technology: 'Techno.',
    Quality: 'Qualité',
    Collaboration: 'Collab.',
    Safety: 'Sécurité',
    WorkLife: 'Équilibre',
    Satisfaction: 'Satisfaction',
  };
  return labels[theme] || theme;
}

function getEffectBadgeClass(r: number): string {
  const absR = Math.abs(r);
  if (absR >= 0.5) return 'bg-green-100 text-green-700';
  if (absR >= 0.3) return 'bg-yellow-100 text-yellow-700';
  return 'bg-gray-100 text-gray-600';
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getStructureLabel(code: string): string {
  const labels: Record<string, string> = {
    white_cabinets: 'White Cabinets',
    zahnarztzentrum: 'Zahnarztzentrum.ch',
    cheeze: 'Cheeze',
    ardentis: 'Ardentis',
    chd: 'CHD',
    adent: 'Adent',
    panadent: 'Panadent',
    dentalys: 'Dentalys',
    clinident: 'Clinident',
    adent_dental: 'Adent Dental',
    pure_clinic: 'Pure Clinic',
    dentalgroup: 'Dentalgroup.ch',
    urbadental: 'Urbadental',
    prefer_not_say: 'Non précisé',
    other: 'Autre',
  };
  return labels[code] || code;
}

function getEffectLabel(r: number): string {
  const absR = Math.abs(r);
  if (absR < 0.1) return 'négligeable';
  if (absR < 0.3) return 'faible';
  if (absR < 0.5) return 'moyen';
  return 'fort';
}

function getEffectClass(r: number): string {
  const absR = Math.abs(r);
  if (absR >= 0.5) return 'text-green-600 font-medium';
  if (absR >= 0.3) return 'text-yellow-600';
  return '';
}
