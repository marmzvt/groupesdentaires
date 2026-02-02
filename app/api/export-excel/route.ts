import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import ExcelJS from 'exceljs';
import { convertOldSegmentData, oldSegmentKeys, newSegmentKeys } from '@/lib/questions';

// Force dynamic rendering (no caching)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Q2 option values to column mapping
const q2Options = ['A', 'B', 'C', 'D', 'E', 'F'];

// Q21 perceived advantages options (v2: 10 options)
const q21OptionsV1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const q21OptionsV2 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

// Q22 reluctances options (v2: 7 options)
const q22OptionsV1 = ['A', 'B', 'C', 'D', 'E', 'F'];
const q22OptionsV2 = ['A', 'B', 'C', 'D', 'E', 'F', 'J'];

// Q0 value to full label mapping (v2 label for C)
const q0Labels: Record<string, string> = {
  'A': 'Groupe dentaire (centre ou reseau de cabinets)',
  'B': 'Cabinet individuel independant',
  'C': 'Cabinet de groupe avec praticiens independants (plusieurs praticiens)',
};

// Q20 value to full label mapping
const q20Labels: Record<string, string> = {
  'A': 'Oui, certainement',
  'B': 'Oui, peut-etre',
  'C': 'Non, probablement pas',
  'D': 'Non, certainement pas',
};

// Q16 structure labels
const q16Labels: Record<string, string> = {
  'white_cabinets': 'White Cabinets Dentaires',
  'zahnarztzentrum': 'Zahnarztzentrum.ch',
  'cheeze': 'Cheeze',
  'ardentis': 'Ardentis',
  'chd': 'CHD - Clinique d\'Hygiene Dentaire',
  'adent': 'Adent',
  'panadent': 'Panadent',
  'dentalys': 'Dentalys',
  'clinident': 'Groupe Clinident',
  'pure_clinic': 'Pure Clinic',
  'dentalgroup': 'Dentalgroup.ch',
  'urbadental': 'Urbadental',
  'prefer_not_say': 'Je ne prefere pas dire',
  'other': 'Autre',
};

// Old segment labels (v1)
const oldSegmentLabels: Record<string, string> = {
  'preventifs': 'Soins preventifs',
  'hygiene': 'Soins de base (restauration, endo, extractions, ...)',
  'protheses': 'Protheses fixes et amovibles',
  'implants': 'Implants et parodontie',
  'orthodontie': 'Orthodontie et soins esthetiques',
};

// New segment labels (v2)
const newSegmentLabels: Record<string, string> = {
  'preventifs': 'Soins preventifs par l\'HD',
  'conservateurs': 'Soins de base conservateurs',
  'protheses': 'Protheses fixes et amovibles',
  'implants': 'Implants et chirurgie orale',
  'parodontologie': 'Parodontologie',
  'orthodontie': 'Orthodontie interceptive et/ou par aligneurs',
  'esthetique': 'Traitements a but esthetique',
};

// Build headers for old format (v1: 5 segments, 7 Q21, 6 Q22)
function buildOldHeaders(): string[] {
  const headers: string[] = [
    'Respondent',
    'Survey Version',
    'Q1:Current work type',
    'Q2:Year started practicing',
  ];

  // Q3 experience (Q2 in survey)
  q2Options.forEach((opt, i) => {
    headers.push(`Q3_${i + 1}: Experience type ${opt}`);
  });

  headers.push('Q4: Time spent at current place');

  // Scale scores Q5-Q14
  headers.push(
    'Q5: Score for soutien admin',
    'Q6: Score for development professional',
    'Q7: Score for formation continue',
    'Q8: Score for access technologie',
    'Q9: Score for qualite clinique',
    'Q10: Score for Presence confreres',
    'Q11: Score for satisfaction patients',
    'Q12: Score for securite professionnelle',
    'Q13: Score for equilibre vie pro/perso',
    'Q14_global: Score for satisfaction global',
  );

  // Q15 (Q20 in survey) - intention to join
  headers.push('Q15 (when none group): Would you work for group');

  // Q16 (Q21 in survey) - perceived advantages v1
  q21OptionsV1.forEach((opt, i) => {
    headers.push(`Q16_${i + 1}(when none group): Perceived advantage_${opt}`);
  });

  // Q17 (Q22 in survey) - reluctances v1
  q22OptionsV1.forEach((opt, i) => {
    headers.push(`Q17_${i + 1}(when none group): Perceived disadvantage_${opt}`);
  });

  // Q18 (Q14 in survey) - high activity segments v1
  oldSegmentKeys.forEach((seg, i) => {
    headers.push(`Q18_${i + 1}: High level of activity in ${oldSegmentLabels[seg]}`);
  });

  // Q19 (Q14b in survey) - activity percentages v1
  oldSegmentKeys.forEach((seg, i) => {
    headers.push(`Q19_${i + 1}: % activity in ${oldSegmentLabels[seg]}`);
  });

  // Q20 (Q15 in survey) - future high activity v1
  oldSegmentKeys.forEach((seg, i) => {
    headers.push(`Q20_${i + 1}: High level of activity in ${oldSegmentLabels[seg]} (N5Y)`);
  });

  // Q21 (Q15b in survey) - future activity percentages v1
  oldSegmentKeys.forEach((seg, i) => {
    headers.push(`Q21_${i + 1}: % activity in ${oldSegmentLabels[seg]} (N5Y)`);
  });

  headers.push(
    'Q22 (For groups): Name of your current group',
    'Q23: Can we contact you',
    'Q24: Email',
  );

  return headers;
}

