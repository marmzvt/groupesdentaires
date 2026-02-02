import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  computeDescriptives,
  runGroupComparison,
  benjaminiHochberg,
  calculateCompositeIndex,
  spearmanCorrelation,
  mannWhitneyU,
  mean,
  GroupComparisonResult,
  CompositeIndex,
  DescriptiveStats,
} from '@/lib/stats';

// Variable pairs for comparison
const variablePairs = [
  { name: 'Administrative Efficiency', theme: 'Efficacité administrative', groupKey: 'Q4', indepKey: 'Q4i' },
  { name: 'Professional Development', theme: 'Développement professionnel', groupKey: 'Q5', indepKey: 'Q5i' },
  { name: 'Continuing Education', theme: 'Formation continue', groupKey: 'Q6', indepKey: 'Q6i' },
  { name: 'Technology Access', theme: 'Accès aux technologies', groupKey: 'Q7', indepKey: 'Q7i' },
  { name: 'Clinical Quality', theme: 'Qualité clinique', groupKey: 'Q8', indepKey: 'Q8i' },
  { name: 'Peer Collaboration', theme: 'Collaboration confrères', groupKey: 'Q9', indepKey: 'Q9i' },
  { name: 'Professional Safety', theme: 'Sécurité professionnelle', groupKey: 'Q11', indepKey: 'Q10i' },
  { name: 'Work-Life Balance', theme: 'Équilibre vie pro/perso', groupKey: 'Q12', indepKey: 'Q11i' },
  { name: 'Overall Satisfaction', theme: 'Satisfaction globale', groupKey: 'Q13', indepKey: 'Q12i' },
];

// Composite index definitions
const compositeDefinitions = [
  { name: 'Operational Support', components: ['Q4', 'Q7'], indepComponents: ['Q4i', 'Q7i'] },
  { name: 'Professional Growth', components: ['Q5', 'Q6'], indepComponents: ['Q5i', 'Q6i'] },
  { name: 'Practice Environment', components: ['Q8', 'Q9'], indepComponents: ['Q8i', 'Q9i'] },
  { name: 'Personal Wellbeing', components: ['Q11', 'Q12'], indepComponents: ['Q10i', 'Q11i'] },
];

// Activity segments (v2: 7 segments)
const activitySegments = ['preventifs', 'conservateurs', 'protheses', 'implants', 'parodontologie', 'orthodontie', 'esthetique'];

