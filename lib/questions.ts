export type QuestionType =
  | 'single'
  | 'multiple'
  | 'multiple_exclusive'
  | 'numeric'
  | 'text'
  | 'scale'
  | 'percentage_distribution';

export interface Option {
  value: string | number;
  label: string;
  exclusive?: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  section: string;
  question: string;
  subtitle?: string;
  options?: Option[];
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  unit?: string;
  scaleLabels?: { min: string; max: string };
}

// Activity segments for percentage distribution questions (v2: 7 segments)
export const activitySegments: Option[] = [
  { value: 'preventifs', label: 'Soins de diagnostic, de prévention ou urgence' },
  { value: 'conservateurs', label: 'Soins conservateurs (restauration, endo, extractions, ...)' },
  { value: 'protheses', label: 'Prothèses fixes et amovibles' },
  { value: 'implants', label: 'Implants et chirurgie orale' },
  { value: 'parodontologie', label: 'Parodontologie' },
  { value: 'orthodontie', label: 'Orthodontie interceptive et/ou par aligneurs' },
  { value: 'esthetique', label: 'Soins électifs visant à améliorer l\'image de soin (blanchiments dentaires, alignements dentaires, facettes, bijoux, ...)' },
];

// Segment groupings for collapsible UI
export const segmentGroups = [
  { id: 'preventifs', label: 'Soins de diagnostic, de prévention ou urgence', segments: ['preventifs'] },
  { id: 'conservateurs', label: 'Soins conservateurs', segments: ['conservateurs'] },
  { id: 'protheses', label: 'Prothèses fixes et amovibles', segments: ['protheses'] },
  { id: 'implants_paro', label: 'Implants, chirurgie orale et parodontologie', segments: ['implants', 'parodontologie'], collapsible: true },
  { id: 'ortho_esth', label: 'Orthodontie et esthétique', segments: ['orthodontie', 'esthetique'], collapsible: true },
];

// Options for Q21 - Perceived advantages of dental groups (v2: 10 options)
const perceivedAdvantages: Option[] = [
  { value: 'A', label: 'Soutien administratif' },
  { value: 'B', label: 'Accès à des technologies avancées' },
  { value: 'C', label: 'Collaboration avec des confrères' },
  { value: 'D', label: 'Formation continue facilitée' },
  { value: 'E', label: 'Meilleur équilibre vie pro/perso' },
  { value: 'F', label: 'Sécurité financière' },
  { value: 'G', label: 'Je ne perçois pas d\'avantages', exclusive: true },
  { value: 'H', label: 'Meilleure planification de la retraite' },
  { value: 'I', label: 'Transmission de la patientèle (succession) facilitée' },
  { value: 'J', label: 'Meilleure sécurité en cas de maladie' },
];

// Options for Q22 - Reluctances about dental groups (v2: 7 options)
const perceivedReluctances: Option[] = [
  { value: 'A', label: 'Perte d\'autonomie clinique' },
  { value: 'B', label: 'Pression sur la productivité' },
  { value: 'C', label: 'Rémunération moins avantageuse' },
  { value: 'D', label: 'Moins de relation personnelle avec les patients' },
  { value: 'E', label: 'Standardisation des pratiques' },
  { value: 'F', label: 'Je n\'ai pas de réticences', exclusive: true },
  { value: 'J', label: 'Le regard et évaluation de mon travail' },
];

