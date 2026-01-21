# Groupes Dentaires Survey - Structure Documentation

## Overview

Single survey with branching based on practice type, enabling statistical comparison between:
- **Branch A**: Dentists in dental groups (centres/réseaux de cabinets)
- **Branch B**: Independent dentists (cabinet individuel or groupe indépendant)

**Estimated completion time**: ~2 minutes

---

## Survey Flow

```
Q0: Dans quel type de structure exercez-vous actuellement ?
│
├─> [A] Groupe dentaire ─────────────────> Branch A
│                                          Q1-Q3 (Profile)
│                                          Q4-Q13 (Group evaluation)
│                                          Q14-Q15b (Activity segments)
│                                          Q16-Q18 (Contact)
│
└─> [B/C] Cabinet indépendant ──────────> Branch B
                                           Q1-Q3 (Profile)
                                           Q4i-Q12i (Independent evaluation)
                                           Q20-Q22 (Perception of groups)
                                           Q14-Q15b (Activity segments)
                                           Q16-Q18 (Contact)
```

---

## Complete Question List

### Section 0: Routing (1 question)

| ID | Type | Question | Required |
|----|------|----------|----------|
| Q0 | single | Dans quel type de structure exercez-vous actuellement ? | Yes |

**Q0 Options:**
- A: Groupe dentaire (centre ou réseau de cabinets)
- B: Cabinet individuel indépendant
- C: Cabinet de groupe indépendant (plusieurs praticiens)

---

### Section A: Profile (3 questions, both branches)

| ID | Type | Question | Required | Validation |
|----|------|----------|----------|------------|
| Q1 | numeric | En quelle année avez-vous commencé à exercer en tant que médecin-dentiste ? | Yes | 1960-2025 |
| Q2 | multiple_exclusive | Quel(s) mode(s) d'exercice avez-vous pratiqué(s) au cours de votre carrière ? | Yes | - |
| Q3 | numeric | Depuis combien de temps êtes-vous affilié(e) à votre structure actuelle ? | Yes | 0-50 years |

**Q2 Options:**
- A: Cabinet individuel indépendant - associé / fondateur
- B: Cabinet de groupe indépendant (plusieurs praticiens) - associé / fondateur
- C: Salarié(e) dans un cabinet privé
- D: Salarié(e) dans un centre ou groupe dentaire
- E: Autre mode d'exercice (p. ex. hôpital, université)
- F: C'est ma première expérience professionnelle *(exclusive)*

---

### Section B: Evaluation - Branch A (10 questions)

**Condition**: Q0 = 'A'

| ID | Type | Question | Required | Scale Labels |
|----|------|----------|----------|--------------|
| Q4 | scale | Comment évaluez-vous l'efficacité du soutien administratif et opérationnel (par exemple, facturation, planification) dans la réduction de votre charge de travail ? | Yes | Très inefficace → Très efficace |
| Q5 | scale | Dans quelle mesure pensez-vous que votre affiliation à un groupe dentaire contribue à votre développement professionnel ? | Yes | Pas du tout → Énormément |
| Q6 | scale | Comment évaluez-vous votre satisfaction concernant l'accès à la formation continue offert par le groupe dentaire ? | Yes | Pas du tout satisfait → Très satisfait |
| Q7 | scale | Comment évaluez-vous votre satisfaction concernant l'accès aux technologies et aux matériaux dentaires dans votre structure ? | No | Pas du tout satisfait → Très satisfait |
| Q8 | scale | Dans quelle mesure le groupe dentaire contribue-t-il à la qualité de vos soins / qualité clinique ? | Yes | Pas du tout → Énormément |
| Q9 | scale | Dans quelle mesure bénéficiez-vous de la présence de confrères sur place pour gérer vos cas cliniques ? | Yes | Pas du tout → Énormément |
| Q10 | scale | Si vous avez travaillé auparavant en pratique indépendante, estimez-vous que la satisfaction des patients est plus élevée dans votre structure actuelle ? | No | Bien moins satisfaits → Bien plus satisfaits |
| Q11 | scale | Comment évaluez-vous votre niveau de sécurité vis-à-vis des risques professionnels (accidents exposition au sang, projections, matériaux, agressions, ...) ? | Yes | Très exposé → Très protégé |
| Q12 | scale | Pensez-vous que le travail au sein d'un groupe dentaire permet un meilleur équilibre personnel-professionnel ? | No | Pas du tout → Énormément |
| Q13 | scale | Êtes-vous satisfait de travailler au sein d'un groupe dentaire ? | Yes | Pas du tout satisfait → Très satisfait |

