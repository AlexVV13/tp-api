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
 * Possible types of categories
 * @enum
 */
export const entityCategory = Object.freeze({
  youngest: 'Youngest_Ones',
  family: 'Family',
  thrill: 'Thrillseekers',
});

/**
 * Possible types of tags
 * @enum
 */
export const entityTags = Object.freeze({
  wet: 'mayGetWet',
  scary: 'mayBeScary',
  pregnant: 'unsuitableForPregnantWomen',
  weelchair: 'notAccesableWithWeelchair',
  childSwap: 'babySwap',
  dizzy: 'mayGetDizzy',
  outdoor: 'OutdoorRide',
  indoor: 'IndoorRide',
  both: 'SemiCovered',
  injured: 'unsuitableWithInjuries',
  transfer: 'tranferNecessary',
  onridePhoto: 'onridePhoto',
});
