/**
 * Statistical Analysis Library for Small Samples
 * Designed for n=30-50 with robust non-parametric methods
 */

// ============================================
// BASIC STATISTICS
// ============================================

export function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function variance(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return arr.reduce((sum, x) => sum + (x - m) ** 2, 0) / (arr.length - 1);
}

export function standardDeviation(arr: number[]): number {
  return Math.sqrt(variance(arr));
}

export function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const n = sorted.length;
  const rank = (p / 100) * (n - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  const frac = rank - lower;
  if (upper >= n) return sorted[n - 1];
  return sorted[lower] * (1 - frac) + sorted[upper] * frac;
}

export interface DescriptiveStats {
  n: number;
  mean: number;
  median: number;
  sd: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  iqr: number;
}

export function computeDescriptives(arr: number[]): DescriptiveStats {
  const filtered = arr.filter(x => x !== null && x !== undefined && !isNaN(x));
  if (filtered.length === 0) {
    return { n: 0, mean: 0, median: 0, sd: 0, min: 0, max: 0, q1: 0, q3: 0, iqr: 0 };
  }
  const sorted = [...filtered].sort((a, b) => a - b);
  const q1 = percentile(sorted, 25);
  const q3 = percentile(sorted, 75);

  return {
    n: filtered.length,
    mean: mean(filtered),
    median: median(filtered),
    sd: standardDeviation(filtered),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    q1,
    q3,
    iqr: q3 - q1,
  };
}

// ============================================
// NORMAL DISTRIBUTION FUNCTIONS
// ============================================

function normalCDF(z: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * z);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

  return 0.5 * (1.0 + sign * y);
}

function normalQuantile(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;

  const a = [
    -3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
    1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00
  ];
  const b = [
    -5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
    6.680131188771972e+01, -1.328068155288572e+01
  ];
  const c = [
    -7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
    -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00
  ];
  const d = [
    7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q: number, r: number;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
}

// ============================================
// MANN-WHITNEY U TEST (Non-parametric)
// ============================================

export interface MannWhitneyResult {
  U: number;
  z: number;
  pValue: number;
  effectSize: number; // rank-biserial correlation
  n1: number;
  n2: number;
}

export function mannWhitneyU(group1: number[], group2: number[]): MannWhitneyResult {
  const g1 = group1.filter(x => x !== null && x !== undefined && !isNaN(x));
  const g2 = group2.filter(x => x !== null && x !== undefined && !isNaN(x));

  const n1 = g1.length;
  const n2 = g2.length;

  if (n1 === 0 || n2 === 0) {
    return { U: 0, z: 0, pValue: 1, effectSize: 0, n1, n2 };
  }

  const N = n1 + n2;

  // Combine and rank all values
  const combined: { value: number; group: number }[] = [
    ...g1.map(v => ({ value: v, group: 1 })),
    ...g2.map(v => ({ value: v, group: 2 }))
  ];

  combined.sort((a, b) => a.value - b.value);

  // Assign ranks with tie handling
  const ranks: number[] = new Array(N);
  let i = 0;
  while (i < N) {
    let j = i;
    while (j < N && combined[j].value === combined[i].value) {
      j++;
    }
    const avgRank = (i + 1 + j) / 2;
    for (let k = i; k < j; k++) {
      ranks[k] = avgRank;
    }
    i = j;
  }

  // Sum ranks for group 1
  let R1 = 0;
  for (let k = 0; k < N; k++) {
    if (combined[k].group === 1) {
      R1 += ranks[k];
    }
  }

  // Calculate U statistics
  const U1 = R1 - (n1 * (n1 + 1)) / 2;
  const U2 = n1 * n2 - U1;
  const U = Math.min(U1, U2);

  // Calculate z-score
  const meanU = (n1 * n2) / 2;
  const varU = (n1 * n2 * (N + 1)) / 12;
  const stdU = Math.sqrt(varU);

  const z = stdU > 0 ? (U1 - meanU) / stdU : 0;
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));

  // Rank-biserial correlation (effect size)
  const effectSize = n1 * n2 > 0 ? 1 - (2 * U) / (n1 * n2) : 0;

  return { U, z, pValue, effectSize, n1, n2 };
}

// ============================================
// COMMON LANGUAGE EFFECT SIZE
// ============================================

