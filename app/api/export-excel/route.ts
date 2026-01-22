import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import ExcelJS from 'exceljs';

// Force dynamic rendering (no caching)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Q2 option values to column mapping
const q2Options = ['A', 'B', 'C', 'D', 'E', 'F'];

// Q21 perceived advantages options
const q21Options = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

// Q22 reluctances options
const q22Options = ['A', 'B', 'C', 'D', 'E', 'F'];

// Activity segments
const segments = ['preventifs', 'hygiene', 'protheses', 'implants', 'orthodontie'];

// Q0 value to full label mapping
const q0Labels: Record<string, string> = {
  'A': 'Groupe dentaire (centre ou réseau de cabinets)',
  'B': 'Cabinet individuel indépendant',
  'C': 'Cabinet de groupe indépendant (plusieurs praticiens)',
};

// Q20 value to full label mapping
const q20Labels: Record<string, string> = {
  'A': 'Oui, certainement',
  'B': 'Oui, peut-être',
  'C': 'Non, probablement pas',
  'D': 'Non, certainement pas',
};

// Q16 structure labels
const q16Labels: Record<string, string> = {
  'white_cabinets': 'White Cabinets Dentaires',
  'zahnarztzentrum': 'Zahnarztzentrum.ch',
  'cheeze': 'Cheeze',
  'ardentis': 'Ardentis',
  'chd': 'CHD – Clinique d\'Hygiène Dentaire',
  'adent': 'Adent',
  'panadent': 'Panadent',
  'dentalys': 'Dentalys',
  'clinident': 'Groupe Clinident',
  'adent_dental': 'Adent Dental',
  'pure_clinic': 'Pure Clinic',
  'dentalgroup': 'Dentalgroup.ch',
  'urbadental': 'Urbadental',
  'prefer_not_say': 'Je ne préfère pas dire',
  'other': 'Autre',
};

// Template column headers matching the Excel template
const templateHeaders = [
  'Respondent',
  'Q1:Current work type',
  'Q2:Year started practicing',
  'Q3_1: Cabinet individuel indépendant - associé / fondateur',
  'Q3_2: Cabinet de groupe indépendant (plusieurs praticiens) - associé / fondateur',
  'Q3_3: Salarié(e) dans un cabinet privé',
  'Q3_4: Salarié(e) dans un centre ou groupe dentaire',
  'Q3_5: Autre mode d\'exercice',
  'Q3_6: C\'est ma première expérience professionnelle',
  'Q4: Time spent at current place',
  'Q5: Score for soutien admin',
  'Q6: Score for development professional',
  'Q7: Score for formation continue',
  'Q8: Score for access technologie',
  'Q9: Score for qualite clinique',
  'Q10: Score for Presence confreres',
  'Q11: Score for satisfaction patients',
  'Q12: Score for securite professionnelle',
  'Q13: Score for equilibre vie pro/perso',
  'Q13_global: Score for satisfaction global',
  'Q14 (when none group): Would you work for group',
  'Q15_1(when none group): Perceived advantage_Soutien administratif',
  'Q15_2(when none group): Perceived advantage_Accès à des technologies avancées',
  'Q15_3(when none group): Perceived advantage_Collaboration avec des confrères',
  'Q15_4(when none group): Perceived advantage_Formation continue facilitée',
  'Q15_5(when none group): Perceived advantage_Meilleur équilibre vie pro/perso',
  'Q15_6(when none group): Perceived advantage_Sécurité financière',
  'Q15_7(when none group): Perceived advantage_Je ne perçois pas d\'avantages',
  'Q16_1(when none group): Perceived disadvantage_Perte d\'autonomie clinique',
  'Q16_2(when none group): Perceived disadvantage_Pression sur la productivité',
  'Q16_3(when none group): Perceived disadvantage_Rémunération moins avantageuse',
  'Q16_4(when none group): Perceived disadvantage_Moins de relation personnelle avec les patients',
  'Q16_5(when none group): Perceived disadvantage_Standardisation des pratiques',
  'Q16_6(when none group): Perceived disadvantage_Je n\'ai pas de réticences',
  'Q17_1: High level of activity in Soins préventifs',
  'Q17_2: High level of activity in Soins d\'hygiène de base',
  'Q17_3: High level of activity in Prothèses fixes et amovibles',
  'Q17_4: High level of activity in Implants',
  'Q17_5: High level of activity in Orthodontie et soins esthétiques',
  'Q18_1: % activity in Soins préventifs',
  'Q18_2: % activity in Soins d\'hygiène de base',
  'Q18_3: % activity in Prothèses fixes et amovibles',
  'Q18_4: % activity in Implants',
  'Q18_5: % activity in Orthodontie et soins esthétiques',
  'Q19_1: High level of activity in Soins préventifs (N5Y)',
  'Q19_2: High level of activity in Soins d\'hygiène de base (N5Y)',
  'Q19_3: High level of activity in Prothèses fixes et amovibles (N5Y)',
  'Q19_4: High level of activity in Implants (N5Y)',
  'Q19_5: High level of activity in Orthodontie et soins esthétiques (N5Y)',
  'Q20_1: % activity in Soins préventifs (N5Y)',
  'Q20_2: % activity in Soins d\'hygiène de base (N5Y)',
  'Q20_3: % activity in Prothèses fixes et amovibles (N5Y)',
  'Q20_4: % activity in Implants (N5Y)',
  'Q20_5: % activity in Orthodontie et soins esthétiques (N5Y)',
  'Q21 (For groups): Name of your current group',
  'Q22: Can we contact you',
  'Q23: Email',
];

