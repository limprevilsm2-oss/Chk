export interface BoardAnnotation {
  arrows?: Array<{ from: number; to: number; color: 'green' | 'blue' | 'gold' }>;
  highlights?: Array<{ sq: number; color: 'green' | 'blue' | 'gold' }>;
}

export interface StudyStep {
  notation: string;
  comment: string;
  annotations?: BoardAnnotation;
}

export interface StudyLesson {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  motif: string;
  level: string;
  fen: string;
  intro: string;
  keyTakeaway: string;
  initialAnnotations?: BoardAnnotation;
  steps: StudyStep[];
}

export interface Puzzle {
  id: string;
  number: string;
  title: string;
  motif: string;
  difficulty: 'Standard' | 'Avancé' | 'Maître';
  objective: string;
  fen: string;
  solution: string[];
  hints: [string, string];
  explanation: string;
}

export const STUDY_LESSONS: StudyLesson[] = [
  {
    id: 'coup-royal',
    number: '01',
    title: 'Le Coup Royal',
    subtitle: 'Double sacrifice préparatoire et rafle jusqu’à dame',
    motif: 'Combinaison de couronnement',
    level: 'KNDB Niveau 6',
    fen: 'W:W27,28,32,33,35,37,38,43,48:B2,7,8,10,13,17,18,19,24',
    intro:
      'Le Coup Royal (Koninklijke Slag) illustre le principe fondamental du cours Hoogland : enchaîner deux sacrifices précis pour aligner les pièces adverses sur une chaîne de prise aboutissant directement à dame.',
    keyTakeaway:
      'Vérifiez toujours les cases de blocage derrière votre sacrifice : ici, le pion blanc en 28 interdit au pion noir 17 de prendre en 28 après 27-22.',
    initialAnnotations: {
      arrows: [
        { from: 35, to: 30, color: 'green' },
        { from: 27, to: 22, color: 'blue' },
      ],
      highlights: [
        { sq: 28, color: 'gold' },
        { sq: 3, color: 'green' },
      ],
    },
    steps: [
      {
        notation: '35-30',
        comment:
          'Premier sacrifice sur l’aile droite : les Blancs attirent le pion 24 hors de la diagonale centrale.',
        annotations: {
          arrows: [{ from: 24, to: 35, color: 'gold' }],
          highlights: [{ sq: 30, color: 'green' }],
        },
      },
      {
        notation: '24x35',
        comment:
          'Prise obligatoire vers le bord. Le pion noir 24 est désormais neutralisé en 35.',
        annotations: {
          arrows: [{ from: 27, to: 22, color: 'green' }],
        },
      },
      {
        notation: '27-22',
        comment:
          'Deuxième sacrifice décisif : grâce au blocage exercé par le pion blanc en 28, seul le pion 18 peut capturer.',
        annotations: {
          arrows: [{ from: 18, to: 27, color: 'gold' }],
          highlights: [{ sq: 28, color: 'gold' }],
        },
      },
      {
        notation: '18x27',
        comment:
          'Le pont tactique 27 — 17 — 8 est maintenant en place et la case de couronnement 3 est libre.',
        annotations: {
          arrows: [
            { from: 32, to: 21, color: 'green' },
            { from: 21, to: 12, color: 'green' },
            { from: 12, to: 3, color: 'green' },
          ],
          highlights: [
            { sq: 27, color: 'gold' },
            { sq: 17, color: 'gold' },
            { sq: 8, color: 'gold' },
          ],
        },
      },
      {
        notation: '32x21x12x3',
        comment:
          'Rafle royale en trois temps : les Blancs capturent trois pions et obtiennent une dame dominante en 3.',
        annotations: {
          highlights: [{ sq: 3, color: 'green' }],
        },
      },
    ],
  },
  {
    id: 'coup-philippe',
    number: '02',
    title: 'Le Coup Philippe',
    subtitle: 'Dégagement du flanc droit et frappe sur la case 5',
    motif: 'Coup Philippe',
    level: 'KNDB Niveau 6',
    fen: 'W:W28,29,30,33,34,35,38,39,40,43:B3,4,8,9,10,13,15,19,20',
    intro:
      'Le Coup Philippe exploite une faiblesse sur l’aile gauche des Noirs (cases 10, 15, 20) lorsque l’avant-poste en 19 n’est plus soutenu correctement. Le pion blanc 30 joue ici le rôle de verrou.',
    keyTakeaway:
      'Le verrou en 30 interdit la prise 19x30 et contraint le pion noir 20 à dégager lui-même la route vers la case de dame 5.',
    initialAnnotations: {
      arrows: [
        { from: 29, to: 24, color: 'green' },
        { from: 34, to: 5, color: 'blue' },
      ],
      highlights: [
        { sq: 30, color: 'gold' },
        { sq: 5, color: 'green' },
      ],
    },
    steps: [
      {
        notation: '29-24',
        comment:
          'Attaque directe : les Blancs posent le pion en 24. Les Noirs ne peuvent pas prendre 19x30 à cause du pion blanc 30.',
        annotations: {
          arrows: [{ from: 20, to: 29, color: 'gold' }],
          highlights: [{ sq: 30, color: 'gold' }],
        },
      },
      {
        notation: '20x29',
        comment:
          'Capture unique forcée : le pion 20 vient en 29 et ouvre la grande diagonale vers 5.',
        annotations: {
          arrows: [
            { from: 34, to: 23, color: 'green' },
            { from: 23, to: 14, color: 'green' },
            { from: 14, to: 5, color: 'green' },
          ],
        },
      },
      {
        notation: '34x23x14x5',
        comment:
          'Exécution du Coup Philippe : les Blancs raflent 29, 19 et 10 et entrent à dame sur le coin supérieur 5.',
        annotations: {
          highlights: [{ sq: 5, color: 'green' }],
        },
      },
    ],
  },
  {
    id: 'coup-weiss',
    number: '03',
    title: 'Le Coup Weiss',
    subtitle: 'L’enchaînement par libération de case et prise forcée',
    motif: 'Coup Weiss',
    level: 'KNDB Niveau 6',
    fen: 'W:W27,29,30,31,32,35,36,37,38,40,42:B3,6,8,12,14,15,16,18,20',
    intro:
      'Nommé d’après le champion du monde français Isidore Weiss, cet enchaînement combine un premier appel sur une aile avec une frappe de dégagement sur l’aile opposée pour ouvrir la diagonale de dame.',
    keyTakeaway:
      'Cherchez à vider la case de chute avant d’attirer le pion bloqueur : ici, 29-24 occupe d’abord 20, puis 27-21 aspire 16 hors du chemin.',
    initialAnnotations: {
      arrows: [
        { from: 29, to: 24, color: 'green' },
        { from: 27, to: 21, color: 'blue' },
      ],
      highlights: [
        { sq: 2, color: 'green' },
        { sq: 16, color: 'gold' },
      ],
    },
    steps: [
      {
        notation: '29-24',
        comment:
          'Temps préparatoire : les Blancs forcent 20x29 afin de fixer le flanc droit noir.',
        annotations: {
          arrows: [{ from: 20, to: 29, color: 'gold' }],
        },
      },
      {
        notation: '20x29',
        comment:
          'Capture forcée (le pion 30 bloque 19/18). Les Blancs préparent maintenant le coup de grâce à gauche.',
        annotations: {
          arrows: [{ from: 27, to: 21, color: 'green' }],
        },
      },
      {
        notation: '27-21',
        comment:
          'Le pion 27 s’offre en 21. Grâce au soutien en 36, le pion 16 s’arrêtera exactement sur 27.',
        annotations: {
          arrows: [{ from: 16, to: 27, color: 'gold' }],
          highlights: [{ sq: 36, color: 'gold' }],
        },
      },
      {
        notation: '16x27',
        comment:
          'Le pion noir 16 tombe dans le piège en 27, ouvrant la voie 31 — 22 — 13 — 2.',
        annotations: {
          arrows: [
            { from: 31, to: 22, color: 'green' },
            { from: 22, to: 13, color: 'green' },
            { from: 13, to: 2, color: 'green' },
          ],
        },
      },
      {
        notation: '31x22x13x2',
        comment:
          'Rafle finale : trois pions capturés (27, 18 et 8) et couronnement en 2.',
        annotations: {
          highlights: [{ sq: 2, color: 'green' }],
        },
      },
    ],
  },
  {
    id: 'coup-turc',
    number: '04',
    title: 'Le Coup Turc',
    subtitle: 'Utiliser les pions pris comme butées sous la règle FMJD',
    motif: 'Règle internationale FMJD',
    level: 'KNDB Niveau 6',
    fen: 'W:W14,17,18,19,22,27,28,29,34,38,43:BK3,B4,6,7,15',
    intro:
      'En jeu de dames international, les pièces capturées restent sur l’échiquier jusqu’à la fin de la rafle et ne peuvent pas être sautées une seconde fois. Le Coup Turc transforme un pion déjà pris en mur infranchissable pour la dame adverse.',
    keyTakeaway:
      'Lorsqu’une dame adverse effectue une boucle, la première pièce capturée devient un obstacle permanent durant le reste de son coup.',
    initialAnnotations: {
      arrows: [
        { from: 17, to: 12, color: 'green' },
        { from: 3, to: 21, color: 'gold' },
      ],
      highlights: [
        { sq: 3, color: 'gold' },
        { sq: 12, color: 'blue' },
      ],
    },
    steps: [
      {
        notation: '17-12',
        comment:
          'Les Blancs placent le pion 17 en 12. La dame noire en 3 est contrainte de lancer une prise de 3 pions.',
        annotations: {
          arrows: [
            { from: 3, to: 21, color: 'gold' },
            { from: 21, to: 32, color: 'gold' },
            { from: 32, to: 23, color: 'gold' },
          ],
          highlights: [{ sq: 12, color: 'gold' }],
        },
      },
      {
        notation: '3x21x32x23',
        comment:
          'Moment critique du Coup Turc : arrivée en 23, la dame noire semble pouvoir prendre le pion 18 vers 12... mais le pion 12, déjà capturé au début de la rafle, occupe toujours la case 12 ! La dame est bloquée en 23.',
        annotations: {
          arrows: [{ from: 19, to: 28, color: 'green' }],
          highlights: [
            { sq: 12, color: 'gold' },
            { sq: 23, color: 'blue' },
          ],
        },
      },
      {
        notation: '19x28',
        comment:
          'Les pièces blanches capturées sont retirées, puis le pion 19 capture immédiatement la dame noire en 23 !',
        annotations: {
          highlights: [{ sq: 28, color: 'green' }],
        },
      },
    ],
  },
  {
    id: 'prise-majoritaire',
    number: '05',
    title: 'La Prise Majoritaire',
    subtitle: 'Forcer une rafle adverse de deux pions pour en rafler quatre',
    motif: 'Force du nombre',
    level: 'KNDB Niveau 6',
    fen: 'W:W21,26,28,32,33,38,39,42,43,47,48:B1,3,7,9,12,17,18,19,27',
    intro:
      'La règle de la prise majoritaire oblige le joueur à choisir la rafle qui capture le maximum de pièces. Au Niveau 6, on crée délibérément une prise de 2 pions pour interdire à l’adversaire une prise de 1 pion sans danger.',
    keyTakeaway:
      'Après 28-23, les Noirs aimeraient jouer 18x29 (1 pion), mais la présence du pion 32 rend 19x28x37 (2 pions) strictement obligatoire.',
    initialAnnotations: {
      arrows: [
        { from: 28, to: 23, color: 'green' },
        { from: 19, to: 37, color: 'gold' },
      ],
      highlights: [
        { sq: 32, color: 'blue' },
        { sq: 37, color: 'gold' },
      ],
    },
    steps: [
      {
        notation: '28-23',
        comment:
          'Appât double : 18x29 ne prendrait qu’un pion, alors que 19x28x37 en prend deux. La règle majoritaire impose 19x28x37.',
        annotations: {
          arrows: [
            { from: 19, to: 28, color: 'gold' },
            { from: 28, to: 37, color: 'gold' },
          ],
        },
      },
      {
        notation: '19x28x37',
        comment:
          'Les Noirs atterrissent en 37 et déclenchent une gigantesque contre-rafle en zigzag.',
        annotations: {
          arrows: [
            { from: 42, to: 31, color: 'green' },
            { from: 31, to: 22, color: 'green' },
            { from: 22, to: 11, color: 'green' },
            { from: 11, to: 2, color: 'green' },
          ],
        },
      },
      {
        notation: '42x31x22x11x2',
        comment:
          'Contre-attaque foudroyante : 4 pions noirs (37, 27, 17, 7) sont balayés jusqu’à la case de dame 2.',
        annotations: {
          highlights: [{ sq: 2, color: 'green' }],
        },
      },
    ],
  },
  {
    id: 'collage-klem',
    number: '06',
    title: 'Le Collage (Klem) & Les Temps',
    subtitle: 'Asphyxie positionnelle de l’aile droite et zugzwang',
    motif: 'Jeu classique & Temps de réserve',
    level: 'KNDB Niveau 6',
    fen: 'W:W28,30,33,34,35,38,44,45:B4,9,13,14,15,19,20,24,25',
    intro:
      'Dans les parties classiques du programme KNDB Niveau 6, le gain s’obtient souvent sans combinaison spectaculaire : on immobilise l’aile adverse (Klem) tout en conservant des temps de réserve à l’arrière.',
    keyTakeaway:
      'Épuisez les coups d’attente de l’adversaire avec vos pions arrière (45-40, 44-39) jusqu’à ce qu’il soit forcé de sacrifier ou d’ouvrir ses liaisons.',
    initialAnnotations: {
      arrows: [
        { from: 45, to: 40, color: 'green' },
        { from: 44, to: 39, color: 'blue' },
      ],
      highlights: [
        { sq: 25, color: 'gold' },
        { sq: 20, color: 'gold' },
        { sq: 15, color: 'gold' },
      ],
    },
    steps: [
      {
        notation: '45-40',
        comment:
          'Tempo de réserve sur l’aile droite : les Noirs ont l’aile gauche complètement verrouillée par 30 et 35.',
        annotations: {
          highlights: [
            { sq: 30, color: 'blue' },
            { sq: 35, color: 'blue' },
          ],
        },
      },
      {
        notation: '4-10',
        comment:
          'Seul coup d’attente sain des Noirs ; pousser 24-29 ou 19-23 perd immédiatement du matériel.',
        annotations: {
          arrows: [{ from: 44, to: 39, color: 'green' }],
        },
      },
      {
        notation: '44-39',
        comment:
          'Nouveau coup d’attente : les Noirs sont maintenant en zugzwang et doivent affaiblir leur position.',
        annotations: {
          highlights: [{ sq: 39, color: 'green' }],
        },
      },
    ],
  },
  {
    id: 'finale-opposition',
    number: '07',
    title: 'Finale : Le Piège de Dame',
    subtitle: 'Contrôle des diagonales et interception forcée en finale',
    motif: 'Technique de finale',
    level: 'KNDB Niveau 6',
    fen: 'W:WK48,32,36:BK9',
    intro:
      'En finale de dames, un simple pion avancé coordonné avec une dame permet de construire des réseaux d’interception mortels. Ici, le pion 36 ferme la case de fuite 36.',
    keyTakeaway:
      'Avant de tendre le piège sur une diagonale, vérifiez que toutes les cases de rebond périphériques sont verrouillées.',
    initialAnnotations: {
      arrows: [
        { from: 32, to: 27, color: 'green' },
        { from: 9, to: 31, color: 'gold' },
      ],
      highlights: [
        { sq: 36, color: 'blue' },
        { sq: 48, color: 'green' },
      ],
    },
    steps: [
      {
        notation: '32-27',
        comment:
          'Coup de barrage : le pion 32 s’intercale sur la diagonale 9 — 36. Comme la case 36 est occupée par le pion blanc 36, la dame noire est piégée.',
        annotations: {
          arrows: [{ from: 9, to: 31, color: 'gold' }],
          highlights: [
            { sq: 27, color: 'green' },
            { sq: 36, color: 'blue' },
          ],
        },
      },
      {
        notation: '9x31',
        comment:
          'Prise unique forcée : la dame noire doit s’arrêter en 31.',
        annotations: {
          arrows: [{ from: 48, to: 26, color: 'green' }],
        },
      },
      {
        notation: '48x26',
        comment:
          'La dame blanche en 48 traverse la diagonale 48 — 26 et capture la dame noire sans appel.',
        annotations: {
          highlights: [{ sq: 26, color: 'green' }],
        },
      },
    ],
  },
  {
    id: 'percee-aile',
    number: '08',
    title: 'La Percée sur l’Aile',
    subtitle: 'Sacrifice de rupture et passage en force',
    motif: 'Percée stratégique',
    level: 'KNDB Niveau 6',
    fen: 'W:W26,27,31,33,36,37,38,39:B6,11,12,13,16,17',
    intro:
      'Lorsque l’adversaire défend le bord avec une chaîne de pions en apparence solide, un sacrifice d’infiltration suivi d’un contre-échange ouvre un passage direct vers la ligne de damier.',
    keyTakeaway:
      'La percée 27-21 transforme un blocage symétrique en un pion passé inarrêtable sur l’aile gauche.',
    initialAnnotations: {
      arrows: [
        { from: 27, to: 21, color: 'green' },
        { from: 33, to: 22, color: 'blue' },
      ],
      highlights: [
        { sq: 21, color: 'green' },
        { sq: 22, color: 'blue' },
      ],
    },
    steps: [
      {
        notation: '27-21',
        comment:
          'Sacrifice d’ouverture sur le bord gauche : le pion noir 16 est obligé de prendre en 27.',
        annotations: {
          arrows: [{ from: 16, to: 27, color: 'gold' }],
        },
      },
      {
        notation: '16x27',
        comment:
          'Les Noirs capturent en 27 (36 bloque la suite en 36). Les Blancs reprennent vers le centre.',
        annotations: {
          arrows: [{ from: 31, to: 22, color: 'green' }],
        },
      },
      {
        notation: '31x22',
        comment:
          'Reprise forcée qui met immédiatement le pion 17 en prise vers 28.',
        annotations: {
          arrows: [{ from: 17, to: 28, color: 'gold' }],
        },
      },
      {
        notation: '17x28',
        comment:
          'La case 39 étant protégée, le pion 17 s’arrête en 28. La colonne gauche noire est perforée.',
        annotations: {
          arrows: [{ from: 33, to: 22, color: 'green' }],
        },
      },
      {
        notation: '33x22',
        comment:
          'Les Blancs reprennent en 22 avec deux pions d’avance et la route libre vers la promotion !',
        annotations: {
          highlights: [{ sq: 22, color: 'green' }],
        },
      },
    ],
  },
];