export const questions: Question[] = [
  // SECTION 0 - Routing Question
  {
    id: 'Q0',
    type: 'single',
    section: '0',
    question: 'Dans quel type de structure exercez-vous actuellement ?',
    required: true,
    options: [
      { value: 'A', label: 'Groupe dentaire (centre ou réseau de cabinets)' },
      { value: 'B', label: 'Cabinet individuel indépendant' },
      { value: 'C', label: 'Cabinet de groupe avec praticiens indépendants (plusieurs praticiens)' },
    ],
  },

  // SECTION A - Profile (Both Branches)
  {
    id: 'Q1',
    type: 'numeric',
    section: 'A',
    question: 'En quelle année avez-vous commencé à exercer en tant que médecin-dentiste ?',
    required: true,
    min: 1960,
    max: 2025,
    placeholder: 'Ex: 2010',
  },
  {
    id: 'Q2',
    type: 'multiple_exclusive',
    section: 'A',
    question: 'Quel(s) mode(s) d\'exercice avez-vous pratiqué(s) au cours de votre carrière ?',
    subtitle: 'Sélectionnez toutes les réponses applicables',
    required: true,
    options: [
      { value: 'A', label: 'Cabinet individuel indépendant - associé / fondateur' },
      { value: 'B', label: 'Cabinet de groupe indépendant (plusieurs praticiens) - associé / fondateur' },
      { value: 'C', label: 'Salarié(e) dans un cabinet privé' },
      { value: 'D', label: 'Salarié(e) dans un centre ou groupe dentaire' },
      { value: 'E', label: 'Autre mode d\'exercice (p. ex. hôpital, université)' },
      { value: 'F', label: 'C\'est ma première expérience professionnelle', exclusive: true },
    ],
  },
  {
    id: 'Q3',
    type: 'numeric',
    section: 'A',
    question: 'Depuis combien de temps êtes-vous affilié(e) à votre structure actuelle ?',
    required: true,
    min: 0,
    max: 50,
    unit: 'années',
    placeholder: 'Ex: 3',
  },

  // SECTION B - Scale Questions for Branch A (Group Dentists) Q4-Q13
  {
    id: 'Q4',
    type: 'scale',
    section: 'B',
    question: 'Comment évaluez-vous l\'efficacité du soutien administratif et opérationnel (par exemple, facturation, planification) dans la réduction de votre charge de travail ?',
    min: 0,
    max: 10,
    required: true,
    scaleLabels: { min: 'Très inefficace', max: 'Très efficace' },
  },
  {
    id: 'Q5',
    type: 'scale',
    section: 'B',
    question: 'Dans quelle mesure pensez-vous que votre affiliation à un groupe dentaire contribue à votre développement professionnel ?',
    min: 0,
    max: 10,
    required: true,
    scaleLabels: { min: 'Pas du tout', max: 'Énormément' },
  },
  {
    id: 'Q6',
    type: 'scale',
    section: 'B',
    question: 'Comment évaluez-vous votre satisfaction concernant l\'accès à la formation continue offert par le groupe dentaire ?',
    min: 0,
    max: 10,
    required: true,
    scaleLabels: { min: 'Pas du tout satisfait', max: 'Très satisfait' },
  },
  {
    id: 'Q7',
    type: 'scale',
    section: 'B',
    question: 'Comment évaluez-vous votre satisfaction concernant l\'accès aux technologies et aux matériaux dentaires dans votre structure ?',
    subtitle: 'Laisser vide si pas d\'avis et cliquer sur suivant',
    min: 0,
    max: 10,
    required: false,
    scaleLabels: { min: 'Pas du tout satisfait', max: 'Très satisfait' },
  },
  {
    id: 'Q8',
    type: 'scale',
    section: 'B',
    question: 'Dans quelle mesure le groupe dentaire contribue-t-il à la qualité de vos soins / qualité clinique ?',
    min: 0,
    max: 10,
    required: true,
    scaleLabels: { min: 'Pas du tout', max: 'Énormément' },
  },
  {
    id: 'Q9',
    type: 'scale',
    section: 'B',
    question: 'Dans quelle mesure bénéficiez-vous de la présence de confrères sur place pour gérer vos cas cliniques ?',
    min: 0,
    max: 10,
    required: true,
    scaleLabels: { min: 'Pas du tout', max: 'Énormément' },
  },
  {
    id: 'Q10',
    type: 'scale',
    section: 'B',
    question: 'Si vous avez travaillé auparavant en pratique indépendante, estimez-vous que la satisfaction des patients est plus élevée dans votre structure actuelle ?',
    subtitle: 'Laisser vide si pas d\'avis et cliquer sur suivant',
    min: 0,
    max: 10,
    required: false,
    scaleLabels: { min: 'Bien moins satisfaits', max: 'Bien plus satisfaits' },
  },
  {
    id: 'Q11',
    type: 'scale',
    section: 'B',
    question: 'Comment évaluez-vous votre niveau de sécurité vis-à-vis des risques professionnels (accidents exposition au sang, projections, matériaux, agressions, ...) ?',
    min: 0,
    max: 10,
    required: true,
    scaleLabels: { min: 'Très exposé', max: 'Très protégé' },
  },
  {
    id: 'Q12',
    type: 'scale',
    section: 'B',
    question: 'Pensez-vous que le travail au sein d\'un groupe dentaire permet un meilleur équilibre personnel-professionnel ?',
    subtitle: 'Laisser vide si pas d\'avis et cliquer sur suivant',
    min: 0,
    max: 10,
    required: false,
    scaleLabels: { min: 'Pas du tout', max: 'Énormément' },
  },
  {
    id: 'Q13',
    type: 'scale',
    section: 'B',
    question: 'Êtes-vous satisfait de travailler au sein d\'un groupe dentaire ?',
    min: 0,
    max: 10,
    required: true,
    scaleLabels: { min: 'Pas du tout satisfait', max: 'Très satisfait' },
  },

  // SECTION B - Scale Questions for Branch B (Independent Dentists) Q4i-Q12i
  {
    id: 'Q4i',
    type: 'scale',
    section: 'B',
    question: 'Comment évaluez-vous l\'efficacité de votre gestion administrative et opérationnelle (facturation, planification) ?',
    min: 0,
    max: 10,
    required: true,
    scaleLabels: { min: 'Très inefficace', max: 'Très efficace' },
  },
  {
    id: 'Q5i',
    type: 'scale',
    section: 'B',
    question: 'Dans quelle mesure votre mode d\'exercice actuel contribue-t-il à votre développement professionnel ?',
    min: 0,
    max: 10,
    required: true,
    scaleLabels: { min: 'Pas du tout', max: 'Énormément' },
  },
  {
    id: 'Q6i',
    type: 'scale',
    section: 'B',
    question: 'Comment évaluez-vous votre satisfaction concernant l\'accès à la formation continue ?',
    min: 0,
    max: 10,
    required: true,
    scaleLabels: { min: 'Pas du tout satisfait', max: 'Très satisfait' },
  },
  {
    id: 'Q7i',
    type: 'scale',
    section: 'B',
    question: 'Comment évaluez-vous votre satisfaction concernant l\'accès aux technologies et aux matériaux dentaires dans votre structure ?',
    subtitle: 'Laisser vide si pas d\'avis et cliquer sur suivant',
    min: 0,
    max: 10,
    required: false,
    scaleLabels: { min: 'Pas du tout satisfait', max: 'Très satisfait' },
  },
  {
    id: 'Q8i',
    type: 'scale',
    section: 'B',
    question: 'Dans quelle mesure votre mode d\'exercice contribue-t-il à la qualité de vos soins / qualité clinique ?',
    min: 0,
    max: 10,
    required: true,
    scaleLabels: { min: 'Pas du tout', max: 'Énormément' },
  },
  {
    id: 'Q9i',
    type: 'scale',
    section: 'B',
    question: 'Dans quelle mesure avez-vous accès à des confrères pour discuter ou gérer vos cas cliniques ?',
    min: 0,
    max: 10,
    required: true,
    scaleLabels: { min: 'Pas du tout', max: 'Énormément' },
  },
  {
    id: 'Q10i',
    type: 'scale',
    section: 'B',
    question: 'Comment évaluez-vous votre niveau de sécurité vis-à-vis des risques professionnels (accidents exposition au sang, projections, matériaux, agressions, ...) ?',
    min: 0,
    max: 10,
    required: true,
    scaleLabels: { min: 'Très exposé', max: 'Très protégé' },
  },
  {
    id: 'Q11i',
    type: 'scale',
    section: 'B',
    question: 'Pensez-vous que votre mode d\'exercice actuel permet un bon équilibre personnel-professionnel ?',
    subtitle: 'Laisser vide si pas d\'avis et cliquer sur suivant',
    min: 0,
    max: 10,
    required: false,
    scaleLabels: { min: 'Pas du tout', max: 'Énormément' },
  },
  {
    id: 'Q12i',
    type: 'scale',
    section: 'B',
    question: 'Êtes-vous satisfait de votre mode d\'exercice actuel ?',
    min: 0,
    max: 10,
    required: true,
    scaleLabels: { min: 'Pas du tout satisfait', max: 'Très satisfait' },
  },

  // SECTION B2 - Perception of Dental Groups (Branch B only) Q20-Q22
  {
    id: 'Q20',
    type: 'single',
    section: 'B2',
    question: 'Envisagez-vous de rejoindre un groupe dentaire dans les 5 prochaines années ?',
    required: true,
    options: [
      { value: 'A', label: 'Oui, certainement' },
      { value: 'B', label: 'Oui, peut-être' },
      { value: 'C', label: 'Non, probablement pas' },
      { value: 'D', label: 'Non, certainement pas' },
    ],
  },
  {
    id: 'Q21',
    type: 'multiple_exclusive',
    section: 'B2',
    question: 'Quels avantages percevez-vous dans les groupes dentaires ?',
    subtitle: 'Sélectionnez toutes les réponses applicables',
    required: true,
    options: perceivedAdvantages,
  },
  {
    id: 'Q22',
    type: 'multiple_exclusive',
    section: 'B2',
    question: 'Quelles sont vos principales réticences vis-à-vis des groupes dentaires ?',
    subtitle: 'Sélectionnez toutes les réponses applicables',
    required: true,
    options: perceivedReluctances,
  },

  // SECTION C - Activity Segments (Both Branches)
  {
    id: 'Q14',
    type: 'multiple',
    section: 'C',
    question: 'Aujourd\'hui, dans quels segments observez-vous le plus haut niveau d\'activité ?',
    subtitle: 'Sélectionnez tous les segments concernés (en termes de chiffre d\'affaires)',
    required: true,
    options: activitySegments,
  },
  {
    id: 'Q14b',
    type: 'percentage_distribution',
    section: 'C',
    question: 'Comment se répartit votre activité actuelle entre ces segments ?',
    subtitle: 'Répartissez 100% de votre chiffre d\'affaires entre les segments (le total doit être égal à 100%)',
    required: true,
    options: activitySegments,
  },
  {
    id: 'Q15',
    type: 'multiple',
    section: 'C',
    question: 'Dans quels segments anticipez-vous une augmentation de l\'activité au cours des 5 prochaines années ?',
    subtitle: 'Sélectionnez tous les segments concernés (en termes de chiffre d\'affaires)',
    required: true,
    options: activitySegments,
  },
  {
    id: 'Q15b',
    type: 'percentage_distribution',
    section: 'C',
    question: 'Comment anticipez-vous la répartition de votre activité dans 5 ans ?',
    subtitle: 'Répartissez 100% de votre chiffre d\'affaires entre les segments (le total doit être égal à 100%)',
    required: true,
    options: activitySegments,
  },

  // SECTION D - Contact (Both Branches)
  {
    id: 'Q16',
    type: 'single',
    section: 'D',
    question: 'Dans quelle structure exercez-vous ?',
    required: true,
    options: [
      { value: 'white_cabinets', label: 'White Cabinets Dentaires' },
      { value: 'zahnarztzentrum', label: 'Zahnarztzentrum.ch' },
      { value: 'cheeze', label: 'Cheeze' },
      { value: 'ardentis', label: 'Ardentis' },
      { value: 'chd', label: 'CHD – Clinique d\'Hygiène Dentaire' },
      { value: 'adent', label: 'Adent' },
      { value: 'panadent', label: 'Panadent' },
      { value: 'dentalys', label: 'Dentalys' },
      { value: 'clinident', label: 'Groupe Clinident' },
      { value: 'pure_clinic', label: 'Pure Clinic' },
      { value: 'dentalgroup', label: 'Dentalgroup.ch' },
      { value: 'urbadental', label: 'Urbadental' },
      { value: 'prefer_not_say', label: 'Je ne préfère pas dire' },
      { value: 'other', label: 'Autre' },
    ],
  },
  {
    id: 'Q17',
    type: 'single',
    section: 'D',
    question: 'En cas de questions, nous permettez-vous de vous contacter si nous souhaitons approfondir avec vous ces réponses ?',
    required: true,
    options: [
      { value: 'oui', label: 'Oui' },
      { value: 'non', label: 'Non' },
    ],
  },
  {
    id: 'Q18',
    type: 'text',
    section: 'D',
    question: 'Quelle est votre adresse email ?',
    placeholder: 'exemple@email.com',
    required: true,
  },
];