export async function GET() {
  try {
    // Fetch all completed responses
    const responses = await prisma.response.findMany({
      where: { completed: true },
      select: { data: true, createdAt: true },
    });

    if (responses.length === 0) {
      return NextResponse.json({
        error: 'No completed responses yet',
        sampleSize: { total: 0, group: 0, independent: 0 },
      });
    }

    // Separate by practice type (Q0)
    const groupResponses: any[] = []; // Q0 = 'A'
    const independentResponses: any[] = []; // Q0 = 'B' or 'C'

    for (const response of responses) {
      const data = response.data as Record<string, any>;
      if (data.Q0 === 'A') {
        groupResponses.push(data);
      } else if (data.Q0 === 'B' || data.Q0 === 'C') {
        independentResponses.push(data);
      }
    }

    // Sample size info
    const sampleSize = {
      total: responses.length,
      group: groupResponses.length,
      independent: independentResponses.length,
      byStructure: countByStructure(groupResponses),
    };

    // Extract numeric values for each variable
    const extractValues = (responses: any[], key: string): number[] => {
      return responses
        .map(r => r[key])
        .filter(v => v !== null && v !== undefined && typeof v === 'number');
    };

    // Run comparisons for all 9 themes
    const comparisons: GroupComparisonResult[] = [];
    for (const pair of variablePairs) {
      const groupData = extractValues(groupResponses, pair.groupKey);
      const indepData = extractValues(independentResponses, pair.indepKey);

      if (groupData.length > 0 || indepData.length > 0) {
        comparisons.push(runGroupComparison(groupData, indepData, pair.name, pair.theme));
      }
    }

    // Apply multiple comparison correction
    const pValues = comparisons.map(c => ({
      variable: c.variable,
      pValue: c.mannWhitney.pValue,
    }));
    const correctedPValues = benjaminiHochberg(pValues);

    // Merge corrected p-values into comparisons
    const comparisonsWithCorrection = comparisons.map(comp => {
      const corrected = correctedPValues.find(p => p.variable === comp.variable);
      return {
        ...comp,
        adjustedPValue: corrected?.adjustedPValue || comp.mannWhitney.pValue,
        significantAfterCorrection: corrected?.significant || false,
      };
    });

    // Calculate composite indices
    const composites: CompositeIndex[] = [];
    for (const def of compositeDefinitions) {
      const groupScores: number[] = [];
      const indepScores: number[] = [];

      for (const response of groupResponses) {
        const values = def.components.map(k => response[k]).filter(v => typeof v === 'number');
        if (values.length > 0) groupScores.push(mean(values));
      }

      for (const response of independentResponses) {
        const values = def.indepComponents.map(k => response[k]).filter(v => typeof v === 'number');
        if (values.length > 0) indepScores.push(mean(values));
      }

      composites.push(calculateCompositeIndex(groupScores, indepScores, def.name, def.components));
    }

    // Activity segment analysis
    const activityAnalysis = analyzeActivitySegments(groupResponses, independentResponses);

    // Perception analysis (Q20-Q22 for independents only)
    const perceptionAnalysis = analyzePerceptions(independentResponses);

    // Correlation with overall satisfaction
    const correlations = calculateSatisfactionCorrelations(groupResponses, independentResponses);

    // Structure-level analysis (only if enough responses)
    const structureAnalysis = analyzeByStructure(groupResponses);

    // Profile statistics
    const profileStats = {
      yearsExperience: {
        group: computeDescriptives(extractValues(groupResponses, 'Q1').map(y => 2025 - y)),
        independent: computeDescriptives(extractValues(independentResponses, 'Q1').map(y => 2025 - y)),
      },
      yearsInStructure: {
        group: computeDescriptives(extractValues(groupResponses, 'Q3')),
        independent: computeDescriptives(extractValues(independentResponses, 'Q3')),
      },
    };

    return NextResponse.json({
      sampleSize,
      comparisons: comparisonsWithCorrection,
      composites,
      activityAnalysis,
      perceptionAnalysis,
      correlations,
      structureAnalysis,
      profileStats,
      methodology: {
        tests: 'Mann-Whitney U (non-parametric)',
        effectSize: 'Rank-biserial correlation, Hedges\' g, CLES',
        multipleComparison: 'Benjamini-Hochberg FDR correction',
        confidenceIntervals: 'Bootstrap (2000 iterations)',
      },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Failed to compute analysis' }, { status: 500 });
  }
}

function countByStructure(responses: any[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of responses) {
    const structure = r.Q16 || 'unknown';
    counts[structure] = (counts[structure] || 0) + 1;
  }
  return counts;
}

function analyzeActivitySegments(groupResponses: any[], independentResponses: any[]) {
  const extractSegment = (responses: any[], questionKey: string, segment: string): number[] => {
    return responses
      .map(r => r[questionKey]?.[segment])
      .filter(v => typeof v === 'number');
  };

  const current: Record<string, { group: DescriptiveStats; independent: DescriptiveStats }> = {};
  const future: Record<string, { group: DescriptiveStats; independent: DescriptiveStats }> = {};

  for (const segment of activitySegments) {
    current[segment] = {
      group: computeDescriptives(extractSegment(groupResponses, 'Q14b', segment)),
      independent: computeDescriptives(extractSegment(independentResponses, 'Q14b', segment)),
    };
    future[segment] = {
      group: computeDescriptives(extractSegment(groupResponses, 'Q15b', segment)),
      independent: computeDescriptives(extractSegment(independentResponses, 'Q15b', segment)),
    };
  }

  return { current, future, segments: activitySegments };
}

function analyzePerceptions(independentResponses: any[]) {
  // Q20: Likelihood of joining
  const q20Counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  // Q21: Perceived advantages (v2: 10 options)
  const q21Counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0 };
  // Q22: Reluctances (v2: 7 options)
  const q22Counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, J: 0 };

  for (const r of independentResponses) {
    if (r.Q20) q20Counts[r.Q20] = (q20Counts[r.Q20] || 0) + 1;
    if (Array.isArray(r.Q21)) {
      for (const v of r.Q21) q21Counts[v] = (q21Counts[v] || 0) + 1;
    }
    if (Array.isArray(r.Q22)) {
      for (const v of r.Q22) q22Counts[v] = (q22Counts[v] || 0) + 1;
    }
  }

  const total = independentResponses.length;

  return {
    likelihoodToJoin: {
      certainlyYes: { count: q20Counts.A, pct: total > 0 ? (q20Counts.A / total) * 100 : 0 },
      maybeYes: { count: q20Counts.B, pct: total > 0 ? (q20Counts.B / total) * 100 : 0 },
      probablyNot: { count: q20Counts.C, pct: total > 0 ? (q20Counts.C / total) * 100 : 0 },
      certainlyNot: { count: q20Counts.D, pct: total > 0 ? (q20Counts.D / total) * 100 : 0 },
    },
    perceivedAdvantages: Object.entries(q21Counts).map(([k, v]) => ({
      code: k,
      label: getAdvantageLabel(k),
      count: v,
      pct: total > 0 ? (v / total) * 100 : 0,
    })).sort((a, b) => b.count - a.count),
    reluctances: Object.entries(q22Counts).map(([k, v]) => ({
      code: k,
      label: getReluctanceLabel(k),
      count: v,
      pct: total > 0 ? (v / total) * 100 : 0,
    })).sort((a, b) => b.count - a.count),
    total,
  };
}