export const PUZZLES: Puzzle[] = [
  {
    id: 'puzzle-01',
    number: '01',
    title: 'Le Coup Royal direct',
    motif: 'Coup Royal',
    difficulty: 'Standard',
    objective: 'Les Blancs jouent et passent à dame en 2 coups.',
    fen: 'W:W27,28,32,33,37,38,43:B2,8,10,13,17,18,24',
    solution: ['27-22', '18x27', '32x21x12x3'],
    hints: [
      'Observez le pion blanc 28 : il bloque toute prise vers 28 si vous sacrifiez en 22.',
      'Jouez 27-22 pour attirer 18 en 27, puis raflez avec le pion 32.',
    ],
    explanation:
      '1. 27-22! force 18x27 (car 28 bloque 17x28). Ensuite 2. 32x21x12x3 rafle trois pions et couronne.',
  },
  {
    id: 'puzzle-02',
    number: '02',
    title: 'Frappe de Philippe sur la case 5',
    motif: 'Coup Philippe',
    difficulty: 'Standard',
    objective: 'Les Blancs exploitent le verrou en 30 pour passer à dame.',
    fen: 'W:W29,30,33,34,35,38,39,40,44:B4,8,10,13,15,19,20',
    solution: ['29-24', '20x29', '34x23x14x5'],
    hints: [
      'Le pion blanc en 30 empêche le pion noir 19 de prendre en 30.',
      'Attaquez la case 24 avec le pion 29 pour obliger 20x29.',
    ],
    explanation:
      '1. 29-24! force 20x29, libérant l’alignement 29 — 19 — 10 pour 2. 34x23x14x5.',
  },
  {
    id: 'puzzle-03',
    number: '03',
    title: 'L’appel d’Isidore Weiss',
    motif: 'Coup Weiss',
    difficulty: 'Avancé',
    objective: 'Les Blancs ouvrent la diagonale vers la case 2.',
    fen: 'W:W27,31,32,36,37,38,42:B3,6,8,12,14,16,18,29',
    solution: ['27-21', '16x27', '31x22x13x2'],
    hints: [
      'Sacrifiez sur le bord gauche pour aspirer le pion noir 16 en 27.',
      'Jouez 27-21! puis exploitez la rafle du pion 31 jusqu’en 2.',
    ],
    explanation:
      '1. 27-21! force 16x27 (bloqué en 36), permettant la rafle décisive 2. 31x22x13x2.',
  },
  {
    id: 'puzzle-04',
    number: '04',
    title: 'Le Piège du Coup Turc',
    motif: 'Coup Turc (FMJD)',
    difficulty: 'Maître',
    objective: 'Capturez la dame noire en exploitant la règle des pions pris.',
    fen: 'W:W14,17,18,19,22,27,28,29,34,38,43:BK3,B4,6,7,15',
    solution: ['17-12', '3x21x32x23', '19x28'],
    hints: [
      'Obligez la dame noire 3 à effectuer une boucle qui commence par prendre en 12.',
      'Jouez 17-12! La pièce prise en 12 restera sur l’échiquier et bloquera la dame en 23.',
    ],
    explanation:
      '1. 17-12! force 3x21x32x23. En 23, la dame noire ne peut pas sauter 18 car le pion capturé en 12 bloque toujours la case 12. 2. 19x28 gagne la dame.',
  },
  {
    id: 'puzzle-05',
    number: '05',
    title: 'La Force du Nombre',
    motif: 'Prise majoritaire',
    difficulty: 'Avancé',
    objective: 'Forcez une prise majoritaire de 2 pions pour rafler 4 pièces.',
    fen: 'W:W21,26,28,32,33,38,39,42,43,48,49:B3,4,7,9,12,17,18,19,27',
    solution: ['28-23', '19x28x37', '42x31x22x11x2'],
    hints: [
      'Un sacrifice en 23 propose une prise de 1 pion (18x29) et une prise de 2 pions (19x28x37).',
      'Jouez 28-23! La prise majoritaire oblige 19x28x37, suivi de 42x31x22x11x2.',
    ],
    explanation:
      '1. 28-23! oblige les Noirs à choisir la prise majoritaire 19x28x37, ouvrant la rafle de 4 pions 2. 42x31x22x11x2.',
  },
  {
    id: 'puzzle-06',
    number: '06',
    title: 'Rupture de l’Aile Gauche',
    motif: 'Percée sur l’aile',
    difficulty: 'Standard',
    objective: 'Percez la défense noire pour obtenir deux pions d’avance.',
    fen: 'W:W26,27,31,33,36,37,38,39:B6,11,12,13,16,17',
    solution: ['27-21', '16x27', '31x22', '17x28', '33x22'],
    hints: [
      'Sacrifiez le pion avancé en 21 pour ouvrir la colonne.',
      'Jouez 27-21, puis reprenez successivement en 22.',
    ],
    explanation:
      '1. 27-21! 16x27 2. 31x22 17x28 3. 33x22 perce définitivement le flanc gauche noir.',
  },
  {
    id: 'puzzle-07',
    number: '07',
    title: 'La Rafle Diagonale',
    motif: 'Déviation & Zigzag',
    difficulty: 'Avancé',
    objective: 'Trouvez la combinaison qui couronne en 2.',
    fen: 'W:W29,30,33,34,35,38,39,40,44:B3,6,8,9,12,14,19,20',
    solution: ['29-24', '20x29', '33x24x13x2'],
    hints: [
      'Cherchez le pion blanc prêt à traverser le centre : c’est le pion 33.',
      'Sacrifiez 29-24! pour attirer 20 en 29, puis raflez avec 33.',
    ],
    explanation:
      '1. 29-24! force 20x29 (30 bloque 19x30), ouvrant la diagonale pour 2. 33x24x13x2.',
  },
  {
    id: 'puzzle-08',
    number: '08',
    title: 'Le Zigzag Royal',
    motif: 'Combinaison de couronnement',
    difficulty: 'Avancé',
    objective: 'Enchaînez un sacrifice en 22 et une rafle vers la case 2.',
    fen: 'W:W27,28,31,32,33,36,37,38,42:B1,3,7,9,12,16,17,18,19',
    solution: ['27-22', '18x27', '31x22x11x2'],
    hints: [
      'Le pion 28 bloque 17x28, et le pion 36 empêche 18x27x36.',
      'Jouez 27-22! puis raflez en zigzag avec le pion 31.',
    ],
    explanation:
      '1. 27-22! force 18x27, après quoi 2. 31x22x11x2 capture 27, 17 et 7 jusqu’à dame.',
  },
  {
    id: 'puzzle-09',
    number: '09',
    title: 'Interception en Finale',
    motif: 'Finale de dames',
    difficulty: 'Maître',
    objective: 'Les Blancs capturent la dame noire en 2 coups.',
    fen: 'W:WK48,32,36:BK9',
    solution: ['32-27', '9x31', '48x26'],
    hints: [
      'Utilisez votre pion 32 pour forcer la dame noire sur la diagonale contrôlée par votre dame en 48.',
      'Avancez 32-27! Le pion 36 empêche la dame noire de s’échapper au-delà de 31.',
    ],
    explanation:
      '1. 32-27! oblige la dame noire à prendre 9x31 (car 36 est occupé), permettant 2. 48x26.',
  },
  {
    id: 'puzzle-10',
    number: '10',
    title: 'Le Coup du Chapeau',
    motif: 'Coup du Chapeau',
    difficulty: 'Maître',
    objective: 'Déclenchez la rafle finale vers la case de dame 3.',
    fen: 'W:W28,29,33,34,35,38,39,40,43,44:B2,7,8,9,13,14,18,20,25',
    solution: ['29-24', '20x29', '34x23x12x3'],
    hints: [
      'Les cases 29, 18 et 8 forment une ligne brisée vers la case 3.',
      'Jouez 29-24! pour forcer 20x29, puis raflez avec le pion 34.',
    ],
    explanation:
      '1. 29-24! force 20x29, permettant à 34 de balayer 29, 18 et 8 jusqu’à la case de dame 3.',
  },
];