**Q10 Additional Condition**: Only shown if Q2 includes 'A' or 'B' (has independent practice experience)

---

### Section B: Evaluation - Branch B (9 questions)

**Condition**: Q0 = 'B' or Q0 = 'C'

| ID | Type | Question | Required | Scale Labels |
|----|------|----------|----------|--------------|
| Q4i | scale | Comment évaluez-vous l'efficacité de votre gestion administrative et opérationnelle (facturation, planification) ? | Yes | Très inefficace → Très efficace |
| Q5i | scale | Dans quelle mesure votre mode d'exercice actuel contribue-t-il à votre développement professionnel ? | Yes | Pas du tout → Énormément |
| Q6i | scale | Comment évaluez-vous votre satisfaction concernant l'accès à la formation continue ? | Yes | Pas du tout satisfait → Très satisfait |
| Q7i | scale | Comment évaluez-vous votre satisfaction concernant l'accès aux technologies et aux matériaux dentaires dans votre structure ? | No | Pas du tout satisfait → Très satisfait |
| Q8i | scale | Dans quelle mesure votre mode d'exercice contribue-t-il à la qualité de vos soins / qualité clinique ? | Yes | Pas du tout → Énormément |
| Q9i | scale | Dans quelle mesure avez-vous accès à des confrères pour discuter ou gérer vos cas cliniques ? | Yes | Pas du tout → Énormément |
| Q10i | scale | Comment évaluez-vous votre niveau de sécurité vis-à-vis des risques professionnels (accidents exposition au sang, projections, matériaux, agressions, ...) ? | Yes | Très exposé → Très protégé |
| Q11i | scale | Pensez-vous que votre mode d'exercice actuel permet un bon équilibre personnel-professionnel ? | No | Pas du tout → Énormément |
| Q12i | scale | Êtes-vous satisfait de votre mode d'exercice actuel ? | Yes | Pas du tout satisfait → Très satisfait |

---

### Section B2: Perception of Dental Groups (3 questions)

**Condition**: Q0 = 'B' or Q0 = 'C'

| ID | Type | Question | Required |
|----|------|----------|----------|
| Q20 | single | Envisagez-vous de rejoindre un groupe dentaire dans les 5 prochaines années ? | Yes |
| Q21 | multiple_exclusive | Quels avantages percevez-vous dans les groupes dentaires ? | Yes |
| Q22 | multiple_exclusive | Quelles sont vos principales réticences vis-à-vis des groupes dentaires ? | Yes |

**Q20 Options:**
- A: Oui, certainement
- B: Oui, peut-être
- C: Non, probablement pas
- D: Non, certainement pas

**Q21 Options:**
- A: Soutien administratif
- B: Accès à des technologies avancées
- C: Collaboration avec des confrères
- D: Formation continue facilitée
- E: Meilleur équilibre vie pro/perso
- F: Sécurité financière
- G: Je ne perçois pas d'avantages *(exclusive)*

**Q22 Options:**
- A: Perte d'autonomie clinique
- B: Pression sur la productivité
- C: Rémunération moins avantageuse
- D: Moins de relation personnelle avec les patients
- E: Standardisation des pratiques
- F: Je n'ai pas de réticences *(exclusive)*

---

### Section C: Activity Segments (4 questions, both branches)

