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
  'Q17_2: High level of activity in Soins de base (restauration, endo, extractions, ...)',
  'Q17_3: High level of activity in Prothèses fixes et amovibles',
  'Q17_4: High level of activity in Implants et parodontie',
  'Q17_5: High level of activity in Orthodontie et soins esthétiques',
  'Q18_1: % activity in Soins préventifs',
  'Q18_2: % activity in Soins de base (restauration, endo, extractions, ...)',
  'Q18_3: % activity in Prothèses fixes et amovibles',
  'Q18_4: % activity in Implants et parodontie',
  'Q18_5: % activity in Orthodontie et soins esthétiques',
  'Q19_1: High level of activity in Soins préventifs (N5Y)',
  'Q19_2: High level of activity in Soins de base (restauration, endo, extractions, ...) (N5Y)',
  'Q19_3: High level of activity in Prothèses fixes et amovibles (N5Y)',
  'Q19_4: High level of activity in Implants et parodontie (N5Y)',
  'Q19_5: High level of activity in Orthodontie et soins esthétiques (N5Y)',
  'Q20_1: % activity in Soins préventifs (N5Y)',
  'Q20_2: % activity in Soins de base (restauration, endo, extractions, ...) (N5Y)',
  'Q20_3: % activity in Prothèses fixes et amovibles (N5Y)',
  'Q20_4: % activity in Implants et parodontie (N5Y)',
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

  // Columns K-T: Q5 to Q13_global - Scale scores
  if (isGroup) {
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

  // Column U: Q14 - Would you work for group (Q20, only for independents)
  if (isGroup) {
    row.push('n/a');
  } else {
    row.push(q20Labels[data.Q20] || data.Q20 || '');
  }

  // Columns V-AB: Q15_1 to Q15_7 - Perceived advantages
  const q21Array = Array.isArray(data.Q21) ? data.Q21 : [];
  q21Options.forEach(opt => {
    row.push(isGroup ? 'n/a' : (q21Array.includes(opt) ? 1 : 0));
  });

  // Columns AC-AH: Q16_1 to Q16_6 - Perceived disadvantages
  const q22Array = Array.isArray(data.Q22) ? data.Q22 : [];
  q22Options.forEach(opt => {
    row.push(isGroup ? 'n/a' : (q22Array.includes(opt) ? 1 : 0));
  });

  // Columns AI-AM: Q17_1 to Q17_5 - High activity segments
  const q14Array = Array.isArray(data.Q14) ? data.Q14 : [];
  segments.forEach(seg => {
    row.push(q14Array.includes(seg) ? 1 : 0);
  });

  // Columns AN-AR: Q18_1 to Q18_5 - Activity percentages
  const q14b = data.Q14b || {};
  segments.forEach(seg => {
    row.push(q14b[seg] ?? '');
  });

  // Columns AS-AW: Q19_1 to Q19_5 - Future high activity segments
  const q15Array = Array.isArray(data.Q15) ? data.Q15 : [];
  segments.forEach(seg => {
    row.push(q15Array.includes(seg) ? 1 : 0);
  });

  // Columns AX-BB: Q20_1 to Q20_5 - Future activity percentages
  const q15b = data.Q15b || {};
  segments.forEach(seg => {
    row.push(q15b[seg] ?? '');
  });

  // Column BC: Q21 - Group name
  row.push(isGroup ? (q16Labels[data.Q16] || data.Q16 || '') : 'n/a');

  // Column BD: Q22 - Can we contact
  row.push(data.Q17 === 'oui' ? 'Yes' : data.Q17 === 'non' ? 'No' : '');

  // Column BE: Q23 - Email
  row.push(data.Q18 || '');

  return row;
}

// Create the data sheet with all responses
function createDataSheet(workbook: ExcelJS.Workbook, responses: any[]) {
  const sheet = workbook.addWorksheet('Template for responses');

  sheet.addRow(templateHeaders);

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  responses.forEach((response, index) => {
    const rowData = mapResponseToTemplate(response, index);
    sheet.addRow(rowData);
  });

  sheet.columns.forEach((column, i) => {
    const header = templateHeaders[i] || '';
    column.width = Math.min(Math.max(header.length * 0.8, 10), 40);
  });

  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  return sheet;
}