export const sectionTitles: Record<string, string> = {
  '0': 'Type de structure',
  'A': 'Profil',
  'B': 'Évaluation de la structure',
  'B2': 'Perception des groupes dentaires',
  'C': 'Segments d\'activité',
  'D': 'Informations complémentaires',
};

// Get the question flow (all questions in sequence)
export function getQuestionFlow(answers: Record<string, any>): Question[] {
  return questions;
}

// Determine if a question should be shown based on conditional logic
export function shouldShowQuestion(question: Question, answers: Record<string, any>): boolean {
  const practiceType = answers['Q0'] as string | undefined;

  // Group/practice questions (Q4-Q13): Show if Q0 = 'A' (dental group) OR Q0 = 'C' (group practice)
  const groupPracticeQuestions = ['Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10', 'Q11', 'Q12', 'Q13'];
  if (groupPracticeQuestions.includes(question.id)) {
    if (practiceType !== 'A' && practiceType !== 'C') return false;
  }

  // Q16 (structure selection): Only show if Q0 = 'A' (dental groups only)
  if (question.id === 'Q16') {
    if (practiceType !== 'A') return false;
  }

  // Independent dentist questions (Q4i-Q12i): Only show if Q0 = 'B' (individual independent only)
  const independentQuestions = ['Q4i', 'Q5i', 'Q6i', 'Q7i', 'Q8i', 'Q9i', 'Q10i', 'Q11i', 'Q12i'];
  if (independentQuestions.includes(question.id)) {
    if (practiceType !== 'B') return false;
  }

  // Perception questions (Q20-Q22): Show if Q0 = 'B' or 'C' (independents only)
  const perceptionQuestions = ['Q20', 'Q21', 'Q22'];
  if (perceptionQuestions.includes(question.id)) {
    if (practiceType !== 'B' && practiceType !== 'C') return false;
  }

  // Q10 additional conditional logic: Only show if Q2 includes 'A' or 'B' (independent experience)
  if (question.id === 'Q10') {
    const q2Answer = answers['Q2'] as string[] | undefined;
    const hasIndependentExperience = q2Answer?.includes('A') || q2Answer?.includes('B');
    return hasIndependentExperience ?? false;
  }

  // Q18 (email) conditional logic: Only show if Q17 = 'oui'
  if (question.id === 'Q18') {
    const q17Answer = answers['Q17'] as string | undefined;
    return q17Answer === 'oui';
  }

  return true;
}

