const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
} = require("docx");
const fs = require("fs");

// Survey structure translated to English
const surveyStructure = {
  title: "Dental Groups Survey - Questionnaire Structure",
  subtitle: "Survey for Swiss Dental Practitioners",

  questionTypes: [
    { type: "single", description: "Single choice (radio buttons)" },
    { type: "multiple", description: "Multiple choice (checkboxes)" },
    { type: "multiple_exclusive", description: "Multiple choice with exclusive option" },
    { type: "numeric", description: "Numeric input" },
    { type: "text", description: "Free text input" },
    { type: "scale", description: "Scale slider (0-10)" },
    { type: "percentage_distribution", description: "Percentage distribution (must total 100%)" },
  ],

  sections: [
    {
      id: "0",
      title: "Practice Type",
      description: "Routing question to determine respondent branch",
    },
    {
      id: "A",
      title: "Profile",
      description: "Professional background and experience",
    },
    {
      id: "B",
      title: "Practice Evaluation",
      description: "Assessment of current practice structure (different questions for group vs. independent dentists)",
    },
    {
      id: "B2",
      title: "Perception of Dental Groups",
      description: "Views on dental groups (independent dentists only)",
    },
    {
      id: "C",
      title: "Activity Segments",
      description: "Current and anticipated activity distribution",
    },
    {
      id: "D",
      title: "Additional Information",
      description: "Organizational affiliation and contact details",
    },
  ],

  activitySegments: [
    { value: "preventifs", label: "Preventive care" },
    { value: "hygiene", label: "Basic hygiene care" },
    { value: "protheses", label: "Fixed and removable dentures" },
    { value: "implants", label: "Implants" },
    { value: "orthodontie", label: "Orthodontics and cosmetic care" },
  ],

  questions: [
    // SECTION 0 - Routing Question
    {
      id: "Q0",
      section: "0",
      type: "single",
      question: "In what type of structure do you currently practice?",
      required: true,
      showCondition: "All respondents",
      options: [
        { value: "A", label: "Dental group (center or network of practices)" },
        { value: "B", label: "Independent solo practice" },
        { value: "C", label: "Independent group practice (multiple practitioners)" },
      ],
    },

    // SECTION A - Profile
    {
      id: "Q1",
      section: "A",
      type: "numeric",
      question: "In what year did you start practicing as a dentist?",
      required: true,
      showCondition: "All respondents",
      validation: "Range: 1960-2025",
      placeholder: "Example: 2010",
    },
    {
      id: "Q2",
      section: "A",
      type: "multiple_exclusive",
      question: "What mode(s) of practice have you experienced during your career?",
      subtitle: "Select all applicable answers",
      required: true,
      showCondition: "All respondents",
      options: [
        { value: "A", label: "Independent solo practice - partner/founder" },
        { value: "B", label: "Independent group practice (multiple practitioners) - partner/founder" },
        { value: "C", label: "Employee in a private practice" },
        { value: "D", label: "Employee in a dental center or group" },
        { value: "E", label: "Other mode of practice (e.g., hospital, university)" },
        { value: "F", label: "This is my first professional experience", exclusive: true },
      ],
    },
    {
      id: "Q3",
      section: "A",
      type: "numeric",
      question: "How long have you been affiliated with your current structure?",
      required: true,
      showCondition: "All respondents",
      validation: "Range: 0-50 years",
      unit: "years",
      placeholder: "Example: 3",
    },

    // SECTION B - Group Dentists (Q4-Q13)
    {
      id: "Q4",
      section: "B",
      type: "scale",
      question: "How do you rate the effectiveness of administrative and operational support (e.g., billing, scheduling) in reducing your workload?",
      required: true,
      showCondition: "Group dentists only (Q0 = A)",
      scaleLabels: { min: "Very ineffective", max: "Very effective" },
    },
    {
      id: "Q5",
      section: "B",
      type: "scale",
      question: "To what extent do you think your affiliation with a dental group contributes to your professional development?",
      required: true,
      showCondition: "Group dentists only (Q0 = A)",
      scaleLabels: { min: "Not at all", max: "Enormously" },
    },
    {
      id: "Q6",
      section: "B",
      type: "scale",
      question: "How do you rate your satisfaction with access to continuing education offered by the dental group?",
      required: true,
      showCondition: "Group dentists only (Q0 = A)",
      scaleLabels: { min: "Not at all satisfied", max: "Very satisfied" },
    },
    {
      id: "Q7",
      section: "B",
      type: "scale",
      question: "How do you rate your satisfaction with access to technologies and dental materials in your structure?",
      subtitle: "Leave blank if no opinion and click next",
      required: false,
      showCondition: "Group dentists only (Q0 = A)",
      scaleLabels: { min: "Not at all satisfied", max: "Very satisfied" },
    },
    {
      id: "Q8",
      section: "B",
      type: "scale",
      question: "To what extent does the dental group contribute to the quality of your care / clinical quality?",
      required: true,
      showCondition: "Group dentists only (Q0 = A)",
      scaleLabels: { min: "Not at all", max: "Enormously" },
    },
    {
      id: "Q9",
      section: "B",
      type: "scale",
      question: "To what extent do you benefit from having colleagues on-site to manage your clinical cases?",
      required: true,
      showCondition: "Group dentists only (Q0 = A)",
      scaleLabels: { min: "Not at all", max: "Enormously" },
    },
    {
      id: "Q10",
      section: "B",
      type: "scale",
      question: "If you have previously worked in independent practice, do you think patient satisfaction is higher in your current structure?",
      subtitle: "Leave blank if no opinion and click next",
      required: false,
      showCondition: "Group dentists with prior independent experience (Q0 = A AND Q2 includes A or B)",
      scaleLabels: { min: "Much less satisfied", max: "Much more satisfied" },
    },
    {
      id: "Q11",
      section: "B",
      type: "scale",
      question: "How do you rate your level of safety regarding occupational hazards (blood exposure accidents, splashes, materials, aggression, ...)?",
      required: true,
      showCondition: "Group dentists only (Q0 = A)",
      scaleLabels: { min: "Very exposed", max: "Very protected" },
    },
    {
      id: "Q12",
      section: "B",
      type: "scale",
      question: "Do you think working within a dental group allows for a better work-life balance?",
      subtitle: "Leave blank if no opinion and click next",
      required: false,
      showCondition: "Group dentists only (Q0 = A)",
      scaleLabels: { min: "Not at all", max: "Enormously" },
    },
    {
      id: "Q13",
      section: "B",
      type: "scale",
      question: "Are you satisfied working within a dental group?",
      required: true,
      showCondition: "Group dentists only (Q0 = A)",
      scaleLabels: { min: "Not at all satisfied", max: "Very satisfied" },
    },

    // SECTION B - Independent Dentists (Q4i-Q12i)
    {
      id: "Q4i",
      section: "B",
      type: "scale",
      question: "How do you rate the effectiveness of your administrative and operational management (billing, scheduling)?",
      required: true,
      showCondition: "Independent dentists only (Q0 = B or C)",
      scaleLabels: { min: "Very ineffective", max: "Very effective" },
    },
    {
      id: "Q5i",
      section: "B",
      type: "scale",
      question: "To what extent does your current mode of practice contribute to your professional development?",
      required: true,
      showCondition: "Independent dentists only (Q0 = B or C)",
      scaleLabels: { min: "Not at all", max: "Enormously" },
    },
    {
      id: "Q6i",
      section: "B",
      type: "scale",
      question: "How do you rate your satisfaction with access to continuing education?",
      required: true,
      showCondition: "Independent dentists only (Q0 = B or C)",
      scaleLabels: { min: "Not at all satisfied", max: "Very satisfied" },
    },
    {
      id: "Q7i",
      section: "B",
      type: "scale",
      question: "How do you rate your satisfaction with access to technologies and dental materials in your structure?",
      subtitle: "Leave blank if no opinion and click next",
      required: false,
      showCondition: "Independent dentists only (Q0 = B or C)",
      scaleLabels: { min: "Not at all satisfied", max: "Very satisfied" },
    },
    {
      id: "Q8i",
      section: "B",
      type: "scale",
      question: "To what extent does your mode of practice contribute to the quality of your care / clinical quality?",
      required: true,
      showCondition: "Independent dentists only (Q0 = B or C)",
      scaleLabels: { min: "Not at all", max: "Enormously" },
    },
    {
      id: "Q9i",
      section: "B",
      type: "scale",
      question: "To what extent do you have access to colleagues to discuss or manage your clinical cases?",
      required: true,
      showCondition: "Independent dentists only (Q0 = B or C)",
      scaleLabels: { min: "Not at all", max: "Enormously" },
    },
    {
      id: "Q10i",
      section: "B",
      type: "scale",
      question: "How do you rate your level of safety regarding occupational hazards (blood exposure accidents, splashes, materials, aggression, ...)?",
      required: true,
      showCondition: "Independent dentists only (Q0 = B or C)",
      scaleLabels: { min: "Very exposed", max: "Very protected" },
    },
    {
      id: "Q11i",
      section: "B",
      type: "scale",
      question: "Do you think your current mode of practice allows for a good work-life balance?",
      subtitle: "Leave blank if no opinion and click next",
      required: false,
      showCondition: "Independent dentists only (Q0 = B or C)",
      scaleLabels: { min: "Not at all", max: "Enormously" },
    },
    {
      id: "Q12i",
      section: "B",
      type: "scale",
      question: "Are you satisfied with your current mode of practice?",
      required: true,
      showCondition: "Independent dentists only (Q0 = B or C)",
      scaleLabels: { min: "Not at all satisfied", max: "Very satisfied" },
    },

    // SECTION B2 - Perception (Independent only)
    {
      id: "Q20",
      section: "B2",
      type: "single",
      question: "Do you plan to join a dental group in the next 5 years?",
      required: true,
      showCondition: "Independent dentists only (Q0 = B or C)",
      options: [
        { value: "A", label: "Yes, definitely" },
        { value: "B", label: "Yes, perhaps" },
        { value: "C", label: "No, probably not" },
        { value: "D", label: "No, definitely not" },
      ],
    },
    {
      id: "Q21",
      section: "B2",
      type: "multiple_exclusive",
      question: "What advantages do you perceive in dental groups?",
      subtitle: "Select all applicable answers",
      required: true,
      showCondition: "Independent dentists only (Q0 = B or C)",
      options: [
        { value: "A", label: "Administrative support" },
        { value: "B", label: "Access to advanced technologies" },
        { value: "C", label: "Collaboration with colleagues" },
        { value: "D", label: "Facilitated continuing education" },
        { value: "E", label: "Better work-life balance" },
        { value: "F", label: "Financial security" },
        { value: "G", label: "I do not perceive any advantages", exclusive: true },
      ],
    },
    {
      id: "Q22",
      section: "B2",
      type: "multiple_exclusive",
      question: "What are your main reluctances regarding dental groups?",
      subtitle: "Select all applicable answers",
      required: true,
      showCondition: "Independent dentists only (Q0 = B or C)",
      options: [
        { value: "A", label: "Loss of clinical autonomy" },
        { value: "B", label: "Pressure on productivity" },
        { value: "C", label: "Less advantageous compensation" },
        { value: "D", label: "Less personal relationship with patients" },
        { value: "E", label: "Standardization of practices" },
        { value: "F", label: "I have no reluctances", exclusive: true },
      ],
    },

    // SECTION C - Activity Segments
    {
      id: "Q14",
      section: "C",
      type: "multiple",
      question: "Today, in which segments do you observe the highest level of activity?",
      subtitle: "Select all applicable segments (in terms of revenue)",
      required: true,
      showCondition: "All respondents",
      options: "Activity Segments (see list above)",
    },
    {
      id: "Q14b",
      section: "C",
      type: "percentage_distribution",
      question: "How is your current activity distributed across these segments?",
      subtitle: "Distribute 100% of your revenue across segments (total must equal 100%)",
      required: true,
      showCondition: "All respondents",
      options: "Activity Segments (see list above)",
    },
    {
      id: "Q15",
      section: "C",
      type: "multiple",
      question: "In which segments do you anticipate an increase in activity over the next 5 years?",
      subtitle: "Select all applicable segments (in terms of revenue)",
      required: true,
      showCondition: "All respondents",
      options: "Activity Segments (see list above)",
    },
    {
      id: "Q15b",
      section: "C",
      type: "percentage_distribution",
      question: "How do you anticipate the distribution of your activity in 5 years?",
      subtitle: "Distribute 100% of your revenue across segments (total must equal 100%)",
      required: true,
      showCondition: "All respondents",
      options: "Activity Segments (see list above)",
    },

    // SECTION D - Contact
    {
      id: "Q16",
      section: "D",
      type: "single",
      question: "In which structure do you practice?",
      required: true,
      showCondition: "Group dentists only (Q0 = A)",
      options: [
        { value: "white_cabinets", label: "White Cabinets Dentaires" },
        { value: "zahnarztzentrum", label: "Zahnarztzentrum.ch" },
        { value: "cheeze", label: "Cheeze" },
        { value: "ardentis", label: "Ardentis" },
        { value: "chd", label: "CHD - Dental Hygiene Clinic" },
        { value: "adent", label: "Adent" },
        { value: "panadent", label: "Panadent" },
        { value: "dentalys", label: "Dentalys" },
        { value: "clinident", label: "Clinident Group" },
        { value: "pure_clinic", label: "Pure Clinic" },
        { value: "dentalgroup", label: "Dentalgroup.ch" },
        { value: "urbadental", label: "Urbadental" },
        { value: "prefer_not_say", label: "I prefer not to say" },
        { value: "other", label: "Other" },
      ],
    },
    {
      id: "Q17",
      section: "D",
      type: "single",
      question: "In case of questions, do you allow us to contact you if we wish to follow up on these answers?",
      required: true,
      showCondition: "All respondents",
      options: [
        { value: "oui", label: "Yes" },
        { value: "non", label: "No" },
      ],
    },
    {
      id: "Q18",
      section: "D",
      type: "text",
      question: "What is your email address?",
      placeholder: "example@email.com",
      required: true,
      showCondition: "Only if Q17 = Yes",
    },
  ],
};