function getAdvantageLabel(code: string): string {
  const labels: Record<string, string> = {
    A: 'Soutien administratif',
    B: 'Technologies avancees',
    C: 'Collaboration confreres',
    D: 'Formation continue',
    E: 'Equilibre vie pro/perso',
    F: 'Securite financiere',
    G: 'Aucun avantage percu',
    H: 'Planification retraite',
    I: 'Transmission patientele',
    J: 'Securite en cas de maladie',
  };
  return labels[code] || code;
}

function getReluctanceLabel(code: string): string {
  const labels: Record<string, string> = {
    A: 'Perte autonomie clinique',
    B: 'Pression productivite',
    C: 'Remuneration moins avantageuse',
    D: 'Relation patients',
    E: 'Standardisation pratiques',
    F: 'Aucune reticence',
    J: 'Regard et evaluation du travail',
  };
  return labels[code] || code;
}

function calculateSatisfactionCorrelations(groupResponses: any[], independentResponses: any[]) {
  // Correlate each theme with overall satisfaction
  const groupCorrelations: Record<string, number> = {};
  const indepCorrelations: Record<string, number> = {};

  const themes = [
    { key: 'Q4', name: 'Administrative' },
    { key: 'Q5', name: 'Development' },
    { key: 'Q6', name: 'Education' },
    { key: 'Q8', name: 'Quality' },
    { key: 'Q9', name: 'Collaboration' },
    { key: 'Q11', name: 'Safety' },
    { key: 'Q12', name: 'WorkLife' },
  ];

  const indepThemes = [
    { key: 'Q4i', name: 'Administrative' },
    { key: 'Q5i', name: 'Development' },
    { key: 'Q6i', name: 'Education' },
    { key: 'Q8i', name: 'Quality' },
    { key: 'Q9i', name: 'Collaboration' },
    { key: 'Q10i', name: 'Safety' },
    { key: 'Q11i', name: 'WorkLife' },
  ];

  // Group correlations with Q13
  const groupSatisfaction = groupResponses.map(r => r.Q13).filter(v => typeof v === 'number');
  for (const theme of themes) {
    const themeValues = groupResponses.map(r => r[theme.key]).filter(v => typeof v === 'number');
    const result = spearmanCorrelation(themeValues, groupSatisfaction);
    groupCorrelations[theme.name] = result.rho;
  }

  // Independent correlations with Q12i
  const indepSatisfaction = independentResponses.map(r => r.Q12i).filter(v => typeof v === 'number');
  for (const theme of indepThemes) {
    const themeValues = independentResponses.map(r => r[theme.key]).filter(v => typeof v === 'number');
    const result = spearmanCorrelation(themeValues, indepSatisfaction);
    indepCorrelations[theme.name] = result.rho;
  }

  return { group: groupCorrelations, independent: indepCorrelations };
}