// Get dynamic question text based on practice type (for Q5-Q9)
export function getQuestionText(question: Question, practiceType: string | undefined): string {
  // For Q0=C (cabinet de groupe), adapt wording to use "cabinet de groupe" instead of "groupe dentaire"
  if (practiceType === 'C') {
    const wordingMap: Record<string, string> = {
      'Q5': 'Dans quelle mesure pensez-vous que votre appartenance à un cabinet de groupe contribue à votre développement professionnel ?',
      'Q6': 'Comment évaluez-vous votre satisfaction concernant l\'accès à la formation continue au sein de votre cabinet de groupe ?',
      'Q8': 'Dans quelle mesure le cabinet de groupe contribue-t-il à la qualité de vos soins / qualité clinique ?',
      'Q12': 'Pensez-vous que le travail au sein d\'un cabinet de groupe permet un meilleur équilibre personnel-professionnel ?',
      'Q13': 'Êtes-vous satisfait de travailler au sein d\'un cabinet de groupe ?',
    };

    if (wordingMap[question.id]) {
      return wordingMap[question.id];
    }
  }

  return question.question;
}

// Old segment keys for v1 data
export const oldSegmentKeys = ['preventifs', 'hygiene', 'protheses', 'implants', 'orthodontie'];

// New segment keys for v2 data
export const newSegmentKeys = ['preventifs', 'conservateurs', 'protheses', 'implants', 'parodontologie', 'orthodontie', 'esthetique'];