// Build headers for new format (v2: 7 segments, 10 Q21, 7 Q22)
function buildNewHeaders(): string[] {
  const headers: string[] = [
    'Respondent',
    'Survey Version',
    'Q1:Current work type',
    'Q2:Year started practicing',
  ];

  // Q3 experience (Q2 in survey)
  q2Options.forEach((opt, i) => {
    headers.push(`Q3_${i + 1}: Experience type ${opt}`);
  });

  headers.push('Q4: Time spent at current place');

  // Scale scores Q5-Q14
  headers.push(
    'Q5: Score for soutien admin',
    'Q6: Score for development professional',
    'Q7: Score for formation continue',
    'Q8: Score for access technologie',
    'Q9: Score for qualite clinique',
    'Q10: Score for Presence confreres',
    'Q11: Score for satisfaction patients',
    'Q12: Score for securite professionnelle',
    'Q13: Score for equilibre vie pro/perso',
    'Q14_global: Score for satisfaction global',
  );

  // Q15 (Q20 in survey) - intention to join
  headers.push('Q15 (when none group): Would you work for group');

  // Q16 (Q21 in survey) - perceived advantages v2
  q21OptionsV2.forEach((opt, i) => {
    headers.push(`Q16_${i + 1}(when none group): Perceived advantage_${opt}`);
  });

  // Q17 (Q22 in survey) - reluctances v2
  q22OptionsV2.forEach((opt, i) => {
    headers.push(`Q17_${i + 1}(when none group): Perceived disadvantage_${opt}`);
  });

  // Q18 (Q14 in survey) - high activity segments v2
  newSegmentKeys.forEach((seg, i) => {
    headers.push(`Q18_${i + 1}: High level of activity in ${newSegmentLabels[seg]}`);
  });

  // Q19 (Q14b in survey) - activity percentages v2
  newSegmentKeys.forEach((seg, i) => {
    headers.push(`Q19_${i + 1}: % activity in ${newSegmentLabels[seg]}`);
  });

  // Q20 (Q15 in survey) - future high activity v2
  newSegmentKeys.forEach((seg, i) => {
    headers.push(`Q20_${i + 1}: High level of activity in ${newSegmentLabels[seg]} (N5Y)`);
  });

  // Q21 (Q15b in survey) - future activity percentages v2
  newSegmentKeys.forEach((seg, i) => {
    headers.push(`Q21_${i + 1}: % activity in ${newSegmentLabels[seg]} (N5Y)`);
  });

  headers.push(
    'Q22 (For groups): Name of your current group',
    'Q23: Can we contact you',
    'Q24: Email',
  );

  return headers;
}

