# Survey Data Export Methodology
## From Unstructured CSV to Structured Excel Analysis

---

## PHASE 1: DATA STRUCTURE DESIGN

### 1.1 Column Mapping Strategy

| Source Format | Target Format | Rationale |
|---------------|---------------|-----------|
| Multiple choice (array) | Binary columns (0/1) | Enables COUNTIF, easier pivot tables |
| Single choice (code) | Full label text | Human readable |
| Scale (0-10) | Numeric | Enables AVERAGE, MIN, MAX |
| Percentage distribution (object) | Separate % columns | One column per segment |
| Conditional questions | Unified columns + "n/a" | Consistent structure regardless of path |

### 1.2 Handling Branching Logic

**Problem**: Survey has different questions for different respondent types (e.g., Group vs Independent)

**Solution**:
- Create unified columns for equivalent questions
- Map different question IDs to same column based on respondent type
- Use "n/a" for questions not applicable to respondent type

```
Example mapping:
| Unified Column | Group Path | Independent Path |
|----------------|------------|------------------|
| Q5: Admin      | Q4         | Q4i              |
| Q6: Dev Prof   | Q5         | Q5i              |
| Q11: Patients  | Q10        | n/a (not asked)  |
```

### 1.3 Binary Expansion for Multiple Choice

**Before** (hard to analyze):
```
Q2: ["A", "C", "D"]
```

**After** (easy to analyze):
```
Q2_A: 1
Q2_B: 0
Q2_C: 1
Q2_D: 1
Q2_E: 0
```

---

## PHASE 2: EXCEL STRUCTURE

### 2.1 Sheet Organization

| Sheet | Purpose |
|-------|---------|
| `Data` or `Template for responses` | Raw data, one row per respondent |
| `Analyse FR` / `Analysis EN` | Formulas referencing data sheet |

### 2.2 Data Sheet Best Practices

