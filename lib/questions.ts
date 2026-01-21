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

// Activity segments for percentage distribution questions
const activitySegments: Option[] = [
  { value: 'preventifs', label: 'Soins préventifs' },
  { value: 'hygiene', label: 'Soins d\'hygiène de base' },
  { value: 'protheses', label: 'Prothèses fixes et amovibles' },
  { value: 'implants', label: 'Implants' },
  { value: 'orthodontie', label: 'Orthodontie et soins esthétiques' },
];

export const questions: Question[] = [
  // SECTION A - Profile
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
    question: 'Avez-vous travaillé via un autre mode d\'exercice avant de rejoindre un groupe ?',
    subtitle: 'Sélectionnez toutes les réponses applicables',
    required: true,
    options: [
      { value: 'A', label: 'Cabinet individuel indépendant' },
      { value: 'B', label: 'Cabinet de groupe indépendant (plusieurs praticiens)' },
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

  // SECTION B - Scale Questions (Q4-Q13)
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
    question: 'Dans quelle mesure pensez-vous que votre affiliation à un groupe dentaire (centre ou réseau de cabinets) a contribué à votre développement professionnel ?',
    min: 0,
    max: 10,
    required: true,
    scaleLabels: { min: 'Pas du tout', max: 'Énormément' },
  },
  {
    id: 'Q6',
    type: 'scale',
    section: 'B',
    question: 'Comment évaluez-vous votre satisfaction concernant l\'accès à la formation continue offert par le groupe dentaire (centre ou réseau de cabinets) ?',
    min: 0,
    max: 10,
    required: true,
    scaleLabels: { min: 'Pas du tout satisfait', max: 'Très satisfait' },
  },
  {
    id: 'Q7',
    type: 'scale',
    section: 'B',
    question: 'Comment jugez-vous l\'accès aux technologies et aux matériaux dentaires par rapport à un cabinet individuel ou de groupe indépendant ?',
    min: 0,
    max: 10,
    required: true,
    scaleLabels: { min: 'Bien moins bon', max: 'Bien meilleur' },
  },
  {
    id: 'Q8',
    type: 'scale',
    section: 'B',
    question: 'Dans quelle mesure votre affiliation à un groupe dentaire (centre ou réseau de cabinets) a-t-elle contribué à l\'amélioration de vos résultats cliniques ?',
    min: 0,
    max: 10,
    required: true,
    scaleLabels: { min: 'Pas du tout', max: 'Énormément' },
  },
  {
    id: 'Q9',
    type: 'scale',
    section: 'B',
    question: 'Avez-vous bénéficié de la présence de confrères sur place pour gérer vos cas cliniques ?',
    min: 0,
    max: 10,
    required: true,
    scaleLabels: { min: 'Pas du tout', max: 'Énormément' },
  },
  {
    id: 'Q10',
    type: 'scale',
    section: 'B',
    question: 'Si vous avez travaillé auparavant dans un cabinet individuel, estimez-vous que la satisfaction des patients est plus élevée dans votre structure actuelle ?',
    min: 0,
    max: 10,
    required: true,
    scaleLabels: { min: 'Bien moins satisfaits', max: 'Bien plus satisfaits' },
  },
  {
    id: 'Q11',
    type: 'scale',
    section: 'B',
    question: 'Pensez-vous qu\'exercer dans un groupe dentaire (centre ou réseau de cabinets) a amélioré votre sécurité vis-à-vis des risques professionnels (accidents exposition au sang, projections, matériaux, agressions, ...) ?',
    min: 0,
    max: 10,
    required: true,
    scaleLabels: { min: 'Pas du tout', max: 'Énormément' },
  },
  {
    id: 'Q12',
    type: 'scale',
    section: 'B',
    question: 'Le travail au sein d\'un groupe dentaire (centre ou réseau de cabinets) a-t-il amélioré votre équilibre personnel-professionnel ?',
    min: 0,
    max: 10,
    required: true,
    scaleLabels: { min: 'Pas du tout', max: 'Énormément' },
  },
  {
    id: 'Q13',
    type: 'scale',
    section: 'B',
    question: 'Êtes-vous satisfait de votre décision de travailler au sein d\'un groupe dentaire (centre ou réseau de cabinets) ?',
    min: 0,
    max: 10,
    required: true,
    scaleLabels: { min: 'Pas du tout satisfait', max: 'Très satisfait' },
  },

  // SECTION C - Activity Segments
  {
    id: 'Q14',
    type: 'multiple',
    section: 'C',
    question: 'Aujourd\'hui, dans quels segments observez-vous le plus haut niveau d\'activité ?',
    subtitle: 'Sélectionnez tous les segments concernés',
    required: true,
    options: activitySegments,
  },
  {
    id: 'Q14b',
    type: 'percentage_distribution',
    section: 'C',
    question: 'Comment se répartit votre activité actuelle entre ces segments ?',
    subtitle: 'Répartissez 100% entre les segments (le total doit être égal à 100%)',
    required: true,
    options: activitySegments,
  },
  {
    id: 'Q15',
    type: 'multiple',
    section: 'C',
    question: 'Dans quels segments anticipez-vous une augmentation de l\'activité au cours des 5 prochaines années ?',
    subtitle: 'Sélectionnez tous les segments concernés',
    required: true,
    options: activitySegments,
  },
  {
    id: 'Q15b',
    type: 'percentage_distribution',
    section: 'C',
    question: 'Comment anticipez-vous la répartition de votre activité dans 5 ans ?',
    subtitle: 'Répartissez 100% entre les segments (le total doit être égal à 100%)',
    required: true,
    options: activitySegments,
  },

  // SECTION D - Contact
  {
    id: 'Q16',
    type: 'text',
    section: 'D',
    question: 'Dans quelle structure exercez-vous ?',
    placeholder: 'Nom de la structure',
    required: true,
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
];

export const sectionTitles: Record<string, string> = {
  'A': 'Profil',
  'B': 'Évaluation de la structure',
  'C': 'Segments d\'activité',
  'D': 'Informations complémentaires',
};

// Get the question flow (all questions in sequence)
export function getQuestionFlow(answers: Record<string, any>): Question[] {
  return questions;
}

// Determine if a question should be shown based on conditional logic
export function shouldShowQuestion(question: Question, answers: Record<string, any>): boolean {
  // Q10 conditional logic: Only show if Q2 includes 'A' (Cabinet individuel indépendant)
  if (question.id === 'Q10') {
    const q2Answer = answers['Q2'] as string[] | undefined;
    return q2Answer?.includes('A') ?? false;
  }

  return true;
}
