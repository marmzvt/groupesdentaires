const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} = require("docx");
const fs = require("fs");

// Survey structure in French
const surveyStructure = {
  title: "Enquête Groupes Dentaires - Structure du Questionnaire",
  subtitle: "Enquête auprès des praticiens dentaires suisses",

  questionTypes: [
    { type: "single", description: "Choix unique (boutons radio)" },
    { type: "multiple", description: "Choix multiple (cases à cocher)" },
    { type: "multiple_exclusive", description: "Choix multiple avec option exclusive" },
    { type: "numeric", description: "Saisie numérique" },
    { type: "text", description: "Saisie de texte libre" },
    { type: "scale", description: "Curseur d'échelle (0-10)" },
    { type: "percentage_distribution", description: "Répartition en pourcentage (total = 100%)" },
  ],

  sections: [
    {
      id: "0",
      title: "Type de structure",
      description: "Question de routage pour déterminer la branche du répondant",
    },
    {
      id: "A",
      title: "Profil",
      description: "Parcours professionnel et expérience",
    },
    {
      id: "B",
      title: "Évaluation de la structure",
      description: "Évaluation de la structure de pratique actuelle (questions différentes pour groupes vs indépendants)",
    },
    {
      id: "B2",
      title: "Perception des groupes dentaires",
      description: "Avis sur les groupes dentaires (dentistes indépendants uniquement)",
    },
    {
      id: "C",
      title: "Segments d'activité",
      description: "Répartition actuelle et anticipée de l'activité",
    },
    {
      id: "D",
      title: "Informations complémentaires",
      description: "Affiliation organisationnelle et coordonnées",
    },
  ],

  activitySegments: [
    { value: "preventifs", label: "Soins preventifs par l'HD" },
    { value: "conservateurs", label: "Soins de base conservateurs (restauration, endo, extractions, ...)" },
    { value: "protheses", label: "Protheses fixes et amovibles" },
    { value: "implants", label: "Implants et chirurgie orale" },
    { value: "parodontologie", label: "Parodontologie" },
    { value: "orthodontie", label: "Orthodontie interceptive et/ou par aligneurs" },
    { value: "esthetique", label: "Traitements a but esthetique" },
  ],

  questions: [
    // SECTION 0 - Question de routage
    {
      id: "Q0",
      section: "0",
      type: "single",
      question: "Dans quel type de structure exercez-vous actuellement ?",
      required: true,
      showCondition: "Tous les répondants",
      options: [
        { value: "A", label: "Groupe dentaire (centre ou reseau de cabinets)" },
        { value: "B", label: "Cabinet individuel independant" },
        { value: "C", label: "Cabinet de groupe avec praticiens independants (plusieurs praticiens)" },
      ],
    },

    // SECTION A - Profil
    {
      id: "Q1",
      section: "A",
      type: "numeric",
      question: "En quelle année avez-vous commencé à exercer en tant que médecin-dentiste ?",
      required: true,
      showCondition: "Tous les répondants",
      validation: "Plage : 1960-2025",
      placeholder: "Ex: 2010",
    },
    {
      id: "Q2",
      section: "A",
      type: "multiple_exclusive",
      question: "Quel(s) mode(s) d'exercice avez-vous pratiqué(s) au cours de votre carrière ?",
      subtitle: "Sélectionnez toutes les réponses applicables",
      required: true,
      showCondition: "Tous les répondants",
      options: [
        { value: "A", label: "Cabinet individuel indépendant - associé / fondateur" },
        { value: "B", label: "Cabinet de groupe indépendant (plusieurs praticiens) - associé / fondateur" },
        { value: "C", label: "Salarié(e) dans un cabinet privé" },
        { value: "D", label: "Salarié(e) dans un centre ou groupe dentaire" },
        { value: "E", label: "Autre mode d'exercice (p. ex. hôpital, université)" },
        { value: "F", label: "C'est ma première expérience professionnelle", exclusive: true },
      ],
    },
    {
      id: "Q3",
      section: "A",
      type: "numeric",
      question: "Depuis combien de temps êtes-vous affilié(e) à votre structure actuelle ?",
      required: true,
      showCondition: "Tous les répondants",
      validation: "Plage : 0-50 ans",
      unit: "années",
      placeholder: "Ex: 3",
    },

    // SECTION B - Dentistes en groupe (Q4-Q13)
    {
      id: "Q4",
      section: "B",
      type: "scale",
      question: "Comment évaluez-vous l'efficacité du soutien administratif et opérationnel (par exemple, facturation, planification) dans la réduction de votre charge de travail ?",
      required: true,
      showCondition: "Dentistes en groupe uniquement (Q0 = A)",
      scaleLabels: { min: "Très inefficace", max: "Très efficace" },
    },
    {
      id: "Q5",
      section: "B",
      type: "scale",
      question: "Dans quelle mesure pensez-vous que votre affiliation à un groupe dentaire contribue à votre développement professionnel ?",
      required: true,
      showCondition: "Dentistes en groupe uniquement (Q0 = A)",
      scaleLabels: { min: "Pas du tout", max: "Énormément" },
    },
    {
      id: "Q6",
      section: "B",
      type: "scale",
      question: "Comment évaluez-vous votre satisfaction concernant l'accès à la formation continue offert par le groupe dentaire ?",
      required: true,
      showCondition: "Dentistes en groupe uniquement (Q0 = A)",
      scaleLabels: { min: "Pas du tout satisfait", max: "Très satisfait" },
    },
    {
      id: "Q7",
      section: "B",
      type: "scale",
      question: "Comment évaluez-vous votre satisfaction concernant l'accès aux technologies et aux matériaux dentaires dans votre structure ?",
      subtitle: "Laisser vide si pas d'avis et cliquer sur suivant",
      required: false,
      showCondition: "Dentistes en groupe uniquement (Q0 = A)",
      scaleLabels: { min: "Pas du tout satisfait", max: "Très satisfait" },
    },
    {
      id: "Q8",
      section: "B",
      type: "scale",
      question: "Dans quelle mesure le groupe dentaire contribue-t-il à la qualité de vos soins / qualité clinique ?",
      required: true,
      showCondition: "Dentistes en groupe uniquement (Q0 = A)",
      scaleLabels: { min: "Pas du tout", max: "Énormément" },
    },
    {
      id: "Q9",
      section: "B",
      type: "scale",
      question: "Dans quelle mesure bénéficiez-vous de la présence de confrères sur place pour gérer vos cas cliniques ?",
      required: true,
      showCondition: "Dentistes en groupe uniquement (Q0 = A)",
      scaleLabels: { min: "Pas du tout", max: "Énormément" },
    },
    {
      id: "Q10",
      section: "B",
      type: "scale",
      question: "Si vous avez travaillé auparavant en pratique indépendante, estimez-vous que la satisfaction des patients est plus élevée dans votre structure actuelle ?",
      subtitle: "Laisser vide si pas d'avis et cliquer sur suivant",
      required: false,
      showCondition: "Dentistes en groupe avec expérience indépendante antérieure (Q0 = A ET Q2 inclut A ou B)",
      scaleLabels: { min: "Bien moins satisfaits", max: "Bien plus satisfaits" },
    },
    {
      id: "Q11",
      section: "B",
      type: "scale",
      question: "Comment évaluez-vous votre niveau de sécurité vis-à-vis des risques professionnels (accidents exposition au sang, projections, matériaux, agressions, ...) ?",
      required: true,
      showCondition: "Dentistes en groupe uniquement (Q0 = A)",
      scaleLabels: { min: "Très exposé", max: "Très protégé" },
    },
    {
      id: "Q12",
      section: "B",
      type: "scale",
      question: "Pensez-vous que le travail au sein d'un groupe dentaire permet un meilleur équilibre personnel-professionnel ?",
      subtitle: "Laisser vide si pas d'avis et cliquer sur suivant",
      required: false,
      showCondition: "Dentistes en groupe uniquement (Q0 = A)",
      scaleLabels: { min: "Pas du tout", max: "Énormément" },
    },
    {
      id: "Q13",
      section: "B",
      type: "scale",
      question: "Êtes-vous satisfait de travailler au sein d'un groupe dentaire ?",
      required: true,
      showCondition: "Dentistes en groupe uniquement (Q0 = A)",
      scaleLabels: { min: "Pas du tout satisfait", max: "Très satisfait" },
    },

    // SECTION B - Dentistes indépendants (Q4i-Q12i)
    {
      id: "Q4i",
      section: "B",
      type: "scale",
      question: "Comment évaluez-vous l'efficacité de votre gestion administrative et opérationnelle (facturation, planification) ?",
      required: true,
      showCondition: "Dentistes indépendants uniquement (Q0 = B ou C)",
      scaleLabels: { min: "Très inefficace", max: "Très efficace" },
    },
    {
      id: "Q5i",
      section: "B",
      type: "scale",
      question: "Dans quelle mesure votre mode d'exercice actuel contribue-t-il à votre développement professionnel ?",
      required: true,
      showCondition: "Dentistes indépendants uniquement (Q0 = B ou C)",
      scaleLabels: { min: "Pas du tout", max: "Énormément" },
    },
    {
      id: "Q6i",
      section: "B",
      type: "scale",
      question: "Comment évaluez-vous votre satisfaction concernant l'accès à la formation continue ?",
      required: true,
      showCondition: "Dentistes indépendants uniquement (Q0 = B ou C)",
      scaleLabels: { min: "Pas du tout satisfait", max: "Très satisfait" },
    },
    {
      id: "Q7i",
      section: "B",
      type: "scale",
      question: "Comment évaluez-vous votre satisfaction concernant l'accès aux technologies et aux matériaux dentaires dans votre structure ?",
      subtitle: "Laisser vide si pas d'avis et cliquer sur suivant",
      required: false,
      showCondition: "Dentistes indépendants uniquement (Q0 = B ou C)",
      scaleLabels: { min: "Pas du tout satisfait", max: "Très satisfait" },
    },
    {
      id: "Q8i",
      section: "B",
      type: "scale",
      question: "Dans quelle mesure votre mode d'exercice contribue-t-il à la qualité de vos soins / qualité clinique ?",
      required: true,
      showCondition: "Dentistes indépendants uniquement (Q0 = B ou C)",
      scaleLabels: { min: "Pas du tout", max: "Énormément" },
    },
    {
      id: "Q9i",
      section: "B",
      type: "scale",
      question: "Dans quelle mesure avez-vous accès à des confrères pour discuter ou gérer vos cas cliniques ?",
      required: true,
      showCondition: "Dentistes indépendants uniquement (Q0 = B ou C)",
      scaleLabels: { min: "Pas du tout", max: "Énormément" },
    },
    {
      id: "Q10i",
      section: "B",
      type: "scale",
      question: "Comment évaluez-vous votre niveau de sécurité vis-à-vis des risques professionnels (accidents exposition au sang, projections, matériaux, agressions, ...) ?",
      required: true,
      showCondition: "Dentistes indépendants uniquement (Q0 = B ou C)",
      scaleLabels: { min: "Très exposé", max: "Très protégé" },
    },
    {
      id: "Q11i",
      section: "B",
      type: "scale",
      question: "Pensez-vous que votre mode d'exercice actuel permet un bon équilibre personnel-professionnel ?",
      subtitle: "Laisser vide si pas d'avis et cliquer sur suivant",
      required: false,
      showCondition: "Dentistes indépendants uniquement (Q0 = B ou C)",
      scaleLabels: { min: "Pas du tout", max: "Énormément" },
    },
    {
      id: "Q12i",
      section: "B",
      type: "scale",
      question: "Êtes-vous satisfait de votre mode d'exercice actuel ?",
      required: true,
      showCondition: "Dentistes indépendants uniquement (Q0 = B ou C)",
      scaleLabels: { min: "Pas du tout satisfait", max: "Très satisfait" },
    },

    // SECTION B2 - Perception (Indépendants uniquement)
    {
      id: "Q20",
      section: "B2",
      type: "single",
      question: "Envisagez-vous de rejoindre un groupe dentaire dans les 5 prochaines années ?",
      required: true,
      showCondition: "Dentistes indépendants uniquement (Q0 = B ou C)",
      options: [
        { value: "A", label: "Oui, certainement" },
        { value: "B", label: "Oui, peut-être" },
        { value: "C", label: "Non, probablement pas" },
        { value: "D", label: "Non, certainement pas" },
      ],
    },
    {
      id: "Q21",
      section: "B2",
      type: "multiple_exclusive",
      question: "Quels avantages percevez-vous dans les groupes dentaires ?",
      subtitle: "Selectionnez toutes les reponses applicables",
      required: true,
      showCondition: "Dentistes independants uniquement (Q0 = B ou C)",
      options: [
        { value: "A", label: "Soutien administratif" },
        { value: "B", label: "Acces a des technologies avancees" },
        { value: "C", label: "Collaboration avec des confreres" },
        { value: "D", label: "Formation continue facilitee" },
        { value: "E", label: "Meilleur equilibre vie pro/perso" },
        { value: "F", label: "Securite financiere" },
        { value: "G", label: "Je ne percois pas d'avantages", exclusive: true },
        { value: "H", label: "Meilleure planification de la retraite" },
        { value: "I", label: "Transmission de la patientele (succession) facilitee" },
        { value: "J", label: "Meilleure securite en cas de maladie" },
      ],
    },
    {
      id: "Q22",
      section: "B2",
      type: "multiple_exclusive",
      question: "Quelles sont vos principales reticences vis-a-vis des groupes dentaires ?",
      subtitle: "Selectionnez toutes les reponses applicables",
      required: true,
      showCondition: "Dentistes independants uniquement (Q0 = B ou C)",
      options: [
        { value: "A", label: "Perte d'autonomie clinique" },
        { value: "B", label: "Pression sur la productivite" },
        { value: "C", label: "Remuneration moins avantageuse" },
        { value: "D", label: "Moins de relation personnelle avec les patients" },
        { value: "E", label: "Standardisation des pratiques" },
        { value: "F", label: "Je n'ai pas de reticences", exclusive: true },
        { value: "J", label: "Le regard et evaluation de mon travail" },
      ],
    },

    // SECTION C - Segments d'activité
    {
      id: "Q14",
      section: "C",
      type: "multiple",
      question: "Aujourd'hui, dans quels segments observez-vous le plus haut niveau d'activité ?",
      subtitle: "Sélectionnez tous les segments concernés (en termes de chiffre d'affaires)",
      required: true,
      showCondition: "Tous les répondants",
      options: "Segments d'activité (voir liste ci-dessus)",
    },
    {
      id: "Q14b",
      section: "C",
      type: "percentage_distribution",
      question: "Comment se répartit votre activité actuelle entre ces segments ?",
      subtitle: "Répartissez 100% de votre chiffre d'affaires entre les segments (le total doit être égal à 100%)",
      required: true,
      showCondition: "Tous les répondants",
      options: "Segments d'activité (voir liste ci-dessus)",
    },
    {
      id: "Q15",
      section: "C",
      type: "multiple",
      question: "Dans quels segments anticipez-vous une augmentation de l'activité au cours des 5 prochaines années ?",
      subtitle: "Sélectionnez tous les segments concernés (en termes de chiffre d'affaires)",
      required: true,
      showCondition: "Tous les répondants",
      options: "Segments d'activité (voir liste ci-dessus)",
    },
    {
      id: "Q15b",
      section: "C",
      type: "percentage_distribution",
      question: "Comment anticipez-vous la répartition de votre activité dans 5 ans ?",
      subtitle: "Répartissez 100% de votre chiffre d'affaires entre les segments (le total doit être égal à 100%)",
      required: true,
      showCondition: "Tous les répondants",
      options: "Segments d'activité (voir liste ci-dessus)",
    },

    // SECTION D - Contact
    {
      id: "Q16",
      section: "D",
      type: "single",
      question: "Dans quelle structure exercez-vous ?",
      required: true,
      showCondition: "Dentistes en groupe uniquement (Q0 = A)",
      options: [
        { value: "white_cabinets", label: "White Cabinets Dentaires" },
        { value: "zahnarztzentrum", label: "Zahnarztzentrum.ch" },
        { value: "cheeze", label: "Cheeze" },
        { value: "ardentis", label: "Ardentis" },
        { value: "chd", label: "CHD – Clinique d'Hygiène Dentaire" },
        { value: "adent", label: "Adent" },
        { value: "panadent", label: "Panadent" },
        { value: "dentalys", label: "Dentalys" },
        { value: "clinident", label: "Groupe Clinident" },
        { value: "pure_clinic", label: "Pure Clinic" },
        { value: "dentalgroup", label: "Dentalgroup.ch" },
        { value: "urbadental", label: "Urbadental" },
        { value: "prefer_not_say", label: "Je ne préfère pas dire" },
        { value: "other", label: "Autre" },
      ],
    },
    {
      id: "Q17",
      section: "D",
      type: "single",
      question: "En cas de questions, nous permettez-vous de vous contacter si nous souhaitons approfondir avec vous ces réponses ?",
      required: true,
      showCondition: "Tous les répondants",
      options: [
        { value: "oui", label: "Oui" },
        { value: "non", label: "Non" },
      ],
    },
    {
      id: "Q18",
      section: "D",
      type: "text",
      question: "Quelle est votre adresse email ?",
      placeholder: "exemple@email.com",
      required: true,
      showCondition: "Uniquement si Q17 = Oui",
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
                text: "Table des matières",
                bold: true,
                size: 32,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "1. Types de questions", size: 24 })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "2. Aperçu des sections", size: 24 })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "3. Référence des segments d'activité", size: 24 })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "4. Liste complète des questions", size: 24 })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "5. Logique de flux du questionnaire", size: 24 })],
            spacing: { after: 400 },
          }),

          // Question Types Section
          new Paragraph({
            children: [
              new TextRun({
                text: "1. Types de questions",
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
                text: "2. Aperçu des sections",
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
                text: "3. Référence des segments d'activité",
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
                text: "Ces segments sont utilisés dans les questions de répartition d'activité (Q14, Q14b, Q15, Q15b) :",
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
                text: "4. Liste complète des questions",
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
                        text: `Condition d'affichage : `,
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
                          text: `Échelle : 0 (${q.scaleLabels.min}) à 10 (${q.scaleLabels.max})`,
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
                          text: `Validation : ${q.validation}`,
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
                          text: `Unité : ${q.unit}`,
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
                          text: "Options :",
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
                                text: " (exclusif)",
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
                } else if (q.options === "Segments d'activité (voir liste ci-dessus)") {
                  paragraphs.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Options : Segments d'activité (voir Section 3)",
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
                text: "5. Logique de flux du questionnaire",
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
                text: "Le questionnaire utilise une logique de branchement basée sur le type de pratique du répondant (Q0) :",
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Branche A : Dentistes en groupe (Q0 = A)",
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
                text: "Q0 → Q1 → Q2 → Q3 → Q4-Q13 → Q14 → Q14b → Q15 → Q15b → Q16 → Q17 → (Q18 si oui)",
                size: 20,
              }),
            ],
            spacing: { after: 100 },
            indent: { left: 360 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Note : Q10 n'apparaît que si Q2 inclut les options A ou B (expérience indépendante antérieure)",
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
                text: "Branche B : Dentistes indépendants (Q0 = B ou C)",
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
                text: "Q0 → Q1 → Q2 → Q3 → Q4i-Q12i → Q20 → Q21 → Q22 → Q14 → Q14b → Q15 → Q15b → Q17 → (Q18 si oui)",
                size: 20,
              }),
            ],
            spacing: { after: 100 },
            indent: { left: 360 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Note : Les dentistes indépendants ne voient PAS Q16 (sélection du groupe dentaire)",
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
                text: "Légende",
                bold: true,
                size: 24,
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "* Question obligatoire",
                size: 20,
              }),
            ],
            spacing: { after: 50 },
            bullet: { level: 0 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "(exclusif) - Sélectionner cette option désélectionne toutes les autres",
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
  fs.writeFileSync("Structure_Questionnaire_FR.docx", buffer);
  console.log("Document créé : Structure_Questionnaire_FR.docx");
}

createDocument().catch(console.error);
