import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Survey Export Methodology';
  workbook.created = new Date();

  // ========================================
  // SHEET 1: Overview
  // ========================================
  const overviewSheet = workbook.addWorksheet('1. Overview');

  overviewSheet.getCell('B2').value = 'SURVEY DATA EXPORT METHODOLOGY';
  overviewSheet.getCell('B2').font = { bold: true, size: 20, color: { argb: 'FF1E4576' } };

  overviewSheet.getCell('B4').value = 'From Unstructured CSV to Structured Excel Analysis';
  overviewSheet.getCell('B4').font = { italic: true, size: 14 };

  let row = 7;
  const phases = [
    { num: '1', title: 'Data Structure Design', desc: 'Map source data to structured columns' },
    { num: '2', title: 'Column Mapping', desc: 'Handle branching logic and multiple choice expansion' },
    { num: '3', title: 'Excel Structure', desc: 'Design sheets and headers' },
    { num: '4', title: 'Analysis Formulas', desc: 'Build formulas referencing data sheet' },
    { num: '5', title: 'Implementation', desc: 'Use ExcelJS to generate .xlsx files' },
  ];

  overviewSheet.getCell(`B${row}`).value = 'PHASES';
  overviewSheet.getCell(`B${row}`).font = { bold: true, size: 14 };
  row += 2;

  phases.forEach(p => {
    overviewSheet.getCell(`B${row}`).value = `Phase ${p.num}`;
    overviewSheet.getCell(`B${row}`).font = { bold: true };
    overviewSheet.getCell(`C${row}`).value = p.title;
    overviewSheet.getCell(`D${row}`).value = p.desc;
    row++;
  });

  overviewSheet.getColumn('B').width = 15;
  overviewSheet.getColumn('C').width = 25;
  overviewSheet.getColumn('D').width = 50;

  // ========================================
  // SHEET 2: Column Mapping
  // ========================================
  const mappingSheet = workbook.addWorksheet('2. Column Mapping');

  mappingSheet.getCell('B2').value = 'COLUMN MAPPING STRATEGIES';
  mappingSheet.getCell('B2').font = { bold: true, size: 16, color: { argb: 'FF1E4576' } };

  row = 5;
  mappingSheet.getCell(`B${row}`).value = 'Question Type';
  mappingSheet.getCell(`C${row}`).value = 'Source Format';
  mappingSheet.getCell(`D${row}`).value = 'Target Format';
  mappingSheet.getCell(`E${row}`).value = 'Example';
  mappingSheet.getCell(`F${row}`).value = 'Rationale';
  ['B', 'C', 'D', 'E', 'F'].forEach(c => {
    mappingSheet.getCell(`${c}${row}`).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    mappingSheet.getCell(`${c}${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E4576' } };
  });
  row++;

  const mappings = [
    { type: 'Single Choice', source: 'Code (A, B, C)', target: 'Full label text', example: '"A" → "Dental group"', rationale: 'Human readable' },
    { type: 'Multiple Choice', source: 'Array ["A","C"]', target: 'Binary columns (0/1)', example: 'Q2_A=1, Q2_B=0, Q2_C=1', rationale: 'Enables COUNTIF, pivot tables' },
    { type: 'Scale (0-10)', source: 'Number', target: 'Number (unchanged)', example: '7 → 7', rationale: 'Enables AVERAGE, MIN, MAX' },
    { type: 'Percentage Dist.', source: 'Object {a:30,b:70}', target: 'Separate % columns', example: 'Q14_a=30, Q14_b=70', rationale: 'One column per segment' },
    { type: 'Text/Email', source: 'String', target: 'String (unchanged)', example: '"email@test.com"', rationale: 'Keep as-is' },
    { type: 'Conditional Q', source: 'Different IDs per path', target: 'Unified column + n/a', example: 'Q4 (group) + Q4i (indep) → Q5', rationale: 'Consistent structure' },
  ];

  mappings.forEach(m => {
    mappingSheet.getCell(`B${row}`).value = m.type;
    mappingSheet.getCell(`C${row}`).value = m.source;
    mappingSheet.getCell(`D${row}`).value = m.target;
    mappingSheet.getCell(`E${row}`).value = m.example;
    mappingSheet.getCell(`F${row}`).value = m.rationale;
    row++;
  });

  row += 2;
  mappingSheet.getCell(`B${row}`).value = 'BRANCHING LOGIC EXAMPLE';
  mappingSheet.getCell(`B${row}`).font = { bold: true, size: 14 };
  row += 2;

  mappingSheet.getCell(`B${row}`).value = 'Unified Column';
  mappingSheet.getCell(`C${row}`).value = 'Group Path (Q0=A)';
  mappingSheet.getCell(`D${row}`).value = 'Independent Path (Q0=B)';
  mappingSheet.getCell(`E${row}`).value = 'Theme';
  ['B', 'C', 'D', 'E'].forEach(c => {
    mappingSheet.getCell(`${c}${row}`).font = { bold: true };
    mappingSheet.getCell(`${c}${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
  });
  row++;

  const branchMappings = [
    { unified: 'Q5: Admin support', group: 'Q4', indep: 'Q4i', theme: 'Administrative efficiency' },
    { unified: 'Q6: Prof development', group: 'Q5', indep: 'Q5i', theme: 'Professional growth' },
    { unified: 'Q11: Patient satisfaction', group: 'Q10', indep: 'n/a (not asked)', theme: 'Group-only question' },
  ];

  branchMappings.forEach(b => {
    mappingSheet.getCell(`B${row}`).value = b.unified;
    mappingSheet.getCell(`C${row}`).value = b.group;
    mappingSheet.getCell(`D${row}`).value = b.indep;
    mappingSheet.getCell(`E${row}`).value = b.theme;
    row++;
  });

  mappingSheet.getColumn('B').width = 25;
  mappingSheet.getColumn('C').width = 25;
  mappingSheet.getColumn('D').width = 25;
  mappingSheet.getColumn('E').width = 30;
  mappingSheet.getColumn('F').width = 30;

  // ========================================
  // SHEET 3: Excel Formulas
  // ========================================
  const formulasSheet = workbook.addWorksheet('3. Excel Formulas');

  formulasSheet.getCell('B2').value = 'EXCEL FORMULA REFERENCE';
  formulasSheet.getCell('B2').font = { bold: true, size: 16, color: { argb: 'FF1E4576' } };

  row = 5;
  formulasSheet.getCell(`B${row}`).value = 'Purpose';
  formulasSheet.getCell(`C${row}`).value = 'Formula';
  formulasSheet.getCell(`D${row}`).value = 'Notes';
  ['B', 'C', 'D'].forEach(c => {
    formulasSheet.getCell(`${c}${row}`).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    formulasSheet.getCell(`${c}${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E4576' } };
  });
  row++;

  const formulas = [
    { purpose: 'Count total respondents', formula: "=COUNTA('Data'!A:A)-1", notes: 'Subtract 1 for header row' },
    { purpose: 'Count by text match', formula: '=COUNTIF(\'Data\'!B:B,"Group*")', notes: 'Use * for wildcard' },
    { purpose: 'Count binary selection', formula: "=COUNTIF('Data'!D:D,1)", notes: 'For 0/1 columns' },
    { purpose: 'Average by group', formula: '=AVERAGEIF(\'Data\'!$B:$B,"Group*",\'Data\'!K:K)', notes: 'Lock criteria column with $' },
    { purpose: 'Min by group', formula: '=MINIFS(\'Data\'!C:C,\'Data\'!B:B,"Group*")', notes: 'MINIFS for conditional min' },
    { purpose: 'Max by group', formula: '=MAXIFS(\'Data\'!C:C,\'Data\'!B:B,"Group*")', notes: 'MAXIFS for conditional max' },
    { purpose: 'Count specific text', formula: '=COUNTIF(\'Data\'!U:U,"Yes, definitely")', notes: 'Exact text match' },
    { purpose: 'Exclude n/a from count', formula: '=COUNTIF(\'Data\'!U:U,"<>n/a")', notes: '<> means not equal' },
    { purpose: 'Percentage calculation', formula: '=C5/(COUNTA(\'Data\'!A:A)-1)*100', notes: 'Count / total * 100' },
    { purpose: 'Difference', formula: '=C5-D5', notes: 'Group A minus Group B' },
    { purpose: 'Advantage indicator', formula: '=IF(E5>0.5,"Group A",IF(E5<-0.5,"Group B","Equal"))', notes: 'Threshold of 0.5' },
    { purpose: 'Evolution (future-current)', formula: '=AVERAGEIF(...future)-AVERAGEIF(...current)', notes: 'Change over time' },
  ];

  formulas.forEach(f => {
    formulasSheet.getCell(`B${row}`).value = f.purpose;
    formulasSheet.getCell(`C${row}`).value = f.formula;
    formulasSheet.getCell(`D${row}`).value = f.notes;
    row++;
  });

  formulasSheet.getColumn('B').width = 30;
  formulasSheet.getColumn('C').width = 55;
  formulasSheet.getColumn('D').width = 30;

  // ========================================
  // SHEET 4: Analysis Sections
  // ========================================
  const sectionsSheet = workbook.addWorksheet('4. Analysis Sections');

  sectionsSheet.getCell('B2').value = 'ANALYSIS SECTION TEMPLATES';
  sectionsSheet.getCell('B2').font = { bold: true, size: 16, color: { argb: 'FF1E4576' } };

  row = 5;

  // Section 1: Sample Size
  sectionsSheet.getCell(`B${row}`).value = 'SECTION 1: Sample Size';
  sectionsSheet.getCell(`B${row}`).font = { bold: true, size: 12 };
  row += 2;

  sectionsSheet.getCell(`B${row}`).value = 'Metric';
  sectionsSheet.getCell(`C${row}`).value = 'Count';
  ['B', 'C'].forEach(c => {
    sectionsSheet.getCell(`${c}${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
  });
  row++;
  sectionsSheet.getCell(`B${row}`).value = 'Total respondents';
  sectionsSheet.getCell(`C${row}`).value = '=COUNTA(...)-1';
  row++;
  sectionsSheet.getCell(`B${row}`).value = 'Group A';
  sectionsSheet.getCell(`C${row}`).value = '=COUNTIF(...,"A*")';
  row++;
  sectionsSheet.getCell(`B${row}`).value = 'Group B';
  sectionsSheet.getCell(`C${row}`).value = '=COUNTIF(...,"B*")';
  row += 3;

  // Section 2: Profile
  sectionsSheet.getCell(`B${row}`).value = 'SECTION 2: Respondent Profile';
  sectionsSheet.getCell(`B${row}`).font = { bold: true, size: 12 };
  row += 2;

  sectionsSheet.getCell(`B${row}`).value = 'Group';
  sectionsSheet.getCell(`C${row}`).value = 'Average';
  sectionsSheet.getCell(`D${row}`).value = 'Min';
  sectionsSheet.getCell(`E${row}`).value = 'Max';
  ['B', 'C', 'D', 'E'].forEach(c => {
    sectionsSheet.getCell(`${c}${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
  });
  row++;
  sectionsSheet.getCell(`B${row}`).value = 'Group A';
  sectionsSheet.getCell(`C${row}`).value = '=AVERAGEIF(...)';
  sectionsSheet.getCell(`D${row}`).value = '=MINIFS(...)';
  sectionsSheet.getCell(`E${row}`).value = '=MAXIFS(...)';
  row += 3;

  // Section 3: Score Comparison
  sectionsSheet.getCell(`B${row}`).value = 'SECTION 3: Score Comparison (0-10 scales)';
  sectionsSheet.getCell(`B${row}`).font = { bold: true, size: 12 };
  row += 2;

  sectionsSheet.getCell(`B${row}`).value = 'Theme';
  sectionsSheet.getCell(`C${row}`).value = 'Group A Avg';
  sectionsSheet.getCell(`D${row}`).value = 'Group B Avg';
  sectionsSheet.getCell(`E${row}`).value = 'Difference';
  sectionsSheet.getCell(`F${row}`).value = 'Advantage';
  ['B', 'C', 'D', 'E', 'F'].forEach(c => {
    sectionsSheet.getCell(`${c}${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
  });
  row++;
  sectionsSheet.getCell(`B${row}`).value = 'Theme 1';
  sectionsSheet.getCell(`C${row}`).value = '=AVERAGEIF(...)';
  sectionsSheet.getCell(`D${row}`).value = '=AVERAGEIF(...)';
  sectionsSheet.getCell(`E${row}`).value = '=C-D';
  sectionsSheet.getCell(`F${row}`).value = '=IF(E>0.5,"A",IF(E<-0.5,"B","="))';
  row += 3;

  // Section 4: Distribution
  sectionsSheet.getCell(`B${row}`).value = 'SECTION 4: Categorical Distribution';
  sectionsSheet.getCell(`B${row}`).font = { bold: true, size: 12 };
  row += 2;

  sectionsSheet.getCell(`B${row}`).value = 'Option';
  sectionsSheet.getCell(`C${row}`).value = 'Count';
  sectionsSheet.getCell(`D${row}`).value = 'Percentage';
  ['B', 'C', 'D'].forEach(c => {
    sectionsSheet.getCell(`${c}${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
  });
  row++;
  sectionsSheet.getCell(`B${row}`).value = 'Option A';
  sectionsSheet.getCell(`C${row}`).value = '=COUNTIF(...,"A")';
  sectionsSheet.getCell(`D${row}`).value = '=C/total*100';

  sectionsSheet.getColumn('B').width = 30;
  sectionsSheet.getColumn('C').width = 20;
  sectionsSheet.getColumn('D').width = 20;
  sectionsSheet.getColumn('E').width = 15;
  sectionsSheet.getColumn('F').width = 25;

  // ========================================
  // SHEET 5: Implementation Checklist
  // ========================================
  const checklistSheet = workbook.addWorksheet('5. Checklist');

  checklistSheet.getCell('B2').value = 'IMPLEMENTATION CHECKLIST';
  checklistSheet.getCell('B2').font = { bold: true, size: 16, color: { argb: 'FF1E4576' } };

  row = 5;
  const checklist = [
    { phase: 'Data Mapping', items: [
      'List all questions with IDs and types',
      'Identify branching/conditional logic',
      'Create unified column mapping for branched questions',
      'Define binary expansion for multiple choice',
      'Map codes to full labels',
    ]},
    { phase: 'Excel Design', items: [
      'Design data sheet headers',
      'Plan analysis sections',
      'Define formulas for each metric',
      'Create French and English versions if needed',
    ]},
    { phase: 'Implementation', items: [
      'Install ExcelJS: npm install exceljs',
      'Create mapping function for responses',
      'Create data sheet with headers',
      'Create analysis sheet with formulas',
      'Test with sample data',
      'Add download endpoint',
    ]},
    { phase: 'Validation', items: [
      'Verify all questions are mapped',
      'Check formulas calculate correctly',
      'Test with edge cases (n/a, empty values)',
      'Compare totals between sheets',
    ]},
  ];

  checklist.forEach(section => {
    checklistSheet.getCell(`B${row}`).value = section.phase;
    checklistSheet.getCell(`B${row}`).font = { bold: true, size: 12 };
    row++;

    section.items.forEach(item => {
      checklistSheet.getCell(`B${row}`).value = '☐';
      checklistSheet.getCell(`C${row}`).value = item;
      row++;
    });
    row++;
  });

  checklistSheet.getColumn('B').width = 5;
  checklistSheet.getColumn('C').width = 50;

  // ========================================
  // SHEET 6: Code Examples
  // ========================================
  const codeSheet = workbook.addWorksheet('6. Code Examples');

  codeSheet.getCell('B2').value = 'EXCELJS CODE PATTERNS';
  codeSheet.getCell('B2').font = { bold: true, size: 16, color: { argb: 'FF1E4576' } };

  row = 5;
  const codeExamples = [
    { title: 'Create workbook', code: `const workbook = new ExcelJS.Workbook();\nconst sheet = workbook.addWorksheet('Data');` },
    { title: 'Add data row', code: `sheet.addRow(['#1', 'Group A', 2020, 1, 0, 1]);` },
    { title: 'Style header', code: `headerRow.font = { bold: true };\nheaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };` },
    { title: 'Add formula', code: `sheet.getCell('C5').value = { formula: \`AVERAGEIF('Data'!B:B,"Group*",'Data'!K:K)\` };` },
    { title: 'Number format', code: `sheet.getCell('C5').numFmt = '0.00';  // 2 decimals\nsheet.getCell('D5').numFmt = '0.0"%"';  // Percentage` },
    { title: 'Freeze row', code: `sheet.views = [{ state: 'frozen', ySplit: 1 }];` },
    { title: 'Column width', code: `sheet.getColumn('B').width = 30;` },
    { title: 'Generate buffer', code: `const buffer = await workbook.xlsx.writeBuffer();` },
    { title: 'HTTP response', code: `return new Response(buffer, {\n  headers: {\n    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',\n    'Content-Disposition': 'attachment; filename="export.xlsx"'\n  }\n});` },
  ];

  codeExamples.forEach(ex => {
    codeSheet.getCell(`B${row}`).value = ex.title;
    codeSheet.getCell(`B${row}`).font = { bold: true };
    row++;
    codeSheet.getCell(`B${row}`).value = ex.code;
    codeSheet.getCell(`B${row}`).font = { name: 'Consolas', size: 10 };
    row += 2;
  });

  codeSheet.getColumn('B').width = 80;

  // Generate and return
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="Survey_Export_Methodology.xlsx"',
    },
  });
}