export function commonLanguageEffectSize(group1: number[], group2: number[]): number {
  const g1 = group1.filter(x => x !== null && x !== undefined && !isNaN(x));
  const g2 = group2.filter(x => x !== null && x !== undefined && !isNaN(x));

  if (g1.length === 0 || g2.length === 0) return 0.5;

  let favorable = 0;
  let ties = 0;

  for (const x of g1) {
    for (const y of g2) {
      if (x > y) favorable++;
      else if (x === y) ties++;
    }
  }

  return (favorable + 0.5 * ties) / (g1.length * g2.length);
}

// ============================================
// HEDGES' G (Bias-corrected effect size)
// ============================================

export function hedgesG(group1: number[], group2: number[]): number {
  const g1 = group1.filter(x => x !== null && x !== undefined && !isNaN(x));
  const g2 = group2.filter(x => x !== null && x !== undefined && !isNaN(x));

  const n1 = g1.length;
  const n2 = g2.length;

  if (n1 < 2 || n2 < 2) return 0;

  const mean1 = mean(g1);
  const mean2 = mean(g2);
  const var1 = variance(g1);
  const var2 = variance(g2);

  const pooledSD = Math.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2));
  if (pooledSD === 0) return 0;

  const cohensD = (mean1 - mean2) / pooledSD;

  // Hedges' correction for small samples
  const correctionFactor = 1 - 3 / (4 * (n1 + n2) - 9);
  return cohensD * correctionFactor;
}

// ============================================
// BOOTSTRAP CONFIDENCE INTERVALS
// ============================================

function bootstrapSample(data: number[]): number[] {
  const n = data.length;
  const sample: number[] = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * n);
    sample.push(data[idx]);
  }
  return sample;
}

export interface BootstrapCIResult {
  estimate: number;
  ci_lower: number;
  ci_upper: number;
  se: number;
}

export function bootstrapMeanDifferenceCI(
  group1: number[],
  group2: number[],
  nBootstrap: number = 2000,
  alpha: number = 0.05
): BootstrapCIResult {
  const g1 = group1.filter(x => x !== null && x !== undefined && !isNaN(x));
  const g2 = group2.filter(x => x !== null && x !== undefined && !isNaN(x));

  if (g1.length === 0 || g2.length === 0) {
    return { estimate: 0, ci_lower: 0, ci_upper: 0, se: 0 };
  }

  const observedDiff = mean(g1) - mean(g2);
  const diffs: number[] = [];

  for (let i = 0; i < nBootstrap; i++) {
    const sample1 = bootstrapSample(g1);
    const sample2 = bootstrapSample(g2);
    diffs.push(mean(sample1) - mean(sample2));
  }

  diffs.sort((a, b) => a - b);

  const lowerIdx = Math.floor((alpha / 2) * nBootstrap);
  const upperIdx = Math.floor((1 - alpha / 2) * nBootstrap);

  return {
    estimate: observedDiff,
    ci_lower: diffs[lowerIdx],
    ci_upper: diffs[upperIdx],
    se: standardDeviation(diffs),
  };
}

// ============================================
// BENJAMINI-HOCHBERG CORRECTION
// ============================================

export interface MultipleComparisonResult {
  variable: string;
  pValue: number;
  adjustedPValue: number;
  significant: boolean;
}

export function benjaminiHochberg(
  results: { variable: string; pValue: number }[],
  alpha: number = 0.05
): MultipleComparisonResult[] {
  const m = results.length;
  if (m === 0) return [];

  // Sort by p-value
  const sorted = [...results].sort((a, b) => a.pValue - b.pValue);

  // Find largest k where p(k) <= k/m * alpha
  let lastSignificantRank = 0;
  for (let i = 0; i < m; i++) {
    const rank = i + 1;
    const bhCritical = (rank / m) * alpha;
    if (sorted[i].pValue <= bhCritical) {
      lastSignificantRank = rank;
    }
  }

  // Calculate adjusted p-values
  const adjP: number[] = new Array(m);
  adjP[m - 1] = sorted[m - 1].pValue;

  for (let i = m - 2; i >= 0; i--) {
    const rank = i + 1;
    const adjusted = Math.min(sorted[i].pValue * (m / rank), adjP[i + 1]);
    adjP[i] = Math.min(adjusted, 1);
  }

  return sorted.map((item, i) => ({
    variable: item.variable,
    pValue: item.pValue,
    adjustedPValue: adjP[i],
    significant: (i + 1) <= lastSignificantRank,
  }));
}

// ============================================
// SPEARMAN CORRELATION
// ============================================

