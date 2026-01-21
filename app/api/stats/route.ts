import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Labels for options
const optionLabels: Record<string, Record<string | number, string>> = {
  Q2: {
    A: 'Cabinet individuel indépendant',
    B: 'Cabinet de groupe indépendant',
    C: 'Salarié(e) cabinet privé',
    D: 'Salarié(e) centre/groupe dentaire',
    E: 'Autre mode d\'exercice',
    F: 'Première expérience',
  },
  Q17: {
    oui: 'Oui',
    non: 'Non',
  },
  segments: {
    preventifs: 'Soins préventifs',
    hygiene: 'Soins d\'hygiène de base',
    protheses: 'Prothèses fixes et amovibles',
    implants: 'Implants',
    orthodontie: 'Orthodontie et soins esthétiques',
  },
};

// Text questions to collect
const textQuestions = [
  { id: 'Q16', title: 'Structure d\'exercice' },
];

// Force dynamic rendering (no caching)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse filter parameters
    const startYearFilter = searchParams.get('startYear');

    // Build where clause for filters
    const where: any = { completed: true };

    if (startYearFilter) {
      where.startYear = parseInt(startYearFilter);
    }

    // Get all completed responses with filters
    const responses = await prisma.response.findMany({
      where,
      select: { data: true, createdAt: true, structureName: true },
    });

    // Global counts (no filters)
    const total = await prisma.response.count();
    const totalCompleted = await prisma.response.count({ where: { completed: true } });

    // Final count after all filters
    const filteredCount = responses.length;

    // Aggregate stats for each question
    const questionStats: Record<string, any> = {};

    // Questions to analyze
    const questionsToAnalyze = [
      { id: 'Q1', type: 'numeric', title: 'Année de début d\'exercice' },
      { id: 'Q2', type: 'multiple', labels: optionLabels.Q2, title: 'Mode d\'exercice précédent' },
      { id: 'Q3', type: 'numeric', title: 'Années d\'affiliation' },
      { id: 'Q4', type: 'scale', title: 'Efficacité du soutien administratif' },
      { id: 'Q5', type: 'scale', title: 'Développement professionnel' },
      { id: 'Q6', type: 'scale', title: 'Accès à la formation continue' },
      { id: 'Q7', type: 'scale', title: 'Accès aux technologies' },
      { id: 'Q8', type: 'scale', title: 'Amélioration des résultats cliniques' },
      { id: 'Q9', type: 'scale', title: 'Présence de confrères' },
      { id: 'Q10', type: 'scale', title: 'Satisfaction des patients' },
      { id: 'Q11', type: 'scale', title: 'Sécurité risques professionnels' },
      { id: 'Q12', type: 'scale', title: 'Équilibre vie pro/perso' },
      { id: 'Q13', type: 'scale', title: 'Satisfaction décision' },
      { id: 'Q14', type: 'multiple', labels: optionLabels.segments, title: 'Segments actuels les plus actifs' },
      { id: 'Q14b', type: 'percentage', labels: optionLabels.segments, title: 'Répartition activité actuelle (%)' },
      { id: 'Q15', type: 'multiple', labels: optionLabels.segments, title: 'Segments anticipés en hausse' },
      { id: 'Q15b', type: 'percentage', labels: optionLabels.segments, title: 'Répartition activité future (%)' },
      { id: 'Q17', type: 'single', labels: optionLabels.Q17, title: 'Autorisation de contact' },
    ];

    for (const q of questionsToAnalyze) {
      const counts: Record<string, number> = {};
      const percentageSums: Record<string, number> = {};
      const percentageCounts: Record<string, number> = {};
      let numericValues: number[] = [];
      let answeredCount = 0;

      responses.forEach((r) => {
        const data = r.data as Record<string, any>;
        const answer = data[q.id];

        if (answer === undefined || answer === null) return;
        answeredCount++;

        if (q.type === 'single') {
          const key = String(answer);
          counts[key] = (counts[key] || 0) + 1;
        } else if (q.type === 'multiple') {
          const arr = Array.isArray(answer) ? answer : [answer];
          arr.forEach((v) => {
            const key = String(v);
            counts[key] = (counts[key] || 0) + 1;
          });
        } else if (q.type === 'numeric' || q.type === 'scale') {
          numericValues.push(Number(answer));
        } else if (q.type === 'percentage') {
          // Aggregate percentage distributions
          if (typeof answer === 'object' && answer !== null) {
            Object.entries(answer).forEach(([key, value]) => {
              const numValue = Number(value) || 0;
              percentageSums[key] = (percentageSums[key] || 0) + numValue;
              percentageCounts[key] = (percentageCounts[key] || 0) + 1;
            });
          }
        }
      });

      if (q.type === 'numeric' || q.type === 'scale') {
        const avg = numericValues.length > 0
          ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length
          : 0;
        questionStats[q.id] = {
          title: q.title,
          type: q.type,
          average: Math.round(avg * 10) / 10,
          min: numericValues.length > 0 ? Math.min(...numericValues) : 0,
          max: numericValues.length > 0 ? Math.max(...numericValues) : 0,
          count: numericValues.length,
          distribution: q.type === 'scale' ? Array.from({ length: 11 }, (_, i) => ({
            value: i,
            label: String(i),
            count: numericValues.filter(v => v === i).length,
          })) : undefined,
        };
      } else if (q.type === 'percentage') {
        // Calculate average percentages
        const avgPercentages = Object.entries(percentageSums).map(([key, sum]) => ({
          value: key,
          label: q.labels?.[key] || key,
          avgPercentage: percentageCounts[key] > 0
            ? Math.round((sum / percentageCounts[key]) * 10) / 10
            : 0,
          count: percentageCounts[key] || 0,
        })).sort((a, b) => b.avgPercentage - a.avgPercentage);

        questionStats[q.id] = {
          title: q.title,
          type: 'percentage',
          total: answeredCount,
          distribution: avgPercentages,
        };
      } else {
        questionStats[q.id] = {
          title: q.title,
          type: q.type,
          total: answeredCount,
          distribution: Object.entries(counts).map(([key, count]) => ({
            value: key,
            label: q.labels?.[key] || key,
            count,
            percentage: answeredCount > 0 ? Math.round((count / answeredCount) * 100) : 0,
          })).sort((a, b) => b.count - a.count),
        };
      }
    }

    // Collect text responses
    const textResponses: Record<string, string[]> = {};
    textQuestions.forEach(({ id }) => {
      textResponses[id] = [];
    });

    responses.forEach((r) => {
      const data = r.data as Record<string, any>;
      textQuestions.forEach(({ id }) => {
        const answer = data[id];
        if (answer && typeof answer === 'string' && answer.trim()) {
          textResponses[id].push(answer.trim());
        }
      });
    });

    // Daily responses
    const dailyCounts: Record<string, number> = {};
    responses.forEach((r) => {
      const date = r.createdAt.toISOString().split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    return NextResponse.json({
      total,
      totalCompleted,
      filteredCount,
      completionRate: total > 0 ? Math.round((totalCompleted / total) * 100) : 0,
      questionStats,
      textResponses,
      textQuestionTitles: textQuestions.reduce((acc, q) => ({ ...acc, [q.id]: q.title }), {}),
      dailyResponses: Object.entries(dailyCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      filters: {
        startYear: startYearFilter ? parseInt(startYearFilter) : null,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
