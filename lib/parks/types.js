import dotenv from 'dotenv';
dotenv.config();

/**
 * Get the language from our env file and use it for the definition of the different types.
 */
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
    service: 'Service',
  });
} else if (languages === 'nl') {
  entityType = Object.freeze({
    ride: 'Attractie',
    show: 'Show',
    merchandise: 'Merchandise',
    restaurant: 'Restaurant',
    fairytale: 'Sprookje',
    service: 'Service',
  });
} else if (languages === 'de') {
  entityType = Object.freeze({
    ride: 'Attraktion',
    show: 'Show',
    merchandise: 'Merchandise',
    restaurant: 'Restaurant',
    fairytale: 'Märchen',
    service: 'Service',
  });
} else if (languages === 'fr') {
  entityType = Object.freeze({
    ride: 'Attraction',
    show: 'Show',
    merchandise: 'Merchandise',
    restaurant: 'Restaurant',
    fairytale: 'conte de fées',
    service: 'Service',
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
    down: 'Störung',
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