// Map a v1 response to old format row
function mapOldResponse(response: any, index: number): (string | number)[] {
  const data = response.data as Record<string, any>;
  const isGroup = data.Q0 === 'A';

  const row: (string | number)[] = [];

  row.push(`#${index + 1}`);
  row.push(response.surveyVersion || 1);
  row.push(q0Labels[data.Q0] || data.Q0 || '');
  row.push(data.Q1 || '');

  // Q3 experience
  const q2Array = Array.isArray(data.Q2) ? data.Q2 : [];
  q2Options.forEach(opt => {
    row.push(q2Array.includes(opt) ? 1 : 0);
  });

  row.push(data.Q3 ?? '');

  // Scale scores
  if (isGroup || data.Q0 === 'C') {
    row.push(data.Q4 ?? '');
    row.push(data.Q5 ?? '');
    row.push(data.Q6 ?? '');
    row.push(data.Q7 ?? '');
    row.push(data.Q8 ?? '');
    row.push(data.Q9 ?? '');
    row.push(data.Q10 ?? '');
    row.push(data.Q11 ?? '');
    row.push(data.Q12 ?? '');
    row.push(data.Q13 ?? '');
  } else {
    row.push(data.Q4i ?? '');
    row.push(data.Q5i ?? '');
    row.push(data.Q6i ?? '');
    row.push(data.Q7i ?? '');
    row.push(data.Q8i ?? '');
    row.push(data.Q9i ?? '');
    row.push('n/a');
    row.push(data.Q10i ?? '');
    row.push(data.Q11i ?? '');
    row.push(data.Q12i ?? '');
  }

  // Q20 - intention to join
  if (isGroup) {
    row.push('n/a');
  } else {
    row.push(q20Labels[data.Q20] || data.Q20 || '');
  }

  // Q21 advantages v1
  const q21Array = Array.isArray(data.Q21) ? data.Q21 : [];
  q21OptionsV1.forEach(opt => {
    row.push(isGroup ? 'n/a' : (q21Array.includes(opt) ? 1 : 0));
  });

  // Q22 reluctances v1
  const q22Array = Array.isArray(data.Q22) ? data.Q22 : [];
  q22OptionsV1.forEach(opt => {
    row.push(isGroup ? 'n/a' : (q22Array.includes(opt) ? 1 : 0));
  });

  // Activity segments - use old keys
  const q14Array = Array.isArray(data.Q14) ? data.Q14 : [];
  oldSegmentKeys.forEach(seg => {
    row.push(q14Array.includes(seg) ? 1 : 0);
  });

  const q14b = data.Q14b || {};
  oldSegmentKeys.forEach(seg => {
    row.push(q14b[seg] ?? '');
  });

  const q15Array = Array.isArray(data.Q15) ? data.Q15 : [];
  oldSegmentKeys.forEach(seg => {
    row.push(q15Array.includes(seg) ? 1 : 0);
  });

  const q15b = data.Q15b || {};
  oldSegmentKeys.forEach(seg => {
    row.push(q15b[seg] ?? '');
  });

  row.push(isGroup ? (q16Labels[data.Q16] || data.Q16 || '') : 'n/a');
  row.push(data.Q17 === 'oui' ? 'Yes' : data.Q17 === 'non' ? 'No' : '');
  row.push(data.Q18 || '');

  return row;
}

// Map a v2 response to new format row
function mapNewResponse(response: any, index: number): (string | number)[] {
  const data = response.data as Record<string, any>;
  const isGroup = data.Q0 === 'A';

  const row: (string | number)[] = [];

  row.push(`#${index + 1}`);
  row.push(response.surveyVersion || 2);
  row.push(q0Labels[data.Q0] || data.Q0 || '');
  row.push(data.Q1 || '');

  // Q3 experience
  const q2Array = Array.isArray(data.Q2) ? data.Q2 : [];
  q2Options.forEach(opt => {
    row.push(q2Array.includes(opt) ? 1 : 0);
  });

  row.push(data.Q3 ?? '');

  // Scale scores
  if (isGroup || data.Q0 === 'C') {
    row.push(data.Q4 ?? '');
    row.push(data.Q5 ?? '');
    row.push(data.Q6 ?? '');
    row.push(data.Q7 ?? '');
    row.push(data.Q8 ?? '');
    row.push(data.Q9 ?? '');
    row.push(data.Q10 ?? '');
    row.push(data.Q11 ?? '');
    row.push(data.Q12 ?? '');
    row.push(data.Q13 ?? '');
  } else {
    row.push(data.Q4i ?? '');
    row.push(data.Q5i ?? '');
    row.push(data.Q6i ?? '');
    row.push(data.Q7i ?? '');
    row.push(data.Q8i ?? '');
    row.push(data.Q9i ?? '');
    row.push('n/a');
    row.push(data.Q10i ?? '');
    row.push(data.Q11i ?? '');
    row.push(data.Q12i ?? '');
  }

  // Q20 - intention to join
  if (isGroup) {
    row.push('n/a');
  } else {
    row.push(q20Labels[data.Q20] || data.Q20 || '');
  }

  // Q21 advantages v2
  const q21Array = Array.isArray(data.Q21) ? data.Q21 : [];
  q21OptionsV2.forEach(opt => {
    row.push(isGroup ? 'n/a' : (q21Array.includes(opt) ? 1 : 0));
  });

  // Q22 reluctances v2
  const q22Array = Array.isArray(data.Q22) ? data.Q22 : [];
  q22OptionsV2.forEach(opt => {
    row.push(isGroup ? 'n/a' : (q22Array.includes(opt) ? 1 : 0));
  });

  // Activity segments - use new keys
  const q14Array = Array.isArray(data.Q14) ? data.Q14 : [];
  newSegmentKeys.forEach(seg => {
    row.push(q14Array.includes(seg) ? 1 : 0);
  });

  const q14b = data.Q14b || {};
  newSegmentKeys.forEach(seg => {
    row.push(q14b[seg] ?? '');
  });

  const q15Array = Array.isArray(data.Q15) ? data.Q15 : [];
  newSegmentKeys.forEach(seg => {
    row.push(q15Array.includes(seg) ? 1 : 0);
  });

  const q15b = data.Q15b || {};
  newSegmentKeys.forEach(seg => {
    row.push(q15b[seg] ?? '');
  });

  row.push(isGroup ? (q16Labels[data.Q16] || data.Q16 || '') : 'n/a');
  row.push(data.Q17 === 'oui' ? 'Yes' : data.Q17 === 'non' ? 'No' : '');
  row.push(data.Q18 || '');

  return row;
}