function assignRanks(arr: number[]): number[] {
  const indexed = arr.map((v, i) => ({ value: v, index: i }));
  indexed.sort((a, b) => a.value - b.value);

  const ranks: number[] = new Array(arr.length);
  let i = 0;

  while (i < arr.length) {
    let j = i;
    while (j < arr.length && indexed[j].value === indexed[i].value) {
      j++;
    }
    const avgRank = (i + 1 + j) / 2;
    for (let k = i; k < j; k++) {
      ranks[indexed[k].index] = avgRank;
    }
    i = j;
  }

  return ranks;
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const meanX = mean(x);
  const meanY = mean(y);

  let num = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denom = Math.sqrt(denomX * denomY);
  return denom > 0 ? num / denom : 0;
}

export interface SpearmanResult {
  rho: number;
  n: number;
}

export function spearmanCorrelation(x: number[], y: number[]): SpearmanResult {
  // Filter paired values
  const pairs: { x: number; y: number }[] = [];
  for (let i = 0; i < Math.min(x.length, y.length); i++) {
    if (x[i] !== null && y[i] !== null && !isNaN(x[i]) && !isNaN(y[i])) {
      pairs.push({ x: x[i], y: y[i] });
    }
  }

  if (pairs.length < 3) return { rho: 0, n: pairs.length };

  const ranksX = assignRanks(pairs.map(p => p.x));
  const ranksY = assignRanks(pairs.map(p => p.y));

  return {
    rho: pearsonCorrelation(ranksX, ranksY),
    n: pairs.length,
  };
}

// ============================================
// FULL COMPARISON RESULT
// ============================================

export interface GroupComparisonResult {
  variable: string;
  theme: string;
  groupStats: DescriptiveStats;
  independentStats: DescriptiveStats;
  mannWhitney: MannWhitneyResult;
  effectSizes: {
    rankBiserial: number;
    hedgesG: number;
    cles: number;
  };
  meanDiffCI: BootstrapCIResult;
  difference: number;
  favoredGroup: 'group' | 'independent' | 'none';
}

export function runGroupComparison(
  groupData: number[],
  independentData: number[],
  variable: string,
  theme: string
): GroupComparisonResult {
  const groupStats = computeDescriptives(groupData);
  const independentStats = computeDescriptives(independentData);
  const mw = mannWhitneyU(groupData, independentData);
  const hg = hedgesG(groupData, independentData);
  const cles = commonLanguageEffectSize(groupData, independentData);
  const ci = bootstrapMeanDifferenceCI(groupData, independentData);

  const diff = groupStats.mean - independentStats.mean;
  let favored: 'group' | 'independent' | 'none' = 'none';
  if (Math.abs(diff) > 0.5) {
    favored = diff > 0 ? 'group' : 'independent';
  }

  return {
    variable,
    theme,
    groupStats,
    independentStats,
    mannWhitney: mw,
    effectSizes: {
      rankBiserial: mw.effectSize,
      hedgesG: hg,
      cles,
    },
    meanDiffCI: ci,
    difference: diff,
    favoredGroup: favored,
  };
}

// ============================================
// COMPOSITE INDICES
// ============================================

export interface CompositeIndex {
  name: string;
  components: string[];
  groupScore: number;
  independentScore: number;
  difference: number;
}

export function calculateCompositeIndex(
  groupScores: number[],
  independentScores: number[],
  name: string,
  components: string[]
): CompositeIndex {
  const groupFiltered = groupScores.filter(x => x !== null && x !== undefined && !isNaN(x));
  const indepFiltered = independentScores.filter(x => x !== null && x !== undefined && !isNaN(x));

  const groupScore = groupFiltered.length > 0 ? mean(groupFiltered) : 0;
  const independentScore = indepFiltered.length > 0 ? mean(indepFiltered) : 0;

  return {
    name,
    components,
    groupScore,
    independentScore,
    difference: groupScore - independentScore,
  };
}

// ============================================
// EFFECT SIZE INTERPRETATION
// ============================================

export function interpretEffectSize(r: number): string {
  const absR = Math.abs(r);
  if (absR < 0.1) return 'negligible';
  if (absR < 0.3) return 'small';
  if (absR < 0.5) return 'medium';
  return 'large';
}

export function interpretCLES(cles: number): string {
  // CLES = probability that random group dentist scores higher than random independent
  const pct = Math.round(cles * 100);
  if (pct >= 70) return `Group dentists score higher ${pct}% of the time`;
  if (pct >= 56) return `Slight advantage for group dentists (${pct}%)`;
  if (pct >= 44) return `No meaningful difference (${pct}%)`;
  if (pct >= 30) return `Slight advantage for independent dentists (${100 - pct}%)`;
  return `Independent dentists score higher ${100 - pct}% of the time`;
}