function analyzeByStructure(groupResponses: any[]) {
  // Group by Q16 (structure)
  const byStructure: Record<string, any[]> = {};
  for (const r of groupResponses) {
    const structure = r.Q16 || 'unknown';
    if (!byStructure[structure]) byStructure[structure] = [];
    byStructure[structure].push(r);
  }

  // Analyze all structures with n >= 3 (relaxed for small samples)
  const MIN_N = 3;
  const structureThemes = ['Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q11', 'Q12', 'Q13'];
  const themeNames: Record<string, string> = {
    Q4: 'Administrative',
    Q5: 'Development',
    Q6: 'Education',
    Q7: 'Technology',
    Q8: 'Quality',
    Q9: 'Collaboration',
    Q11: 'Safety',
    Q12: 'WorkLife',
    Q13: 'Satisfaction',
  };

  const results: Record<string, {
    n: number;
    themes: Record<string, DescriptiveStats>;
    overallScore: number;
  }> = {};

  for (const [structure, responses] of Object.entries(byStructure)) {
    if (responses.length >= MIN_N && structure !== 'unknown' && structure !== 'prefer_not_say') {
      const themes: Record<string, DescriptiveStats> = {};
      const allScores: number[] = [];

      for (const themeKey of structureThemes) {
        const values = responses
          .map(r => r[themeKey])
          .filter(v => typeof v === 'number');
        themes[themeNames[themeKey]] = computeDescriptives(values);
        allScores.push(...values);
      }

      results[structure] = {
        n: responses.length,
        themes,
        overallScore: allScores.length > 0 ? mean(allScores) : 0,
      };
    }
  }

  // Sort by overall score descending
  const sortedStructures = Object.entries(results)
    .sort((a, b) => b[1].overallScore - a[1].overallScore)
    .map(([key, value]) => ({ structure: key, ...value }));

  // Pairwise comparisons between structures (if at least 2 structures with n >= MIN_N)
  const structureKeys = Object.keys(results).filter(k => results[k].n >= MIN_N);
  const pairwiseComparisons: {
    structure1: string;
    structure2: string;
    theme: string;
    diff: number;
    effectSize: number;
    n1: number;
    n2: number;
  }[] = [];

  if (structureKeys.length >= 2) {
    // Compare on overall satisfaction (Q13)
    for (let i = 0; i < structureKeys.length; i++) {
      for (let j = i + 1; j < structureKeys.length; j++) {
        const s1 = structureKeys[i];
        const s2 = structureKeys[j];
        const data1 = byStructure[s1].map(r => r.Q13).filter(v => typeof v === 'number');
        const data2 = byStructure[s2].map(r => r.Q13).filter(v => typeof v === 'number');

        if (data1.length >= MIN_N && data2.length >= MIN_N) {
          const mw = mannWhitneyU(data1, data2);
          pairwiseComparisons.push({
            structure1: s1,
            structure2: s2,
            theme: 'Satisfaction',
            diff: mean(data1) - mean(data2),
            effectSize: mw.effectSize,
            n1: data1.length,
            n2: data2.length,
          });
        }
      }
    }
  }

  return {
    byStructure: sortedStructures,
    pairwiseComparisons,
    minN: MIN_N,
  };
}