// Map a response to combined format (v2 format with conversion for v1 data)
function mapCombinedResponse(response: any, index: number): (string | number)[] {
  const data = response.data as Record<string, any>;
  const isGroup = data.Q0 === 'A';
  const isV1 = (response.surveyVersion || 1) === 1;

  const row: (string | number)[] = [];

  row.push(`#${index + 1}`);
  row.push(response.surveyVersion || 1);
  row.push(q0Labels[data.Q0] || data.Q0 || '');
  row.push(data.Q1 || '');

  // Q3 experience
  const q2Array = Array.isArray(data.Q2) ? data.Q2 : [];
  q2Options.forEach(opt => {
    row.push(q2Array.includes(opt) ? 1 : 0);
  });

  row.push(data.Q3 ?? '');

  // Scale scores
  if (isGroup || data.Q0 === 'C') {
    row.push(data.Q4 ?? '');
    row.push(data.Q5 ?? '');
    row.push(data.Q6 ?? '');
    row.push(data.Q7 ?? '');
    row.push(data.Q8 ?? '');
    row.push(data.Q9 ?? '');
    row.push(data.Q10 ?? '');
    row.push(data.Q11 ?? '');
    row.push(data.Q12 ?? '');
    row.push(data.Q13 ?? '');
  } else {
    row.push(data.Q4i ?? '');
    row.push(data.Q5i ?? '');
    row.push(data.Q6i ?? '');
    row.push(data.Q7i ?? '');
    row.push(data.Q8i ?? '');
    row.push(data.Q9i ?? '');
    row.push('n/a');
    row.push(data.Q10i ?? '');
    row.push(data.Q11i ?? '');
    row.push(data.Q12i ?? '');
  }

  // Q20 - intention to join
  if (isGroup) {
    row.push('n/a');
  } else {
    row.push(q20Labels[data.Q20] || data.Q20 || '');
  }

  // Q21 advantages v2 (with n/a for v1 new options)
  const q21Array = Array.isArray(data.Q21) ? data.Q21 : [];
  q21OptionsV2.forEach(opt => {
    if (isGroup) {
      row.push('n/a');
    } else if (isV1 && ['H', 'I', 'J'].includes(opt)) {
      row.push('n/a');  // New options not available in v1
    } else {
      row.push(q21Array.includes(opt) ? 1 : 0);
    }
  });

  // Q22 reluctances v2 (with n/a for v1 new option)
  const q22Array = Array.isArray(data.Q22) ? data.Q22 : [];
  q22OptionsV2.forEach(opt => {
    if (isGroup) {
      row.push('n/a');
    } else if (isV1 && opt === 'J') {
      row.push('n/a');  // New option not available in v1
    } else {
      row.push(q22Array.includes(opt) ? 1 : 0);
    }
  });

  // Activity segments - convert v1 to v2 format
  let q14Array = Array.isArray(data.Q14) ? data.Q14 : [];
  let q14b = data.Q14b || {};
  let q15Array = Array.isArray(data.Q15) ? data.Q15 : [];
  let q15b = data.Q15b || {};

  if (isV1) {
    // Convert segment selections for multiple choice
    const convertSelection = (oldArr: string[]): string[] => {
      const newArr: string[] = [];
      oldArr.forEach(seg => {
        if (seg === 'preventifs') newArr.push('preventifs');
        else if (seg === 'hygiene') newArr.push('conservateurs');
        else if (seg === 'protheses') newArr.push('protheses');
        else if (seg === 'implants') {
          newArr.push('implants');
          newArr.push('parodontologie');
        }
        else if (seg === 'orthodontie') {
          newArr.push('orthodontie');
          newArr.push('esthetique');
        }
      });
      return newArr;
    };

    q14Array = convertSelection(q14Array);
    q15Array = convertSelection(q15Array);
    q14b = convertOldSegmentData(q14b);
    q15b = convertOldSegmentData(q15b);
  }

  // High activity segments
  newSegmentKeys.forEach(seg => {
    row.push(q14Array.includes(seg) ? 1 : 0);
  });

  // Activity percentages
  newSegmentKeys.forEach(seg => {
    row.push(q14b[seg] ?? '');
  });

  // Future high activity
  newSegmentKeys.forEach(seg => {
    row.push(q15Array.includes(seg) ? 1 : 0);
  });

  // Future activity percentages
  newSegmentKeys.forEach(seg => {
    row.push(q15b[seg] ?? '');
  });

  row.push(isGroup ? (q16Labels[data.Q16] || data.Q16 || '') : 'n/a');
  row.push(data.Q17 === 'oui' ? 'Yes' : data.Q17 === 'non' ? 'No' : '');
  row.push(data.Q18 || '');

  return row;
}

