import dotenv from 'dotenv';
dotenv.config();

let languages = process.env.LANGUAGES;

if (!languages) {
  languages = 'en';
};

/**
 * Possible types of entity types
 * @enum
 */
export let entityType;

if (languages === 'en') {
  entityType = Object.freeze({
    ride: 'Attraction',
    show: 'Show',
    merchandise: 'Merchandise',
    restaurant: 'Restaurant',
    fairytale: 'Fairytale',
  });
} else if (languages === 'nl') {
  entityType = Object.freeze({
    ride: 'Attractie',
    show: 'Show',
    merchandise: 'Merchandise',
    restaurant: 'Restaurant',
    fairytale: 'Sprookje',
  });
} else if (languages === 'de') {
  entityType = Object.freeze({
    ride: 'Attraktion',
    show: 'Show',
    merchandise: 'Merchandise',
    restaurant: 'Restaurant',
    fairytale: 'Märchen',
  });
} else if (languages === 'fr') {
  entityType = Object.freeze({
    ride: 'Attraction',
    show: 'Show',
    merchandise: 'Merchandise',
    restaurant: 'Restaurant',
    fairytale: 'conte de fées',
  });
}

/**
 * Possible types of queue statuses
 * @enum
 */
export let queueType;

if (languages === 'en') {
  queueType = Object.freeze({
    operating: 'Operating',
    down: 'Down',
    closed: 'Closed',
    refurbishment: 'Refurbishment',
  });
} else if (languages === 'nl') {
  queueType = Object.freeze({
    operating: 'Geopend',
    down: 'Storing',
    closed: 'Gesloten',
    refurbishment: 'Onderhoud',
  });
} else if (languages === 'de') {
  queueType = Object.freeze({
    operating: 'Geöffnet',
    down: 'Fehlfunktion',
    closed: 'Geschlossen',
    refurbishment: 'Instandhaltung',
  });
} else if (languages === 'fr') {
  queueType = Object.freeze({
    operating: 'Ouvert',
    down: 'Mauvais fonctionnement',
    closed: 'Fermé',
    refurbishment: 'Entretien',
  });
}