// Convert v1 segment data to v2 format (for exports)
export function convertOldSegmentData(oldData: Record<string, number>): Record<string, number> {
  return {
    preventifs: oldData.preventifs || 0,
    conservateurs: oldData.hygiene || 0,  // key rename: hygiene -> conservateurs
    protheses: oldData.protheses || 0,
    implants: (oldData.implants || 0) / 2,  // 50% split
    parodontologie: (oldData.implants || 0) / 2,  // 50% split (new category)
    orthodontie: (oldData.orthodontie || 0) / 2,  // 50% split
    esthetique: (oldData.orthodontie || 0) / 2,  // 50% split (new category)
  };
}

// Convert v1 segment selection array to v2 format (for multiple choice questions)
export function convertOldSegmentSelection(oldSelection: string[]): string[] {
  const newSelection: string[] = [];

  oldSelection.forEach(seg => {
    if (seg === 'preventifs') newSelection.push('preventifs');
    else if (seg === 'hygiene') newSelection.push('conservateurs');
    else if (seg === 'protheses') newSelection.push('protheses');
    else if (seg === 'implants') {
      newSelection.push('implants');
      newSelection.push('parodontologie');
    }
    else if (seg === 'orthodontie') {
      newSelection.push('orthodontie');
      newSelection.push('esthetique');
    }
  });

  return newSelection;
}