// Create the document
async function createDocument() {
  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            font: "Calibri",
            size: 22,
          },
        },
      ],
    },
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: surveyStructure.title,
                bold: true,
                size: 48,
                color: "2E74B5",
              }),
            ],
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: surveyStructure.subtitle,
                italics: true,
                size: 28,
                color: "666666",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Table of Contents
          new Paragraph({
            children: [
              new TextRun({
                text: "Table of Contents",
                bold: true,
                size: 32,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "1. Question Types", size: 24 })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "2. Survey Sections Overview", size: 24 })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "3. Activity Segments Reference", size: 24 })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "4. Complete Question List", size: 24 })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "5. Survey Flow Logic", size: 24 })],
            spacing: { after: 400 },
          }),

          // Question Types Section
          new Paragraph({
            children: [
              new TextRun({
                text: "1. Question Types",
                bold: true,
                size: 32,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            pageBreakBefore: true,
          }),
          ...surveyStructure.questionTypes.map(
            (qt) =>
              new Paragraph({
                children: [
                  new TextRun({ text: `${qt.type}: `, bold: true, size: 24 }),
                  new TextRun({ text: qt.description, size: 24 }),
                ],
                spacing: { after: 100 },
                bullet: { level: 0 },
              })
          ),

          // Survey Sections Overview
          new Paragraph({
            children: [
              new TextRun({
                text: "2. Survey Sections Overview",
                bold: true,
                size: 32,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          ...surveyStructure.sections.flatMap((section) => [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Section ${section.id}: ${section.title}`,
                  bold: true,
                  size: 26,
                  color: "2E74B5",
                }),
              ],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: section.description,
                  italics: true,
                  size: 22,
                }),
              ],
              spacing: { after: 150 },
            }),
          ]),

          // Activity Segments Reference
          new Paragraph({
            children: [
              new TextRun({
                text: "3. Activity Segments Reference",
                bold: true,
                size: 32,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "These segments are used in the activity distribution questions (Q14, Q14b, Q15, Q15b):",
                size: 22,
              }),
            ],
            spacing: { after: 150 },
          }),
          ...surveyStructure.activitySegments.map(
            (seg) =>
              new Paragraph({
                children: [
                  new TextRun({ text: seg.label, size: 22 }),
                ],
                spacing: { after: 80 },
                bullet: { level: 0 },
              })
          ),

          // Complete Question List
          new Paragraph({
            children: [
              new TextRun({
                text: "4. Complete Question List",
                bold: true,
                size: 32,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            pageBreakBefore: true,
          }),

          // Group questions by section
          ...["0", "A", "B", "B2", "C", "D"].flatMap((sectionId) => {
            const sectionInfo = surveyStructure.sections.find((s) => s.id === sectionId);
            const sectionQuestions = surveyStructure.questions.filter(
              (q) => q.section === sectionId
            );

            if (sectionQuestions.length === 0) return [];

            return [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Section ${sectionId}: ${sectionInfo?.title || ""}`,
                    bold: true,
                    size: 28,
                    color: "2E74B5",
                  }),
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 200 },
              }),
              ...sectionQuestions.flatMap((q) => {
                const paragraphs = [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `${q.id}`,
                        bold: true,
                        size: 24,
                        color: "C00000",
                      }),
                      new TextRun({
                        text: ` [${q.type}]`,
                        size: 20,
                        color: "666666",
                      }),
                      new TextRun({
                        text: q.required ? " *" : "",
                        bold: true,
                        size: 24,
                        color: "C00000",
                      }),
                    ],
                    spacing: { before: 200, after: 50 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: q.question,
                        bold: true,
                        size: 22,
                      }),
                    ],
                    spacing: { after: 50 },
                  }),
                ];

                if (q.subtitle) {
                  paragraphs.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: q.subtitle,
                          italics: true,
                          size: 20,
                          color: "666666",
                        }),
                      ],
                      spacing: { after: 50 },
                    })
                  );
                }

                paragraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Show condition: `,
                        bold: true,
                        size: 20,
                      }),
                      new TextRun({
                        text: q.showCondition,
                        size: 20,
                        italics: true,
                      }),
                    ],
                    spacing: { after: 50 },
                  })
                );

                if (q.scaleLabels) {
                  paragraphs.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Scale: 0 (${q.scaleLabels.min}) to 10 (${q.scaleLabels.max})`,
                          size: 20,
                          color: "666666",
                        }),
                      ],
                      spacing: { after: 50 },
                    })
                  );
                }

                if (q.validation) {
                  paragraphs.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Validation: ${q.validation}`,
                          size: 20,
                          color: "666666",
                        }),
                      ],
                      spacing: { after: 50 },
                    })
                  );
                }

                if (q.unit) {
                  paragraphs.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Unit: ${q.unit}`,
                          size: 20,
                          color: "666666",
                        }),
                      ],
                      spacing: { after: 50 },
                    })
                  );
                }

                if (q.options && Array.isArray(q.options)) {
                  paragraphs.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Options:",
                          bold: true,
                          size: 20,
                        }),
                      ],
                      spacing: { after: 50 },
                    })
                  );

                  q.options.forEach((opt) => {
                    paragraphs.push(
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `${opt.value}. ${opt.label}`,
                            size: 20,
                          }),
                          opt.exclusive
                            ? new TextRun({
                                text: " (exclusive)",
                                italics: true,
                                size: 18,
                                color: "999999",
                              })
                            : new TextRun({ text: "" }),
                        ],
                        spacing: { after: 30 },
                        indent: { left: 360 },
                      })
                    );
                  });
                } else if (q.options === "Activity Segments (see list above)") {
                  paragraphs.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Options: Activity Segments (see Section 3)",
                          size: 20,
                          italics: true,
                        }),
                      ],
                      spacing: { after: 50 },
                    })
                  );
                }

                paragraphs.push(
                  new Paragraph({
                    children: [new TextRun({ text: "" })],
                    spacing: { after: 100 },
                  })
                );

                return paragraphs;
              }),
            ];
          }),

          // Survey Flow Logic
          new Paragraph({
            children: [
              new TextRun({
                text: "5. Survey Flow Logic",
                bold: true,
                size: 32,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            pageBreakBefore: true,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "The survey uses branching logic based on the respondent's practice type (Q0):",
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Branch A: Group Dentists (Q0 = A)",
                bold: true,
                size: 24,
                color: "2E74B5",
              }),
            ],
            spacing: { before: 150, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Q0 → Q1 → Q2 → Q3 → Q4-Q13 → Q14 → Q14b → Q15 → Q15b → Q16 → Q17 → (Q18 if yes)",
                size: 20,
              }),
            ],
            spacing: { after: 100 },
            indent: { left: 360 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Note: Q10 only appears if Q2 includes options A or B (prior independent experience)",
                italics: true,
                size: 20,
                color: "666666",
              }),
            ],
            spacing: { after: 200 },
            indent: { left: 360 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Branch B: Independent Dentists (Q0 = B or C)",
                bold: true,
                size: 24,
                color: "2E74B5",
              }),
            ],
            spacing: { before: 150, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Q0 → Q1 → Q2 → Q3 → Q4i-Q12i → Q20 → Q21 → Q22 → Q14 → Q14b → Q15 → Q15b → Q17 → (Q18 if yes)",
                size: 20,
              }),
            ],
            spacing: { after: 100 },
            indent: { left: 360 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Note: Independent dentists do NOT see Q16 (dental group selection)",
                italics: true,
                size: 20,
                color: "666666",
              }),
            ],
            spacing: { after: 400 },
            indent: { left: 360 },
          }),

          // Legend
          new Paragraph({
            children: [
              new TextRun({
                text: "Legend",
                bold: true,
                size: 24,
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "* Required question",
                size: 20,
              }),
            ],
            spacing: { after: 50 },
            bullet: { level: 0 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "(exclusive) - Selecting this option deselects all others",
                size: 20,
              }),
            ],
            spacing: { after: 50 },
            bullet: { level: 0 },
          }),
        ],
      },
    ],
  });

  // Generate and save the document
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync("Survey_Structure_English.docx", buffer);
  console.log("Document created: Survey_Structure_English.docx");
}

createDocument().catch(console.error);
