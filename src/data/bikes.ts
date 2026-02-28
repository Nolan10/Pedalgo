// src/data/bikes.ts
// Données de seed pour les vélos de démonstration
// Ces données seront injectées dans Firestore au premier lancement si la collection est vide.

import type { BikeType } from '../services/bikesService';

export interface SeedBike {
  title: string;
  description: string;
  type: BikeType;
  pricePerDay: number;
  location: string;
  ownerId: string;
  ownerEmail: string;
  available: boolean;
}

export const seedBikes: SeedBike[] = [
  {
    title: 'VTT Rockrider 540',
    description: 'VTT robuste idéal pour les sentiers et la forêt. Fourche suspendue, freins à disque, 27 vitesses. Parfait pour les balades en nature.',
    type: 'mountain',
    pricePerDay: 15,
    location: 'Paris 11e',
    ownerId: 'seed_owner_1',
    ownerEmail: 'pierre.dupont@email.com',
    available: true,
  },
  {
    title: 'Vélo de ville Elops 520',
    description: 'Vélo de ville confortable avec porte-bagages, garde-boue et éclairage intégré. Idéal pour les trajets quotidiens.',
    type: 'city',
    pricePerDay: 8,
    location: 'Lyon 3e',
    ownerId: 'seed_owner_2',
    ownerEmail: 'marie.martin@email.com',
    available: true,
  },
  {
    title: 'VAE Riverside 500E',
    description: 'Vélo à assistance électrique avec autonomie de 90 km. Moteur Brose, batterie 420Wh. Confort optimal pour les longues distances.',
    type: 'electric',
    pricePerDay: 25,
    location: 'Bordeaux Centre',
    ownerId: 'seed_owner_1',
    ownerEmail: 'pierre.dupont@email.com',
    available: true,
  },
  {
    title: 'Vélo de route Triban RC520',
    description: 'Vélo de route performant avec cadre aluminium, transmission Shimano 105. Pour les sportifs et les longues sorties.',
    type: 'road',
    pricePerDay: 20,
    location: 'Marseille 6e',
    ownerId: 'seed_owner_3',
    ownerEmail: 'lucas.bernard@email.com',
    available: true,
  },
  {
    title: 'Vélo pliant Tilt 500',
    description: 'Vélo pliant compact, se plie en 30 secondes. Parfait pour le multimodal train+vélo. 7 vitesses, léger.',
    type: 'folding',
    pricePerDay: 10,
    location: 'Paris 15e',
    ownerId: 'seed_owner_2',
    ownerEmail: 'marie.martin@email.com',
    available: true,
  },
  {
    title: 'Cargo Longtail R500E',
    description: 'Vélo cargo électrique pouvant transporter 2 enfants ou 80kg de charge. Assistance électrique puissante.',
    type: 'cargo',
    pricePerDay: 30,
    location: 'Nantes Centre',
    ownerId: 'seed_owner_3',
    ownerEmail: 'lucas.bernard@email.com',
    available: true,
  },
  {
    title: 'VTT Enfant Rockrider ST100',
    description: 'VTT pour enfant 8-12 ans, taille 24 pouces. Léger et maniable, freinage efficace. Idéal pour les premières aventures.',
    type: 'mountain',
    pricePerDay: 7,
    location: 'Toulouse Capitole',
    ownerId: 'seed_owner_1',
    ownerEmail: 'pierre.dupont@email.com',
    available: true,
  },
  {
    title: 'VAE Urbain Elops 940E',
    description: 'Vélo électrique urbain haut de gamme. Moteur central Shimano Steps, batterie longue durée, éclairage automatique.',
    type: 'electric',
    pricePerDay: 22,
    location: 'Strasbourg Centre',
    ownerId: 'seed_owner_2',
    ownerEmail: 'marie.martin@email.com',
    available: true,
  },
  {
    title: 'Vélo de ville vintage',
    description: 'Magnifique vélo de ville rétro avec panier avant, selle confortable et sonnette. Style hollandais, 3 vitesses.',
    type: 'city',
    pricePerDay: 12,
    location: 'Paris 4e',
    ownerId: 'seed_owner_3',
    ownerEmail: 'lucas.bernard@email.com',
    available: true,
  },
  {
    title: 'Gravel Triban GRVL 520',
    description: 'Vélo gravel polyvalent route/chemin. Pneus larges, freins à disque, cadre acier. Aventure sans limites.',
    type: 'road',
    pricePerDay: 18,
    location: 'Montpellier Centre',
    ownerId: 'seed_owner_1',
    ownerEmail: 'pierre.dupont@email.com',
    available: true,
  },
  {
    title: 'Vélo pliant électrique Eovolt',
    description: 'Vélo pliant avec assistance électrique, autonomie 70km. Ultra compact une fois plié. Poids 17kg.',
    type: 'folding',
    pricePerDay: 18,
    location: 'Lyon 7e',
    ownerId: 'seed_owner_2',
    ownerEmail: 'marie.martin@email.com',
    available: true,
  },
  {
    title: 'VTT Enduro Stumpjumper',
    description: 'VTT enduro tout-suspendu 160mm de débattement. Pour les descentes techniques et les riders confirmés.',
    type: 'mountain',
    pricePerDay: 35,
    location: 'Grenoble Centre',
    ownerId: 'seed_owner_3',
    ownerEmail: 'lucas.bernard@email.com',
    available: true,
  },
  {
    title: 'Vélo de ville électrique B\'Twin',
    description: 'Vélo de ville électrique accessible avec panier, porte-bagages et éclairage intégré. Assistance jusqu\'à 25km/h.',
    type: 'electric',
    pricePerDay: 16,
    location: 'Lille Centre',
    ownerId: 'seed_owner_1',
    ownerEmail: 'pierre.dupont@email.com',
    available: true,
  },
  {
    title: 'Cargo biporteur Bakfiets',
    description: 'Biporteur hollandais classique avec caisse avant. Transport d\'enfants ou de courses. Robuste et fiable.',
    type: 'cargo',
    pricePerDay: 25,
    location: 'Rennes Centre',
    ownerId: 'seed_owner_2',
    ownerEmail: 'marie.martin@email.com',
    available: true,
  },
  {
    title: 'Vélo de route Canyon Endurace',
    description: 'Vélo de route confort, géométrie endurance. Cadre carbone, Shimano Ultegra. Pour les cyclistes exigeants.',
    type: 'road',
    pricePerDay: 40,
    location: 'Nice Centre',
    ownerId: 'seed_owner_3',
    ownerEmail: 'lucas.bernard@email.com',
    available: true,
  },
];