- Row 1: Headers (freeze this row)
- Row 2+: Data (one respondent per row)
- Column A: Respondent ID (#1, #2, etc.)
- Consistent data types per column
- No merged cells

### 2.3 Header Naming Convention

```
{QuestionNumber}: {Short description}
{QuestionNumber}_{Option}: {Description} (for binary expansions)
```

Examples:
- `Q1: Current work type`
- `Q3_1: Previous experience - Independent practice`
- `Q18_1: % activity in Preventive care`

---

## PHASE 3: ANALYSIS FORMULAS

### 3.1 Sample Size

```excel
Total: =COUNTA('Data'!A:A)-1
Group A: =COUNTIF('Data'!B:B,"Label A*")
Group B: =COUNTIF('Data'!B:B,"Label B*")
```

### 3.2 Averages by Group

```excel
=AVERAGEIF('Data'!$B:$B,"Group A*",'Data'!K:K)
=AVERAGEIF('Data'!$B:$B,"Group B*",'Data'!K:K)
```

### 3.3 Min/Max by Group

```excel
=MINIFS('Data'!C:C,'Data'!B:B,"Group A*")
=MAXIFS('Data'!C:C,'Data'!B:B,"Group A*")
```

### 3.4 Counting Binary Responses

```excel
Count selected: =COUNTIF('Data'!D:D,1)
Percentage: =COUNTIF('Data'!D:D,1)/(COUNTA('Data'!A:A)-1)*100
```

### 3.5 Counting Specific Text Values

```excel
=COUNTIF('Data'!U:U,"Yes, definitely")
```

### 3.6 Excluding N/A from Calculations

```excel
=COUNTIF('Data'!U:U,"<>n/a")
=C5/COUNTIF('Data'!U:U,"<>n/a")*100
```

### 3.7 Difference & Advantage Indicator

```excel
Difference: =C5-D5
Advantage: =IF(E5>0.5,"Group A",IF(E5<-0.5,"Group B","≈ Equal"))
```

### 3.8 Evolution (Current vs Future)

```excel
=AVERAGEIF('Data'!$B:$B,"Group*",'Data'!AX:AX)-AVERAGEIF('Data'!$B:$B,"Group*",'Data'!AN:AN)
```

---

## PHASE 4: ANALYSIS SECTIONS TEMPLATE

### 4.1 Sample Size Section
| Metric | Count |
|--------|-------|
| Total respondents | =formula |
| Group A | =formula |
| Group B | =formula |

### 4.2 Profile Section
| Metric | Group A | Group B | Avg | Min | Max |
|--------|---------|---------|-----|-----|-----|

### 4.3 Score Comparison Section
| Theme | Group A Avg | Group B Avg | Difference | Advantage |
|-------|-------------|-------------|------------|-----------|

### 4.4 Distribution Section (for categorical)
| Option | Count | Percentage |
|--------|-------|------------|

### 4.5 Activity/Segment Section
| Segment | Current A | Current B | Future A | Future B | Evol A | Evol B |
|---------|-----------|-----------|----------|----------|--------|--------|

---

## PHASE 5: TECH STACK (for automated export)

### 5.1 Library: ExcelJS (Node.js)

```bash
npm install exceljs
```

### 5.2 Key Code Patterns

**Create workbook and sheets:**
```typescript
import ExcelJS from 'exceljs';

const workbook = new ExcelJS.Workbook();
const dataSheet = workbook.addWorksheet('Data');
const analysisSheet = workbook.addWorksheet('Analysis');
```

**Add headers with styling:**
```typescript
dataSheet.addRow(headers);
const headerRow = dataSheet.getRow(1);
headerRow.font = { bold: true };
headerRow.fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE0E0E0' },
};
```

**Add formula cells:**
```typescript
sheet.getCell('C5').value = {
  formula: `AVERAGEIF('Data'!$B:$B,"Group*",'Data'!K:K)`
};
sheet.getCell('C5').numFmt = '0.00';  // Number format
```

**Freeze header row:**
```typescript
sheet.views = [{ state: 'frozen', ySplit: 1 }];
```

**Generate downloadable file:**
```typescript
const buffer = await workbook.xlsx.writeBuffer();
return new Response(buffer, {
  headers: {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': 'attachment; filename="export.xlsx"',
  },
});
```

---

## PHASE 6: CHECKLIST FOR NEW SURVEY

### 6.1 Data Mapping
- [ ] List all questions with IDs
- [ ] Identify question types (single, multiple, scale, text, distribution)
- [ ] Identify conditional/branching logic
- [ ] Create unified column mapping for branched questions
- [ ] Define binary expansion for multiple choice questions

### 6.2 Analysis Design
- [ ] Define respondent groups for comparison
- [ ] List all metrics to calculate per group
- [ ] Design section layout (sample size, profile, scores, distributions)
- [ ] Create formula templates

### 6.3 Implementation
- [ ] Create data sheet with headers
- [ ] Implement response mapping function
- [ ] Create analysis sheet with formulas
- [ ] Add translations if needed
- [ ] Test with sample data

---

## QUICK REFERENCE: Excel Formula Patterns

| Purpose | Formula |
|---------|---------|
| Count non-empty | `=COUNTA(range)-1` |
| Count matching text | `=COUNTIF(range,"text*")` |
| Count numeric value | `=COUNTIF(range,1)` |
| Average by condition | `=AVERAGEIF(criteria_range,"criteria",avg_range)` |
| Min by condition | `=MINIFS(range,criteria_range,"criteria")` |
| Max by condition | `=MAXIFS(range,criteria_range,"criteria")` |
| Exclude n/a | `=COUNTIF(range,"<>n/a")` |
| Percentage | `=count/total*100` |
| Conditional text | `=IF(val>0.5,"A",IF(val<-0.5,"B","Equal"))` |

---

## FILE NAMING CONVENTION

```
{project}-{type}-{date}.xlsx

Examples:
- dentist-survey-analysis-2024-01-22.xlsx
- customer-feedback-export-2024-01-22.xlsx
```
