import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { questions } from '@/lib/questions';

// Force dynamic rendering (no caching)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper to flatten response data
function flattenResponse(response: any): Record<string, any> {
  const data = response.data as Record<string, any>;
  const flat: Record<string, any> = {
    id: response.id,
    createdAt: response.createdAt.toISOString(),
    completed: response.completed,
    structureName: response.structureName || '',
  };

  // Add all question answers
  questions.forEach((q) => {
    const value = data[q.id];
    if (value !== undefined) {
      if (q.type === 'percentage_distribution' && typeof value === 'object') {
        // Flatten percentage distribution into separate columns
        Object.entries(value).forEach(([key, pct]) => {
          flat[`${q.id}_${key}`] = pct;
        });
      } else if (Array.isArray(value)) {
        flat[q.id] = value.join('; ');
      } else {
        flat[q.id] = value;
      }
    } else {
      flat[q.id] = '';
    }
  });

  return flat;
}

// Generate CSV from responses
function generateCSV(responses: any[]): string {
  if (responses.length === 0) return '';

  // Get all possible columns including percentage distribution sub-columns
  const baseColumns = ['id', 'createdAt', 'completed', 'structureName'];
  const questionColumns: string[] = [];

  questions.forEach((q) => {
    if (q.type === 'percentage_distribution' && q.options) {
      q.options.forEach((opt) => {
        questionColumns.push(`${q.id}_${opt.value}`);
      });
    } else {
      questionColumns.push(q.id);
    }
  });

  const columns = [...baseColumns, ...questionColumns];

  // Column headers with question text
  const headers = columns.map((col) => {
    if (col === 'id') return 'ID';
    if (col === 'createdAt') return 'Date de création';
    if (col === 'completed') return 'Complété';
    if (col === 'structureName') return 'Structure';

    // Handle percentage distribution sub-columns
    if (col.includes('_')) {
      const [qId, segmentKey] = col.split('_');
      const q = questions.find((q) => q.id === qId);
      const opt = q?.options?.find((o) => String(o.value) === segmentKey);
      return q ? `${qId}: ${opt?.label || segmentKey} (%)` : col;
    }

    const q = questions.find((q) => q.id === col);
    return q ? `${col}: ${q.question.substring(0, 50)}...` : col;
  });

  // Escape CSV value
  const escapeCSV = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Build CSV
  const rows = responses.map((r) => {
    const flat = flattenResponse(r);
    return columns.map((col) => escapeCSV(flat[col])).join(',');
  });

  return [headers.map(escapeCSV).join(','), ...rows].join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const responses = await prisma.response.findMany({
      where: { completed: true },
      orderBy: { createdAt: 'desc' },
    });

    // Add UTF-8 BOM for Excel compatibility with French characters
    const csv = '\uFEFF' + generateCSV(responses);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="groupesdentaires-responses-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting responses:', error);
    return NextResponse.json(
      { error: 'Failed to export responses' },
      { status: 500 }
    );
  }
}