// ========================================
// FRENCH ANALYSIS SHEET
// ========================================
function createAnalysisSheetFR(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('Analyse FR');
  const dataSheet = 'Template for responses';
  const col = (letter: string) => `'${dataSheet}'!${letter}:${letter}`;

  let currentRow = 2;

  // Helper function to add a section title
  const addSectionTitle = (title: string, size: number = 14) => {
    sheet.getCell(`B${currentRow}`).value = title;
    sheet.getCell(`B${currentRow}`).font = { bold: true, size };
    currentRow += 2;
  };

  // Helper for table headers
  const addTableHeaders = (headers: string[], startCol: string = 'B') => {
    const cols = 'BCDEFGHIJ'.split('');
    headers.forEach((h, i) => {
      const cell = sheet.getCell(`${cols[i]}${currentRow}`);
      cell.value = h;
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E4576' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });
    currentRow++;
  };

  // ========================================
  // TITLE
  // ========================================
  sheet.getCell('B2').value = 'ANALYSE COMPLÈTE DU QUESTIONNAIRE DENTISTES';
  sheet.getCell('B2').font = { bold: true, size: 18, color: { argb: 'FF1E4576' } };
  currentRow = 5;

  // ========================================
  // SECTION 1: TAILLE DE L'ÉCHANTILLON
  // ========================================
  addSectionTitle('1. TAILLE DE L\'ÉCHANTILLON');

  sheet.getCell(`B${currentRow}`).value = 'Total répondants';
  sheet.getCell(`C${currentRow}`).value = { formula: `COUNTA(${col('A')})-1` };
  currentRow++;

  sheet.getCell(`B${currentRow}`).value = 'Groupe dentaire';
  sheet.getCell(`C${currentRow}`).value = { formula: `COUNTIF(${col('B')},"Groupe dentaire*")` };
  currentRow++;

  sheet.getCell(`B${currentRow}`).value = 'Cabinet individuel indépendant';
  sheet.getCell(`C${currentRow}`).value = { formula: `COUNTIF(${col('B')},"Cabinet individuel*")` };
  currentRow++;

  sheet.getCell(`B${currentRow}`).value = 'Cabinet de groupe indépendant';
  sheet.getCell(`C${currentRow}`).value = { formula: `COUNTIF(${col('B')},"Cabinet de groupe*")` };
  currentRow += 3;

  // ========================================
  // SECTION 2: PROFIL DES RÉPONDANTS
  // ========================================
  addSectionTitle('2. PROFIL DES RÉPONDANTS');

  // Q2: Année début exercice
  sheet.getCell(`B${currentRow}`).value = 'Année moyenne début exercice';
  sheet.getCell(`B${currentRow}`).font = { bold: true };
  currentRow++;

  addTableHeaders(['Groupe', 'Moyenne', 'Min', 'Max']);

  sheet.getCell(`B${currentRow}`).value = 'Groupe dentaire';
  sheet.getCell(`C${currentRow}`).value = { formula: `AVERAGEIF(${col('B')},"Groupe dentaire*",${col('C')})` };
  sheet.getCell(`D${currentRow}`).value = { formula: `MINIFS(${col('C')},${col('B')},"Groupe dentaire*")` };
  sheet.getCell(`E${currentRow}`).value = { formula: `MAXIFS(${col('C')},${col('B')},"Groupe dentaire*")` };
  currentRow++;

  sheet.getCell(`B${currentRow}`).value = 'Indépendant';
  sheet.getCell(`C${currentRow}`).value = { formula: `AVERAGEIF(${col('B')},"Cabinet*",${col('C')})` };
  sheet.getCell(`D${currentRow}`).value = { formula: `MINIFS(${col('C')},${col('B')},"Cabinet*")` };
  sheet.getCell(`E${currentRow}`).value = { formula: `MAXIFS(${col('C')},${col('B')},"Cabinet*")` };
  currentRow += 2;

  // Q3: Expérience antérieure
  sheet.getCell(`B${currentRow}`).value = 'Expérience antérieure (% ayant coché)';
  sheet.getCell(`B${currentRow}`).font = { bold: true };
  currentRow++;

  addTableHeaders(['Type d\'expérience', 'Total', '% Total']);

  const q3Labels = [
    'Cabinet individuel indépendant',
    'Cabinet de groupe indépendant',
    'Salarié cabinet privé',
    'Salarié centre dentaire',
    'Autre mode',
    'Première expérience',
  ];
  const q3Cols = ['D', 'E', 'F', 'G', 'H', 'I'];

  q3Labels.forEach((label, i) => {
    sheet.getCell(`B${currentRow}`).value = label;
    sheet.getCell(`C${currentRow}`).value = { formula: `COUNTIF(${col(q3Cols[i])},1)` };
    sheet.getCell(`D${currentRow}`).value = { formula: `C${currentRow}/(COUNTA(${col('A')})-1)*100` };
    sheet.getCell(`D${currentRow}`).numFmt = '0.0"%"';
    currentRow++;
  });
  currentRow += 2;

  // Q4: Années dans structure
  sheet.getCell(`B${currentRow}`).value = 'Années dans la structure actuelle';
  sheet.getCell(`B${currentRow}`).font = { bold: true };
  currentRow++;

  addTableHeaders(['Groupe', 'Moyenne', 'Min', 'Max']);

  sheet.getCell(`B${currentRow}`).value = 'Groupe dentaire';
  sheet.getCell(`C${currentRow}`).value = { formula: `AVERAGEIF(${col('B')},"Groupe dentaire*",${col('J')})` };
  sheet.getCell(`D${currentRow}`).value = { formula: `MINIFS(${col('J')},${col('B')},"Groupe dentaire*")` };
  sheet.getCell(`E${currentRow}`).value = { formula: `MAXIFS(${col('J')},${col('B')},"Groupe dentaire*")` };
  currentRow++;

  sheet.getCell(`B${currentRow}`).value = 'Indépendant';
  sheet.getCell(`C${currentRow}`).value = { formula: `AVERAGEIF(${col('B')},"Cabinet*",${col('J')})` };
  sheet.getCell(`D${currentRow}`).value = { formula: `MINIFS(${col('J')},${col('B')},"Cabinet*")` };
  sheet.getCell(`E${currentRow}`).value = { formula: `MAXIFS(${col('J')},${col('B')},"Cabinet*")` };
  currentRow += 3;

  // ========================================
  // SECTION 3: SCORES D'ÉVALUATION (0-10)
  // ========================================
  addSectionTitle('3. SCORES D\'ÉVALUATION (0-10) - COMPARAISON GROUPE VS INDÉPENDANT');

  addTableHeaders(['Thème', 'Moy. Groupe', 'Moy. Indép.', 'Différence', 'Avantage']);

  const scoreThemes = [
    { name: 'Soutien administratif', col: 'K', questionFR: 'Efficacité du soutien administratif' },
    { name: 'Développement professionnel', col: 'L', questionFR: 'Contribution au développement professionnel' },
    { name: 'Formation continue', col: 'M', questionFR: 'Satisfaction formation continue' },
    { name: 'Accès technologies', col: 'N', questionFR: 'Accès aux technologies dentaires' },
    { name: 'Qualité clinique', col: 'O', questionFR: 'Contribution à la qualité clinique' },
    { name: 'Présence confrères', col: 'P', questionFR: 'Bénéfice de la présence de confrères' },
    { name: 'Satisfaction patients*', col: 'Q', questionFR: 'Satisfaction patients (Groupes seulement)' },
    { name: 'Sécurité professionnelle', col: 'R', questionFR: 'Niveau de sécurité professionnelle' },
    { name: 'Équilibre vie pro/perso', col: 'S', questionFR: 'Équilibre vie professionnelle/personnelle' },
    { name: 'SATISFACTION GLOBALE', col: 'T', questionFR: 'Satisfaction globale avec le mode d\'exercice' },
  ];

  scoreThemes.forEach((theme) => {
    sheet.getCell(`B${currentRow}`).value = theme.name;
    sheet.getCell(`C${currentRow}`).value = { formula: `AVERAGEIF(${col('B')},"Groupe dentaire*",${col(theme.col)})` };
    sheet.getCell(`D${currentRow}`).value = { formula: `AVERAGEIF(${col('B')},"Cabinet*",${col(theme.col)})` };
    sheet.getCell(`E${currentRow}`).value = { formula: `C${currentRow}-D${currentRow}` };
    sheet.getCell(`F${currentRow}`).value = { formula: `IF(E${currentRow}>0.5,"Groupe",IF(E${currentRow}<-0.5,"Indépendant","≈ Égal"))` };

    ['C', 'D', 'E'].forEach(c => {
      sheet.getCell(`${c}${currentRow}`).numFmt = '0.00';
    });

    if (theme.name === 'SATISFACTION GLOBALE') {
      sheet.getCell(`B${currentRow}`).font = { bold: true };
    }
    currentRow++;
  });

  sheet.getCell(`B${currentRow}`).value = '* Question posée uniquement aux dentistes en groupe';
  sheet.getCell(`B${currentRow}`).font = { italic: true, size: 10 };
  currentRow += 3;

  // ========================================
  // SECTION 4: QUESTIONS SPÉCIFIQUES AUX INDÉPENDANTS
  // ========================================
  addSectionTitle('4. QUESTIONS SPÉCIFIQUES AUX INDÉPENDANTS');

  // Q14/Q20: Intention de rejoindre un groupe
  sheet.getCell(`B${currentRow}`).value = 'Intention de rejoindre un groupe dentaire';
  sheet.getCell(`B${currentRow}`).font = { bold: true };
  currentRow++;

  addTableHeaders(['Réponse', 'Nombre', 'Pourcentage']);

  const likelihoodOptions = [
    'Oui, certainement',
    'Oui, peut-être',
    'Non, probablement pas',
    'Non, certainement pas',
  ];

  likelihoodOptions.forEach(opt => {
    sheet.getCell(`B${currentRow}`).value = opt;
    sheet.getCell(`C${currentRow}`).value = { formula: `COUNTIF(${col('U')},"${opt}")` };
    sheet.getCell(`D${currentRow}`).value = { formula: `C${currentRow}/COUNTIF(${col('U')},"<>n/a")*100` };
    sheet.getCell(`D${currentRow}`).numFmt = '0.0"%"';
    currentRow++;
  });
  currentRow += 2;

  // Q15/Q21: Avantages perçus
  sheet.getCell(`B${currentRow}`).value = 'Avantages perçus des groupes dentaires';
  sheet.getCell(`B${currentRow}`).font = { bold: true };
  currentRow++;

  addTableHeaders(['Avantage', 'Nombre', 'Pourcentage']);

  const advantages = [
    { name: 'Soutien administratif', col: 'V' },
    { name: 'Accès technologies avancées', col: 'W' },
    { name: 'Collaboration avec confrères', col: 'X' },
    { name: 'Formation continue facilitée', col: 'Y' },
    { name: 'Meilleur équilibre vie pro/perso', col: 'Z' },
    { name: 'Sécurité financière', col: 'AA' },
    { name: 'Je ne perçois pas d\'avantages', col: 'AB' },
  ];

  advantages.forEach(adv => {
    sheet.getCell(`B${currentRow}`).value = adv.name;
    sheet.getCell(`C${currentRow}`).value = { formula: `COUNTIF(${col(adv.col)},1)` };
    sheet.getCell(`D${currentRow}`).value = { formula: `C${currentRow}/COUNTIF(${col('U')},"<>n/a")*100` };
    sheet.getCell(`D${currentRow}`).numFmt = '0.0"%"';
    currentRow++;
  });
  currentRow += 2;

  // Q16/Q22: Réticences
  sheet.getCell(`B${currentRow}`).value = 'Réticences vis-à-vis des groupes dentaires';
  sheet.getCell(`B${currentRow}`).font = { bold: true };
  currentRow++;

  addTableHeaders(['Réticence', 'Nombre', 'Pourcentage']);

  const reluctances = [
    { name: 'Perte d\'autonomie clinique', col: 'AC' },
    { name: 'Pression sur la productivité', col: 'AD' },
    { name: 'Rémunération moins avantageuse', col: 'AE' },
    { name: 'Moins de relation personnelle avec patients', col: 'AF' },
    { name: 'Standardisation des pratiques', col: 'AG' },
    { name: 'Je n\'ai pas de réticences', col: 'AH' },
  ];

  reluctances.forEach(rel => {
    sheet.getCell(`B${currentRow}`).value = rel.name;
    sheet.getCell(`C${currentRow}`).value = { formula: `COUNTIF(${col(rel.col)},1)` };
    sheet.getCell(`D${currentRow}`).value = { formula: `C${currentRow}/COUNTIF(${col('U')},"<>n/a")*100` };
    sheet.getCell(`D${currentRow}`).numFmt = '0.0"%"';
    currentRow++;
  });
  currentRow += 3;

  // ========================================
  // SECTION 5: SEGMENTS D'ACTIVITÉ
  // ========================================
  addSectionTitle('5. SEGMENTS D\'ACTIVITÉ');

  // Current activity
  sheet.getCell(`B${currentRow}`).value = 'Répartition actuelle de l\'activité (% du CA)';
  sheet.getCell(`B${currentRow}`).font = { bold: true };
  currentRow++;

  addTableHeaders(['Segment', 'Moy. Groupe', 'Moy. Indép.', 'Différence']);

  const activitySegments = [
    { name: 'Soins préventifs', col: 'AN' },
    { name: 'Soins de base', col: 'AO' },
    { name: 'Prothèses fixes et amovibles', col: 'AP' },
    { name: 'Implants et parodontie', col: 'AQ' },
    { name: 'Orthodontie et soins esthétiques', col: 'AR' },
  ];

  activitySegments.forEach(seg => {
    sheet.getCell(`B${currentRow}`).value = seg.name;
    sheet.getCell(`C${currentRow}`).value = { formula: `AVERAGEIF(${col('B')},"Groupe dentaire*",${col(seg.col)})` };
    sheet.getCell(`D${currentRow}`).value = { formula: `AVERAGEIF(${col('B')},"Cabinet*",${col(seg.col)})` };
    sheet.getCell(`E${currentRow}`).value = { formula: `C${currentRow}-D${currentRow}` };
    ['C', 'D', 'E'].forEach(c => {
      sheet.getCell(`${c}${currentRow}`).numFmt = '0.0';
    });
    currentRow++;
  });
  currentRow += 2;

  // Future activity
  sheet.getCell(`B${currentRow}`).value = 'Répartition anticipée dans 5 ans (% du CA)';
  sheet.getCell(`B${currentRow}`).font = { bold: true };
  currentRow++;

  addTableHeaders(['Segment', 'Moy. Groupe', 'Moy. Indép.', 'Évolution Grp', 'Évolution Ind']);

  const futureActivitySegments = [
    { name: 'Soins préventifs', currentCol: 'AN', futureCol: 'AX' },
    { name: 'Soins de base', currentCol: 'AO', futureCol: 'AY' },
    { name: 'Prothèses fixes et amovibles', currentCol: 'AP', futureCol: 'AZ' },
    { name: 'Implants et parodontie', currentCol: 'AQ', futureCol: 'BA' },
    { name: 'Orthodontie et soins esthétiques', currentCol: 'AR', futureCol: 'BB' },
  ];

  futureActivitySegments.forEach(seg => {
    sheet.getCell(`B${currentRow}`).value = seg.name;
    sheet.getCell(`C${currentRow}`).value = { formula: `AVERAGEIF(${col('B')},"Groupe dentaire*",${col(seg.futureCol)})` };
    sheet.getCell(`D${currentRow}`).value = { formula: `AVERAGEIF(${col('B')},"Cabinet*",${col(seg.futureCol)})` };
    sheet.getCell(`E${currentRow}`).value = { formula: `C${currentRow}-AVERAGEIF(${col('B')},"Groupe dentaire*",${col(seg.currentCol)})` };
    sheet.getCell(`F${currentRow}`).value = { formula: `D${currentRow}-AVERAGEIF(${col('B')},"Cabinet*",${col(seg.currentCol)})` };
    ['C', 'D', 'E', 'F'].forEach(c => {
      sheet.getCell(`${c}${currentRow}`).numFmt = '0.0';
    });
    currentRow++;
  });
  currentRow += 3;

  // ========================================
  // SECTION 6: STRUCTURES (GROUPES SEULEMENT)
  // ========================================
  addSectionTitle('6. RÉPARTITION PAR STRUCTURE (Groupes seulement)');

  addTableHeaders(['Structure', 'Nombre', 'Pourcentage']);

  const structures = Object.entries(q16Labels);
  structures.forEach(([key, label]) => {
    sheet.getCell(`B${currentRow}`).value = label;
    sheet.getCell(`C${currentRow}`).value = { formula: `COUNTIF(${col('BC')},"${label}")` };
    sheet.getCell(`D${currentRow}`).value = { formula: `C${currentRow}/COUNTIF(${col('B')},"Groupe dentaire*")*100` };
    sheet.getCell(`D${currentRow}`).numFmt = '0.0"%"';
    currentRow++;
  });
  currentRow += 3;

  // ========================================
  // SECTION 7: CONTACT
  // ========================================
  addSectionTitle('7. AUTORISATION DE CONTACT');

  addTableHeaders(['Réponse', 'Nombre', 'Pourcentage']);

  sheet.getCell(`B${currentRow}`).value = 'Oui';
  sheet.getCell(`C${currentRow}`).value = { formula: `COUNTIF(${col('BD')},"Yes")` };
  sheet.getCell(`D${currentRow}`).value = { formula: `C${currentRow}/(COUNTA(${col('A')})-1)*100` };
  sheet.getCell(`D${currentRow}`).numFmt = '0.0"%"';
  currentRow++;

  sheet.getCell(`B${currentRow}`).value = 'Non';
  sheet.getCell(`C${currentRow}`).value = { formula: `COUNTIF(${col('BD')},"No")` };
  sheet.getCell(`D${currentRow}`).value = { formula: `C${currentRow}/(COUNTA(${col('A')})-1)*100` };
  sheet.getCell(`D${currentRow}`).numFmt = '0.0"%"';

  // Set column widths
  sheet.getColumn('B').width = 45;
  sheet.getColumn('C').width = 15;
  sheet.getColumn('D').width = 15;
  sheet.getColumn('E').width = 15;
  sheet.getColumn('F').width = 15;

  return sheet;
}

// ========================================
// ENGLISH ANALYSIS SHEET
// ========================================
function createAnalysisSheetEN(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('Analysis EN');
  const dataSheet = 'Template for responses';
  const col = (letter: string) => `'${dataSheet}'!${letter}:${letter}`;

  let currentRow = 2;

  const addSectionTitle = (title: string, size: number = 14) => {
    sheet.getCell(`B${currentRow}`).value = title;
    sheet.getCell(`B${currentRow}`).font = { bold: true, size };
    currentRow += 2;
  };

  const addTableHeaders = (headers: string[]) => {
    const cols = 'BCDEFGHIJ'.split('');
    headers.forEach((h, i) => {
      const cell = sheet.getCell(`${cols[i]}${currentRow}`);
      cell.value = h;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E4576' } };
    });
    currentRow++;
  };

  // ========================================
  // TITLE
  // ========================================
  sheet.getCell('B2').value = 'COMPLETE SURVEY ANALYSIS - DENTISTS';
  sheet.getCell('B2').font = { bold: true, size: 18, color: { argb: 'FF1E4576' } };
  currentRow = 5;

  // ========================================
  // SECTION 1: SAMPLE SIZE
  // ========================================
  addSectionTitle('1. SAMPLE SIZE');

  sheet.getCell(`B${currentRow}`).value = 'Total respondents';
  sheet.getCell(`C${currentRow}`).value = { formula: `COUNTA(${col('A')})-1` };
  currentRow++;

  sheet.getCell(`B${currentRow}`).value = 'Dental group';
  sheet.getCell(`C${currentRow}`).value = { formula: `COUNTIF(${col('B')},"Groupe dentaire*")` };
  currentRow++;

  sheet.getCell(`B${currentRow}`).value = 'Independent individual practice';
  sheet.getCell(`C${currentRow}`).value = { formula: `COUNTIF(${col('B')},"Cabinet individuel*")` };
  currentRow++;

  sheet.getCell(`B${currentRow}`).value = 'Independent group practice';
  sheet.getCell(`C${currentRow}`).value = { formula: `COUNTIF(${col('B')},"Cabinet de groupe*")` };
  currentRow += 3;

  // ========================================
  // SECTION 2: RESPONDENT PROFILE
  // ========================================
  addSectionTitle('2. RESPONDENT PROFILE');

  sheet.getCell(`B${currentRow}`).value = 'Average year started practicing';
  sheet.getCell(`B${currentRow}`).font = { bold: true };
  currentRow++;

  addTableHeaders(['Group', 'Average', 'Min', 'Max']);

  sheet.getCell(`B${currentRow}`).value = 'Dental group';
  sheet.getCell(`C${currentRow}`).value = { formula: `AVERAGEIF(${col('B')},"Groupe dentaire*",${col('C')})` };
  sheet.getCell(`D${currentRow}`).value = { formula: `MINIFS(${col('C')},${col('B')},"Groupe dentaire*")` };
  sheet.getCell(`E${currentRow}`).value = { formula: `MAXIFS(${col('C')},${col('B')},"Groupe dentaire*")` };
  currentRow++;

  sheet.getCell(`B${currentRow}`).value = 'Independent';
  sheet.getCell(`C${currentRow}`).value = { formula: `AVERAGEIF(${col('B')},"Cabinet*",${col('C')})` };
  sheet.getCell(`D${currentRow}`).value = { formula: `MINIFS(${col('C')},${col('B')},"Cabinet*")` };
  sheet.getCell(`E${currentRow}`).value = { formula: `MAXIFS(${col('C')},${col('B')},"Cabinet*")` };
  currentRow += 2;

  // Previous experience
  sheet.getCell(`B${currentRow}`).value = 'Previous experience (% who selected)';
  sheet.getCell(`B${currentRow}`).font = { bold: true };
  currentRow++;

  addTableHeaders(['Experience type', 'Total', '% Total']);

  const q3LabelsEN = [
    'Independent individual practice - partner/founder',
    'Independent group practice - partner/founder',
    'Employee in private practice',
    'Employee in dental center/group',
    'Other practice mode',
    'First professional experience',
  ];
  const q3Cols = ['D', 'E', 'F', 'G', 'H', 'I'];

  q3LabelsEN.forEach((label, i) => {
    sheet.getCell(`B${currentRow}`).value = label;
    sheet.getCell(`C${currentRow}`).value = { formula: `COUNTIF(${col(q3Cols[i])},1)` };
    sheet.getCell(`D${currentRow}`).value = { formula: `C${currentRow}/(COUNTA(${col('A')})-1)*100` };
    sheet.getCell(`D${currentRow}`).numFmt = '0.0"%"';
    currentRow++;
  });
  currentRow += 2;

  // Years in structure
  sheet.getCell(`B${currentRow}`).value = 'Years in current structure';
  sheet.getCell(`B${currentRow}`).font = { bold: true };
  currentRow++;

  addTableHeaders(['Group', 'Average', 'Min', 'Max']);

  sheet.getCell(`B${currentRow}`).value = 'Dental group';
  sheet.getCell(`C${currentRow}`).value = { formula: `AVERAGEIF(${col('B')},"Groupe dentaire*",${col('J')})` };
  sheet.getCell(`D${currentRow}`).value = { formula: `MINIFS(${col('J')},${col('B')},"Groupe dentaire*")` };
  sheet.getCell(`E${currentRow}`).value = { formula: `MAXIFS(${col('J')},${col('B')},"Groupe dentaire*")` };
  currentRow++;

  sheet.getCell(`B${currentRow}`).value = 'Independent';
  sheet.getCell(`C${currentRow}`).value = { formula: `AVERAGEIF(${col('B')},"Cabinet*",${col('J')})` };
  sheet.getCell(`D${currentRow}`).value = { formula: `MINIFS(${col('J')},${col('B')},"Cabinet*")` };
  sheet.getCell(`E${currentRow}`).value = { formula: `MAXIFS(${col('J')},${col('B')},"Cabinet*")` };
  currentRow += 3;

  // ========================================
  // SECTION 3: EVALUATION SCORES (0-10)
  // ========================================
  addSectionTitle('3. EVALUATION SCORES (0-10) - GROUP VS INDEPENDENT COMPARISON');

  addTableHeaders(['Theme', 'Group Avg', 'Indep. Avg', 'Difference', 'Advantage']);

  const scoreThemesEN = [
    { name: 'Administrative support', col: 'K' },
    { name: 'Professional development', col: 'L' },
    { name: 'Continuing education', col: 'M' },
    { name: 'Technology access', col: 'N' },
    { name: 'Clinical quality', col: 'O' },
    { name: 'Peer collaboration', col: 'P' },
    { name: 'Patient satisfaction*', col: 'Q' },
    { name: 'Professional safety', col: 'R' },
    { name: 'Work-life balance', col: 'S' },
    { name: 'OVERALL SATISFACTION', col: 'T' },
  ];

  scoreThemesEN.forEach((theme) => {
    sheet.getCell(`B${currentRow}`).value = theme.name;
    sheet.getCell(`C${currentRow}`).value = { formula: `AVERAGEIF(${col('B')},"Groupe dentaire*",${col(theme.col)})` };
    sheet.getCell(`D${currentRow}`).value = { formula: `AVERAGEIF(${col('B')},"Cabinet*",${col(theme.col)})` };
    sheet.getCell(`E${currentRow}`).value = { formula: `C${currentRow}-D${currentRow}` };
    sheet.getCell(`F${currentRow}`).value = { formula: `IF(E${currentRow}>0.5,"Group",IF(E${currentRow}<-0.5,"Independent","≈ Equal"))` };

    ['C', 'D', 'E'].forEach(c => {
      sheet.getCell(`${c}${currentRow}`).numFmt = '0.00';
    });

    if (theme.name === 'OVERALL SATISFACTION') {
      sheet.getCell(`B${currentRow}`).font = { bold: true };
    }
    currentRow++;
  });

  sheet.getCell(`B${currentRow}`).value = '* Question only asked to group dentists';
  sheet.getCell(`B${currentRow}`).font = { italic: true, size: 10 };
  currentRow += 3;

  // ========================================
  // SECTION 4: INDEPENDENT-SPECIFIC QUESTIONS
  // ========================================
  addSectionTitle('4. INDEPENDENT-SPECIFIC QUESTIONS');

  sheet.getCell(`B${currentRow}`).value = 'Intention to join a dental group';
  sheet.getCell(`B${currentRow}`).font = { bold: true };
  currentRow++;

  addTableHeaders(['Response', 'Count', 'Percentage']);

  const likelihoodOptionsEN = [
    { fr: 'Oui, certainement', en: 'Yes, definitely' },
    { fr: 'Oui, peut-être', en: 'Yes, maybe' },
    { fr: 'Non, probablement pas', en: 'No, probably not' },
    { fr: 'Non, certainement pas', en: 'No, definitely not' },
  ];

  likelihoodOptionsEN.forEach(opt => {
    sheet.getCell(`B${currentRow}`).value = opt.en;
    sheet.getCell(`C${currentRow}`).value = { formula: `COUNTIF(${col('U')},"${opt.fr}")` };
    sheet.getCell(`D${currentRow}`).value = { formula: `C${currentRow}/COUNTIF(${col('U')},"<>n/a")*100` };
    sheet.getCell(`D${currentRow}`).numFmt = '0.0"%"';
    currentRow++;
  });
  currentRow += 2;

  // Perceived advantages
  sheet.getCell(`B${currentRow}`).value = 'Perceived advantages of dental groups';
  sheet.getCell(`B${currentRow}`).font = { bold: true };
  currentRow++;

  addTableHeaders(['Advantage', 'Count', 'Percentage']);

  const advantagesEN = [
    { name: 'Administrative support', col: 'V' },
    { name: 'Access to advanced technology', col: 'W' },
    { name: 'Collaboration with colleagues', col: 'X' },
    { name: 'Easier continuing education', col: 'Y' },
    { name: 'Better work-life balance', col: 'Z' },
    { name: 'Financial security', col: 'AA' },
    { name: 'I don\'t perceive any advantages', col: 'AB' },
  ];

  advantagesEN.forEach(adv => {
    sheet.getCell(`B${currentRow}`).value = adv.name;
    sheet.getCell(`C${currentRow}`).value = { formula: `COUNTIF(${col(adv.col)},1)` };
    sheet.getCell(`D${currentRow}`).value = { formula: `C${currentRow}/COUNTIF(${col('U')},"<>n/a")*100` };
    sheet.getCell(`D${currentRow}`).numFmt = '0.0"%"';
    currentRow++;
  });
  currentRow += 2;

  // Reluctances
  sheet.getCell(`B${currentRow}`).value = 'Reluctances about dental groups';
  sheet.getCell(`B${currentRow}`).font = { bold: true };
  currentRow++;

  addTableHeaders(['Reluctance', 'Count', 'Percentage']);

  const reluctancesEN = [
    { name: 'Loss of clinical autonomy', col: 'AC' },
    { name: 'Productivity pressure', col: 'AD' },
    { name: 'Less advantageous compensation', col: 'AE' },
    { name: 'Less personal patient relationships', col: 'AF' },
    { name: 'Practice standardization', col: 'AG' },
    { name: 'I have no reluctance', col: 'AH' },
  ];

  reluctancesEN.forEach(rel => {
    sheet.getCell(`B${currentRow}`).value = rel.name;
    sheet.getCell(`C${currentRow}`).value = { formula: `COUNTIF(${col(rel.col)},1)` };
    sheet.getCell(`D${currentRow}`).value = { formula: `C${currentRow}/COUNTIF(${col('U')},"<>n/a")*100` };
    sheet.getCell(`D${currentRow}`).numFmt = '0.0"%"';
    currentRow++;
  });
  currentRow += 3;

  // ========================================
  // SECTION 5: ACTIVITY SEGMENTS
  // ========================================
  addSectionTitle('5. ACTIVITY SEGMENTS');

  sheet.getCell(`B${currentRow}`).value = 'Current activity distribution (% of revenue)';
  sheet.getCell(`B${currentRow}`).font = { bold: true };
  currentRow++;

  addTableHeaders(['Segment', 'Group Avg', 'Indep. Avg', 'Difference']);

  const activitySegmentsEN = [
    { name: 'Preventive care', col: 'AN' },
    { name: 'Basic care (restoration, endo, extractions)', col: 'AO' },
    { name: 'Fixed and removable prosthetics', col: 'AP' },
    { name: 'Implants and periodontics', col: 'AQ' },
    { name: 'Orthodontics and aesthetic care', col: 'AR' },
  ];

  activitySegmentsEN.forEach(seg => {
    sheet.getCell(`B${currentRow}`).value = seg.name;
    sheet.getCell(`C${currentRow}`).value = { formula: `AVERAGEIF(${col('B')},"Groupe dentaire*",${col(seg.col)})` };
    sheet.getCell(`D${currentRow}`).value = { formula: `AVERAGEIF(${col('B')},"Cabinet*",${col(seg.col)})` };
    sheet.getCell(`E${currentRow}`).value = { formula: `C${currentRow}-D${currentRow}` };
    ['C', 'D', 'E'].forEach(c => {
      sheet.getCell(`${c}${currentRow}`).numFmt = '0.0';
    });
    currentRow++;
  });
  currentRow += 2;

  // Future activity
  sheet.getCell(`B${currentRow}`).value = 'Anticipated distribution in 5 years (% of revenue)';
  sheet.getCell(`B${currentRow}`).font = { bold: true };
  currentRow++;

  addTableHeaders(['Segment', 'Group Avg', 'Indep. Avg', 'Grp Change', 'Ind Change']);

  const futureActivitySegmentsEN = [
    { name: 'Preventive care', currentCol: 'AN', futureCol: 'AX' },
    { name: 'Basic care (restoration, endo, extractions)', currentCol: 'AO', futureCol: 'AY' },
    { name: 'Fixed and removable prosthetics', currentCol: 'AP', futureCol: 'AZ' },
    { name: 'Implants and periodontics', currentCol: 'AQ', futureCol: 'BA' },
    { name: 'Orthodontics and aesthetic care', currentCol: 'AR', futureCol: 'BB' },
  ];

  futureActivitySegmentsEN.forEach(seg => {
    sheet.getCell(`B${currentRow}`).value = seg.name;
    sheet.getCell(`C${currentRow}`).value = { formula: `AVERAGEIF(${col('B')},"Groupe dentaire*",${col(seg.futureCol)})` };
    sheet.getCell(`D${currentRow}`).value = { formula: `AVERAGEIF(${col('B')},"Cabinet*",${col(seg.futureCol)})` };
    sheet.getCell(`E${currentRow}`).value = { formula: `C${currentRow}-AVERAGEIF(${col('B')},"Groupe dentaire*",${col(seg.currentCol)})` };
    sheet.getCell(`F${currentRow}`).value = { formula: `D${currentRow}-AVERAGEIF(${col('B')},"Cabinet*",${col(seg.currentCol)})` };
    ['C', 'D', 'E', 'F'].forEach(c => {
      sheet.getCell(`${c}${currentRow}`).numFmt = '0.0';
    });
    currentRow++;
  });
  currentRow += 3;

  // ========================================
  // SECTION 6: CONTACT AUTHORIZATION
  // ========================================
  addSectionTitle('6. CONTACT AUTHORIZATION');

  addTableHeaders(['Response', 'Count', 'Percentage']);

  sheet.getCell(`B${currentRow}`).value = 'Yes';
  sheet.getCell(`C${currentRow}`).value = { formula: `COUNTIF(${col('BD')},"Yes")` };
  sheet.getCell(`D${currentRow}`).value = { formula: `C${currentRow}/(COUNTA(${col('A')})-1)*100` };
  sheet.getCell(`D${currentRow}`).numFmt = '0.0"%"';
  currentRow++;

  sheet.getCell(`B${currentRow}`).value = 'No';
  sheet.getCell(`C${currentRow}`).value = { formula: `COUNTIF(${col('BD')},"No")` };
  sheet.getCell(`D${currentRow}`).value = { formula: `C${currentRow}/(COUNTA(${col('A')})-1)*100` };
  sheet.getCell(`D${currentRow}`).numFmt = '0.0"%"';

  // Set column widths
  sheet.getColumn('B').width = 45;
  sheet.getColumn('C').width = 15;
  sheet.getColumn('D').width = 15;
  sheet.getColumn('E').width = 15;
  sheet.getColumn('F').width = 15;

  return sheet;
}

export async function GET(request: NextRequest) {
  try {
    const responses = await prisma.response.findMany({
      where: { completed: true },
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Groupes Dentaires Survey';
    workbook.created = new Date();

    // Create all sheets
    createDataSheet(workbook, responses);
    createAnalysisSheetFR(workbook);
    createAnalysisSheetEN(workbook);

    const buffer = await workbook.xlsx.writeBuffer();
    const date = new Date().toISOString().split('T')[0];

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="groupesdentaires-analysis-${date}.xlsx"`,
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