// Map a survey response to template row format
function mapResponseToTemplate(response: any, index: number): (string | number)[] {
  const data = response.data as Record<string, any>;
  const isGroup = data.Q0 === 'A';

  const row: (string | number)[] = [];

  // Column A: Respondent
  row.push(`#${index + 1}`);

  // Column B: Q1 - Current work type (from Q0)
  row.push(q0Labels[data.Q0] || data.Q0 || '');

  // Column C: Q2 - Year started practicing (from Q1)
  row.push(data.Q1 || '');

  // Columns D-I: Q3_1 to Q3_6 - Previous experience (binary from Q2)
  const q2Array = Array.isArray(data.Q2) ? data.Q2 : [];
  q2Options.forEach(opt => {
    row.push(q2Array.includes(opt) ? 1 : 0);
  });

  // Column J: Q4 - Time spent at current place (from Q3)
  row.push(data.Q3 ?? '');

  // Columns K-S: Q5 to Q13 - Scale scores
  // Map Group (Q4-Q13) or Independent (Q4i-Q12i) to unified columns
  if (isGroup) {
    // Group: Q4->Q5, Q5->Q6, Q6->Q7, Q7->Q8, Q8->Q9, Q9->Q10, Q10->Q11, Q11->Q12, Q12->Q13
    row.push(data.Q4 ?? '');   // Q5: Admin efficiency
    row.push(data.Q5 ?? '');   // Q6: Professional development
    row.push(data.Q6 ?? '');   // Q7: Continuing education
    row.push(data.Q7 ?? '');   // Q8: Technology access
    row.push(data.Q8 ?? '');   // Q9: Clinical quality
    row.push(data.Q9 ?? '');   // Q10: Peer collaboration
    row.push(data.Q10 ?? '');  // Q11: Patient satisfaction (group only)
    row.push(data.Q11 ?? '');  // Q12: Professional safety
    row.push(data.Q12 ?? '');  // Q13: Work-life balance
    row.push(data.Q13 ?? '');  // Q13_global: Overall satisfaction
  } else {
    // Independent: Q4i->Q5, Q5i->Q6, Q6i->Q7, Q7i->Q8, Q8i->Q9, Q9i->Q10, n/a->Q11, Q10i->Q12, Q11i->Q13, Q12i->Q13_global
    row.push(data.Q4i ?? '');  // Q5: Admin efficiency
    row.push(data.Q5i ?? '');  // Q6: Professional development
    row.push(data.Q6i ?? '');  // Q7: Continuing education
    row.push(data.Q7i ?? '');  // Q8: Technology access
    row.push(data.Q8i ?? '');  // Q9: Clinical quality
    row.push(data.Q9i ?? '');  // Q10: Peer collaboration
    row.push('n/a');           // Q11: Patient satisfaction (not asked to independents)
    row.push(data.Q10i ?? ''); // Q12: Professional safety
    row.push(data.Q11i ?? ''); // Q13: Work-life balance
    row.push(data.Q12i ?? ''); // Q13_global: Overall satisfaction
  }

  // Column T: Q14 - Would you work for group (Q20, only for independents)
  if (isGroup) {
    row.push('n/a');
  } else {
    row.push(q20Labels[data.Q20] || data.Q20 || '');
  }

  // Columns U-AA: Q15_1 to Q15_7 - Perceived advantages (binary from Q21)
  const q21Array = Array.isArray(data.Q21) ? data.Q21 : [];
  q21Options.forEach(opt => {
    if (isGroup) {
      row.push('n/a');
    } else {
      row.push(q21Array.includes(opt) ? 1 : 0);
    }
  });

  // Columns AB-AG: Q16_1 to Q16_6 - Perceived disadvantages (binary from Q22)
  const q22Array = Array.isArray(data.Q22) ? data.Q22 : [];
  q22Options.forEach(opt => {
    if (isGroup) {
      row.push('n/a');
    } else {
      row.push(q22Array.includes(opt) ? 1 : 0);
    }
  });

  // Columns AH-AL: Q17_1 to Q17_5 - High activity segments (binary from Q14)
  const q14Array = Array.isArray(data.Q14) ? data.Q14 : [];
  segments.forEach(seg => {
    row.push(q14Array.includes(seg) ? 1 : 0);
  });

  // Columns AM-AQ: Q18_1 to Q18_5 - Activity percentages (from Q14b)
  const q14b = data.Q14b || {};
  segments.forEach(seg => {
    row.push(q14b[seg] ?? '');
  });

  // Columns AR-AV: Q19_1 to Q19_5 - Future high activity segments (binary from Q15)
  const q15Array = Array.isArray(data.Q15) ? data.Q15 : [];
  segments.forEach(seg => {
    row.push(q15Array.includes(seg) ? 1 : 0);
  });

  // Columns AW-BA: Q20_1 to Q20_5 - Future activity percentages (from Q15b)
  const q15b = data.Q15b || {};
  segments.forEach(seg => {
    row.push(q15b[seg] ?? '');
  });

  // Column BB: Q21 - Group name (Q16, only for groups)
  if (isGroup) {
    row.push(q16Labels[data.Q16] || data.Q16 || '');
  } else {
    row.push('n/a');
  }

  // Column BC: Q22 - Can we contact (Q17)
  row.push(data.Q17 === 'oui' ? 'Yes' : data.Q17 === 'non' ? 'No' : '');

  // Column BD: Q23 - Email (Q18)
  row.push(data.Q18 || '');

  return row;
}