// Create a data sheet
function createDataSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  headers: string[],
  responses: any[],
  mapFunction: (response: any, index: number) => (string | number)[]
) {
  const sheet = workbook.addWorksheet(sheetName);

  sheet.addRow(headers);

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  responses.forEach((response, index) => {
    const rowData = mapFunction(response, index);
    sheet.addRow(rowData);
  });

  sheet.columns.forEach((column, i) => {
    const header = headers[i] || '';
    column.width = Math.min(Math.max(header.length * 0.8, 10), 40);
  });

  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  return sheet;
}

export async function GET(request: NextRequest) {
  try {
    const responses = await prisma.response.findMany({
      where: { completed: true },
      orderBy: { createdAt: 'desc' },
    });

    // Separate v1 and v2 responses
    const v1Responses = responses.filter(r => (r.surveyVersion || 1) === 1);
    const v2Responses = responses.filter(r => r.surveyVersion === 2);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Groupes Dentaires Survey';
    workbook.created = new Date();

    // Create sheets
    if (v1Responses.length > 0) {
      createDataSheet(
        workbook,
        'Old Responses (v1)',
        buildOldHeaders(),
        v1Responses,
        mapOldResponse
      );
    }

    if (v2Responses.length > 0) {
      createDataSheet(
        workbook,
        'New Responses (v2)',
        buildNewHeaders(),
        v2Responses,
        mapNewResponse
      );
    }

    // Combined sheet with all responses converted to v2 format
    createDataSheet(
      workbook,
      'Combined (Converted)',
      buildNewHeaders(),
      responses,
      mapCombinedResponse
    );

    // Add info sheet explaining the data
    const infoSheet = workbook.addWorksheet('Info');
    infoSheet.getCell('A1').value = 'Survey Data Export';
    infoSheet.getCell('A1').font = { bold: true, size: 16 };
    infoSheet.getCell('A3').value = 'Export Date:';
    infoSheet.getCell('B3').value = new Date().toISOString();
    infoSheet.getCell('A4').value = 'Total Responses:';
    infoSheet.getCell('B4').value = responses.length;
    infoSheet.getCell('A5').value = 'V1 Responses:';
    infoSheet.getCell('B5').value = v1Responses.length;
    infoSheet.getCell('A6').value = 'V2 Responses:';
    infoSheet.getCell('B6').value = v2Responses.length;

    infoSheet.getCell('A8').value = 'Sheet Descriptions:';
    infoSheet.getCell('A8').font = { bold: true };
    infoSheet.getCell('A9').value = 'Old Responses (v1): Original format with 5 segments, 7 Q21 options, 6 Q22 options';
    infoSheet.getCell('A10').value = 'New Responses (v2): New format with 7 segments, 10 Q21 options, 7 Q22 options';
    infoSheet.getCell('A11').value = 'Combined (Converted): All responses converted to v2 format. V1 data has:';
    infoSheet.getCell('A12').value = '  - Segments split 50/50 (implants->implants+parodontologie, orthodontie->orthodontie+esthetique)';
    infoSheet.getCell('A13').value = '  - hygiene renamed to conservateurs';
    infoSheet.getCell('A14').value = '  - New Q21 options (H,I,J) and Q22 option (J) show as n/a for v1 responses';

    infoSheet.getColumn('A').width = 80;
    infoSheet.getColumn('B').width = 30;

    const buffer = await workbook.xlsx.writeBuffer();
    const date = new Date().toISOString().split('T')[0];

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="groupesdentaires-export-${date}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error exporting Excel:', error);
    return NextResponse.json(
      { error: 'Failed to export Excel file' },
      { status: 500 }
    );
  }
}