export interface SyllabusTopic {
  code: string;
  title: string;
  category: 'Tactique' | 'Stratégie' | 'Finales';
  description: string;
  linkedLessonId?: string;
}

export const KNDB_NIVEAU_6_SYLLABUS: SyllabusTopic[] = [
  {
    code: 'N6-01',
    title: 'Le Coup Royal & Doubles Sacrifices',
    category: 'Tactique',
    description:
      'Calcul des combinaisons à 2 ou 3 temps avec vérification des cases de blocage et de la prise majoritaire.',
    linkedLessonId: 'coup-royal',
  },
  {
    code: 'N6-02',
    title: 'Le Coup Philippe',
    category: 'Tactique',
    description:
      'Exploitation des avant-postes mal soutenus sur l’aile gauche adverse par sacrifice de déviation.',
    linkedLessonId: 'coup-philippe',
  },
  {
    code: 'N6-03',
    title: 'Le Coup Weiss & L’Enchaînement',
    category: 'Tactique',
    description:
      'Coordination de deux ailes pour vider les cases de chute et déclencher un couronnement forcé.',
    linkedLessonId: 'coup-weiss',
  },
  {
    code: 'N6-04',
    title: 'Le Coup Turc (Règle FMJD)',
    category: 'Tactique',
    description:
      'Maîtrise avancée de la règle internationale interdisant de sauter ou traverser une pièce déjà capturée.',
    linkedLessonId: 'coup-turc',
  },
  {
    code: 'N6-05',
    title: 'La Prise Majoritaire comme Arme',
    category: 'Tactique',
    description:
      'Contraindre l’adversaire à exécuter la prise numériquement la plus élevée pour l’attirer sur une case fatale.',
    linkedLessonId: 'prise-majoritaire',
  },
  {
    code: 'N6-06',
    title: 'Le Collage (Klem) & Temps de Réserve',
    category: 'Stratégie',
    description:
      'Verrouillage de l’aile droite adverse en partie classique et décompte exact des temps pour obtenir le zugzwang.',
    linkedLessonId: 'collage-klem',
  },
  {
    code: 'N6-07',
    title: 'Finales de Dames & Interceptions',
    category: 'Finales',
    description:
      'Contrôle de la Grande Diagonale (5-46), opposition et pièges d’interception à matériel réduit.',
    linkedLessonId: 'finale-opposition',
  },
  {
    code: 'N6-08',
    title: 'La Percée sur l’Aile',
    category: 'Stratégie',
    description:
      'Sacrifices de rupture dans les chaînes défensives latérales pour créer un pion passé imparable.',
    linkedLessonId: 'percee-aile',
  },
];