// Create the data sheet with all responses
function createDataSheet(workbook: ExcelJS.Workbook, responses: any[]) {
  const sheet = workbook.addWorksheet('Template for responses');

  // Add headers
  sheet.addRow(templateHeaders);

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Add data rows
  responses.forEach((response, index) => {
    const rowData = mapResponseToTemplate(response, index);
    sheet.addRow(rowData);
  });

  // Auto-fit columns (approximate)
  sheet.columns.forEach((column, i) => {
    const header = templateHeaders[i] || '';
    column.width = Math.min(Math.max(header.length * 0.8, 10), 40);
  });

  // Freeze header row
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  return sheet;
}

// Create the analysis sheet with formulas
function createAnalysisSheet(workbook: ExcelJS.Workbook, responseCount: number) {
  const sheet = workbook.addWorksheet('Analysis1');
  const dataSheet = 'Template for responses';

  // Helper to create cell references
  const col = (letter: string) => `'${dataSheet}'!${letter}:${letter}`;
  const cell = (letter: string, row: number) => `'${dataSheet}'!${letter}${row}`;

  // Title
  sheet.getCell('B2').value = 'Analyse des réponses - Groupes Dentaires';
  sheet.getCell('B2').font = { bold: true, size: 16 };

  // Sample Size Section
  sheet.getCell('B4').value = 'Taille de l\'échantillon';
  sheet.getCell('B4').font = { bold: true, size: 14 };

  sheet.getCell('B5').value = 'Total répondants';
  sheet.getCell('C5').value = { formula: `COUNTA(${col('A')})-1` };

  sheet.getCell('B6').value = 'Groupe dentaire';
  sheet.getCell('C6').value = { formula: `COUNTIF(${col('B')},"Groupe dentaire*")` };

  sheet.getCell('B7').value = 'Cabinet indépendant';
  sheet.getCell('C7').value = { formula: `COUNTIF(${col('B')},"Cabinet*")` };

  // Score Comparison Section
  sheet.getCell('B10').value = 'Comparaison des scores moyens (0-10)';
  sheet.getCell('B10').font = { bold: true, size: 14 };

  // Headers for score comparison
  sheet.getCell('B11').value = 'Thème';
  sheet.getCell('C11').value = 'Groupe';
  sheet.getCell('D11').value = 'Indépendant';
  sheet.getCell('E11').value = 'Différence';
  [sheet.getCell('B11'), sheet.getCell('C11'), sheet.getCell('D11'), sheet.getCell('E11')].forEach(cell => {
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
  });

  // Score themes with column references (K=11, L=12, etc.)
  const scoreThemes = [
    { name: 'Soutien administratif', col: 'K' },
    { name: 'Développement professionnel', col: 'L' },
    { name: 'Formation continue', col: 'M' },
    { name: 'Accès technologies', col: 'N' },
    { name: 'Qualité clinique', col: 'O' },
    { name: 'Présence confrères', col: 'P' },
    { name: 'Satisfaction patients', col: 'Q' },
    { name: 'Sécurité professionnelle', col: 'R' },
    { name: 'Équilibre vie pro/perso', col: 'S' },
    { name: 'Satisfaction globale', col: 'T' },
  ];

  scoreThemes.forEach((theme, i) => {
    const row = 12 + i;
    sheet.getCell(`B${row}`).value = theme.name;
    sheet.getCell(`C${row}`).value = { formula: `AVERAGEIF(${col('B')},"Groupe dentaire*",${col(theme.col)})` };
    sheet.getCell(`D${row}`).value = { formula: `AVERAGEIF(${col('B')},"Cabinet*",${col(theme.col)})` };
    sheet.getCell(`E${row}`).value = { formula: `C${row}-D${row}` };

    // Number formatting
    ['C', 'D', 'E'].forEach(c => {
      sheet.getCell(`${c}${row}`).numFmt = '0.00';
    });
  });

  // Activity Segment Analysis
  const activityStartRow = 25;
  sheet.getCell(`B${activityStartRow}`).value = 'Répartition de l\'activité (%)';
  sheet.getCell(`B${activityStartRow}`).font = { bold: true, size: 14 };

  sheet.getCell(`B${activityStartRow + 1}`).value = 'Segment';
  sheet.getCell(`C${activityStartRow + 1}`).value = 'Actuel - Groupe';
  sheet.getCell(`D${activityStartRow + 1}`).value = 'Actuel - Indép.';
  sheet.getCell(`E${activityStartRow + 1}`).value = 'Futur - Groupe';
  sheet.getCell(`F${activityStartRow + 1}`).value = 'Futur - Indép.';
  ['B', 'C', 'D', 'E', 'F'].forEach(c => {
    const cell = sheet.getCell(`${c}${activityStartRow + 1}`);
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
  });

  // Activity segment columns: Current (AM-AQ), Future (AW-BA)
  const activitySegments = [
    { name: 'Soins préventifs', currentCol: 'AN', futureCol: 'AX' },
    { name: 'Hygiène de base', currentCol: 'AO', futureCol: 'AY' },
    { name: 'Prothèses', currentCol: 'AP', futureCol: 'AZ' },
    { name: 'Implants', currentCol: 'AQ', futureCol: 'BA' },
    { name: 'Orthodontie/Esthétique', currentCol: 'AR', futureCol: 'BB' },
  ];

  activitySegments.forEach((seg, i) => {
    const row = activityStartRow + 2 + i;
    sheet.getCell(`B${row}`).value = seg.name;
    sheet.getCell(`C${row}`).value = { formula: `AVERAGEIF(${col('B')},"Groupe dentaire*",${col(seg.currentCol)})` };
    sheet.getCell(`D${row}`).value = { formula: `AVERAGEIF(${col('B')},"Cabinet*",${col(seg.currentCol)})` };
    sheet.getCell(`E${row}`).value = { formula: `AVERAGEIF(${col('B')},"Groupe dentaire*",${col(seg.futureCol)})` };
    sheet.getCell(`F${row}`).value = { formula: `AVERAGEIF(${col('B')},"Cabinet*",${col(seg.futureCol)})` };

    ['C', 'D', 'E', 'F'].forEach(c => {
      sheet.getCell(`${c}${row}`).numFmt = '0.0';
    });
  });

  // Perception Analysis (Independents only)
  const perceptionStartRow = 35;
  sheet.getCell(`B${perceptionStartRow}`).value = 'Perception des groupes dentaires (Indépendants uniquement)';
  sheet.getCell(`B${perceptionStartRow}`).font = { bold: true, size: 14 };

  // Likelihood to join
  sheet.getCell(`B${perceptionStartRow + 2}`).value = 'Intention de rejoindre un groupe';
  sheet.getCell(`B${perceptionStartRow + 2}`).font = { bold: true };

  const likelihoodOptions = [
    { name: 'Oui, certainement', searchText: 'Oui, certainement' },
    { name: 'Oui, peut-être', searchText: 'Oui, peut-être' },
    { name: 'Non, probablement pas', searchText: 'Non, probablement pas' },
    { name: 'Non, certainement pas', searchText: 'Non, certainement pas' },
  ];

  likelihoodOptions.forEach((opt, i) => {
    const row = perceptionStartRow + 3 + i;
    sheet.getCell(`B${row}`).value = opt.name;
    sheet.getCell(`C${row}`).value = { formula: `COUNTIF(${col('U')},"${opt.searchText}")` };
    sheet.getCell(`D${row}`).value = { formula: `C${row}/COUNTA(${col('U')})*100` };
    sheet.getCell(`D${row}`).numFmt = '0.0"%"';
  });

  // Perceived advantages
  const advantagesStartRow = perceptionStartRow + 9;
  sheet.getCell(`B${advantagesStartRow}`).value = 'Avantages perçus';
  sheet.getCell(`B${advantagesStartRow}`).font = { bold: true };

  const advantages = [
    { name: 'Soutien administratif', col: 'V' },
    { name: 'Technologies avancées', col: 'W' },
    { name: 'Collaboration confrères', col: 'X' },
    { name: 'Formation continue', col: 'Y' },
    { name: 'Équilibre vie pro/perso', col: 'Z' },
    { name: 'Sécurité financière', col: 'AA' },
    { name: 'Pas d\'avantages perçus', col: 'AB' },
  ];

  advantages.forEach((adv, i) => {
    const row = advantagesStartRow + 1 + i;
    sheet.getCell(`B${row}`).value = adv.name;
    sheet.getCell(`C${row}`).value = { formula: `COUNTIF(${col(adv.col)},1)` };
  });

  // Reluctances
  const reluctancesStartRow = advantagesStartRow + 10;
  sheet.getCell(`B${reluctancesStartRow}`).value = 'Réticences';
  sheet.getCell(`B${reluctancesStartRow}`).font = { bold: true };

  const reluctances = [
    { name: 'Perte d\'autonomie', col: 'AC' },
    { name: 'Pression productivité', col: 'AD' },
    { name: 'Rémunération', col: 'AE' },
    { name: 'Relation patients', col: 'AF' },
    { name: 'Standardisation', col: 'AG' },
    { name: 'Pas de réticences', col: 'AH' },
  ];

  reluctances.forEach((rel, i) => {
    const row = reluctancesStartRow + 1 + i;
    sheet.getCell(`B${row}`).value = rel.name;
    sheet.getCell(`C${row}`).value = { formula: `COUNTIF(${col(rel.col)},1)` };
  });

  // Set column widths
  sheet.getColumn('B').width = 35;
  sheet.getColumn('C').width = 18;
  sheet.getColumn('D').width = 18;
  sheet.getColumn('E').width = 18;
  sheet.getColumn('F').width = 18;

  return sheet;
}

export async function GET(request: NextRequest) {
  try {
    const responses = await prisma.response.findMany({
      where: { completed: true },
      orderBy: { createdAt: 'desc' },
    });

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Groupes Dentaires Survey';
    workbook.created = new Date();

    // Create sheets
    createDataSheet(workbook, responses);
    createAnalysisSheet(workbook, responses.length);

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    const date = new Date().toISOString().split('T')[0];

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="groupesdentaires-structured-${date}.xlsx"`,
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
