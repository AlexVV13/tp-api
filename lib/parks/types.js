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
 * Possible types of park hours
 * @enum
 */
export let scheduleType;

if (languages === 'en') {
  scheduleType = Object.freeze({
    operating: 'Operating',
    closed: 'Closed',
    extraHours: 'Extra Hours',
  });
} else if (languages === 'nl') {
  scheduleType = Object.freeze({
    operating: 'Geopend',
    closed: 'Gesloten',
    extraHours: 'Aparte openstelling',
  });
} else if (languages === 'de') {
  scheduleType = Object.freeze({
    operating: 'Geöffnet',
    closed: 'Geschlossen',
    extraHours: 'Extra Stunden',
  });
} else if (languages === 'fr') {
  scheduleType = Object.freeze({
    operating: 'Ouvert',
    closed: 'Fermé',
    extraHours: 'Heures supplémentaires',
  });
}

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
    static: 'Static',
  });
} else if (languages === 'nl') {
  entityType = Object.freeze({
    ride: 'Attractie',
    show: 'Show',
    merchandise: 'Merchandise',
    restaurant: 'Restaurant',
    fairytale: 'Sprookje',
    service: 'Service',
    static: 'Static',
  });
} else if (languages === 'de') {
  entityType = Object.freeze({
    ride: 'Attraktion',
    show: 'Show',
    merchandise: 'Merchandise',
    restaurant: 'Restaurant',
    fairytale: 'Märchen',
    service: 'Service',
    static: 'Static',
  });
} else if (languages === 'fr') {
  entityType = Object.freeze({
    ride: 'Attraction',
    show: 'Show',
    merchandise: 'Merchandise',
    restaurant: 'Restaurant',
    fairytale: 'conte de fées',
    service: 'Service',
    static: 'Static',
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

/**
 * Possible types of fastpass statusses
 * @enum
 */
export let fastPassStatus;

if (languages === 'en') {
  fastPassStatus = Object.freeze({
    available: 'Available',
    temporarilyFull: 'Temporarily Full',
    finished: 'Full & Closed',
  });
} else if (languages === 'nl') {
  fastPassStatus = Object.freeze({
    available: 'Beschikbaar',
    temporarilyFull: 'Tijdelijk vol',
    finished: 'Vol & Gesloten',
  });
} else if (languages === 'de') {
  fastPassStatus = Object.freeze({
    available: 'Verfügbar',
    temporarilyFull: 'Vorübergehend Voll',
    finished: 'Voll und Geschlossen',
  });
} else if (languages === 'fr') {
  fastPassStatus = Object.freeze({
    available: 'Disponible',
    temporarilyFull: 'Temporairement plein',
    finished: 'Plein & Fermé',
  });
}