| ID | Type | Question | Required |
|----|------|----------|----------|
| Q14 | multiple | Aujourd'hui, dans quels segments observez-vous le plus haut niveau d'activité ? | Yes |
| Q14b | percentage_distribution | Comment se répartit votre activité actuelle entre ces segments ? | Yes |
| Q15 | multiple | Dans quels segments anticipez-vous une augmentation de l'activité au cours des 5 prochaines années ? | Yes |
| Q15b | percentage_distribution | Comment anticipez-vous la répartition de votre activité dans 5 ans ? | Yes |

**Activity Segments (for Q14, Q14b, Q15, Q15b):**
- Soins préventifs
- Soins d'hygiène de base
- Prothèses fixes et amovibles
- Implants
- Orthodontie et soins esthétiques

**Q14b/Q15b Validation**: Sum must equal exactly 100%

---

### Section D: Contact (3 questions, both branches)

| ID | Type | Question | Required | Condition |
|----|------|----------|----------|-----------|
| Q16 | text | Dans quelle structure exercez-vous ? | Yes | - |
| Q17 | single | En cas de questions, nous permettez-vous de vous contacter si nous souhaitons approfondir avec vous ces réponses ? | Yes | - |
| Q18 | text | Quelle est votre adresse email ? | Yes | Q17 = 'oui' |

**Q17 Options:**
- oui: Oui
- non: Non

---

## Question Count Summary

| Path | Total Questions |
|------|-----------------|
| Branch A (Group Dentist) | 20-21 questions |
| Branch B (Independent Dentist) | 21-22 questions |

*Variation depends on conditional questions (Q10, Q18)*

---

## Statistical Comparison Matrix

All scale questions use 0-10 range. Questions are designed for direct statistical comparison:

| Theme | Branch A | Branch B | Scale Labels | Comparable |
|-------|----------|----------|--------------|------------|
| Administrative efficiency | Q4 | Q4i | Très inefficace → Très efficace | Yes |
| Professional development | Q5 | Q5i | Pas du tout → Énormément | Yes |
| Continuing education | Q6 | Q6i | Pas du tout satisfait → Très satisfait | Yes |
| Technology access | Q7 | Q7i | Pas du tout satisfait → Très satisfait | Yes |
| Clinical quality | Q8 | Q8i | Pas du tout → Énormément | Yes |
| Peer collaboration | Q9 | Q9i | Pas du tout → Énormément | Yes |
| Professional safety | Q11 | Q10i | Très exposé → Très protégé | Yes |
| Work-life balance | Q12 | Q11i | Pas du tout → Énormément | Yes |
| Overall satisfaction | Q13 | Q12i | Pas du tout satisfait → Très satisfait | Yes |

**Branch-specific questions (no direct comparison):**
- Q10: Patient satisfaction vs past (Branch A only, conditional)
- Q20-Q22: Perception of dental groups (Branch B only)

---

## Conditional Logic Summary

```javascript
// Q10: Only for group dentists with independent experience
if (Q0 === 'A' && (Q2.includes('A') || Q2.includes('B'))) show Q10

// Q4-Q13: Only for group dentists
if (Q0 === 'A') show Q4-Q13

// Q4i-Q12i, Q20-Q22: Only for independent dentists
if (Q0 === 'B' || Q0 === 'C') show Q4i-Q12i, Q20-Q22

// Q18: Only if contact accepted
if (Q17 === 'oui') show Q18

// Exclusive options in Q2, Q21, Q22:
// Selecting exclusive option clears all others
```

---

## Data Export Fields

CSV export includes all fields with practice type indicator:

| Field | Description |
|-------|-------------|
| id | Response ID |
| createdAt | Timestamp |
| Q0 | Practice type (A/B/C) - **use for filtering/grouping** |
| Q1 | Year started practicing |
| Q2 | Career experience modes (array) |
| Q3 | Years in current structure |
| Q4-Q13 | Branch A scale responses (null for Branch B) |
| Q4i-Q12i | Branch B scale responses (null for Branch A) |
| Q20-Q22 | Perception questions (null for Branch A) |
| Q14, Q15 | Activity segments selected (array) |
| Q14b, Q15b | Activity distribution (object: {segment: percentage}) |
| Q16 | Structure name |
| Q17 | Contact permission (oui/non) |
| Q18 | Email (if provided) |
