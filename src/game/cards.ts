import type { Card } from './types'

/**
 * Thèmes MOMO : catégories larges pour trouver des mots à l'oral.
 * Chaque thème est unique (vérifié par les tests).
 */
export const THEMES: ReadonlyArray<readonly [string, string]> = [
  ['Métier', '👷'],
  ['Animal', '🦊'],
  ['Pays', '🌍'],
  ['Ville', '🏙️'],
  ['Fruit', '🍓'],
  ['Légume', '🥕'],
  ['Sport', '⚽'],
  ['Instrument de musique', '🎸'],
  ['Vêtement', '👕'],
  ['Couleur', '🎨'],
  ['Prénom', '🙋'],
  ['Marque', '🏷️'],
  ['Film', '🎬'],
  ['Chanteur ou chanteuse', '🎤'],
  ['Personnage de fiction', '🧙'],
  ['Ustensile de cuisine', '🍳'],
  ['Meuble', '🛋️'],
  ['Partie du corps', '🦵'],
  ['Moyen de transport', '🚲'],
  ['Fleur', '🌷'],
  ['Arbre', '🌳'],
  ['Plat cuisiné', '🍲'],
  ['Dessert', '🍰'],
  ['Boisson', '🥤'],
  ['Fromage', '🧀'],
  ['Insecte', '🐞'],
  ['Oiseau', '🐦'],
  ['Poisson ou fruit de mer', '🐟'],
  ['Jeu de société', '🎲'],
  ['Jeu vidéo', '🎮'],
  ['Dessin animé', '📺'],
  ['Super-héros', '🦸'],
  ['Série télé', '🍿'],
  ['Outil', '🔧'],
  ['Matière scolaire', '📚'],
  ['Langue', '🗣️'],
  ['Monument', '🗼'],
  ['Fête ou célébration', '🎉'],
  ['Astre ou planète', '🪐'],
  ['Métal ou minéral', '⛏️'],
  ['Pierre précieuse', '💎'],
  ['Danse', '💃'],
  ['Émotion', '😍'],
  ['Maladie', '🤒'],
  ['Sportif célèbre', '🏅'],
  ['Écrivain', '✍️'],
  ['Peintre ou artiste', '🖼️'],
  ['Personnage historique', '👑'],
  ['Dieu ou créature mythologique', '⚡'],
  ['Créature fantastique', '🐉'],
  ['Pièce de la maison', '🏠'],
  ['Appareil électroménager', '🧺'],
  ['Objet de la salle de bain', '🛁'],
  ['Fourniture scolaire', '✏️'],
  ['Accessoire de mode', '👜'],
  ['Chaussure', '👟'],
  ['Coiffure', '💇'],
  ['Bijou', '💍'],
  ['Parfum ou odeur', '🌸'],
  ['Épice ou condiment', '🧂'],
  ['Céréale ou féculent', '🌾'],
  ['Viande ou charcuterie', '🥩'],
  ['Pâtisserie', '🥐'],
  ['Bonbon ou confiserie', '🍬'],
  ['Cocktail', '🍹'],
  ['Restaurant ou fast-food', '🍔'],
  ['Magasin ou commerce', '🏪'],
  ['Région française', '🇫🇷'],
  ['Fleuve ou rivière', '🏞️'],
  ['Montagne ou massif', '🏔️'],
  ['Île', '🏝️'],
  ['Capitale', '🏛️'],
  ['Mer ou océan', '🌊'],
  ['Phénomène météo', '⛈️'],
  ['Catastrophe naturelle', '🌋'],
  ['Mot de la plage', '🏖️'],
  ['Mot de la montagne', '🎿'],
  ['Mot de Noël', '🎄'],
  ['Mot d’Halloween', '🎃'],
  ['Mot du mariage', '💒'],
  ['Mot de l’école', '🏫'],
  ['Mot de l’hôpital', '🏥'],
  ['Mot du cirque', '🎪'],
  ['Mot de la ferme', '🐄'],
  ['Mot de la mer', '⚓'],
  ['Mot de l’espace', '🚀'],
  ['Mot du football', '🥅'],
  ['Mot du cinéma', '🎥'],
  ['Mot de l’informatique', '💻'],
  ['Mot de la musique', '🎵'],
  ['Mot de la cuisine', '👩‍🍳'],
  ['Mot du jardin', '🌻'],
  ['Mot du bricolage', '🪚'],
  ['Mot de la voiture', '🚗'],
  ['Mot de l’avion', '✈️'],
  ['Mot de la police', '🚓'],
  ['Mot du tribunal', '⚖️'],
  ['Mot de la banque', '🏦'],
  ['Mot du château fort', '🏰'],
  ['Mot des pirates', '🏴‍☠️'],
  ['Mot du camping', '⛺'],
  ['Mot de la forêt', '🌲'],
  ['Mot du désert', '🏜️'],
  ['Mot de la nuit', '🌙'],
  ['Mot du petit-déjeuner', '🥞'],
  ['Mot de l’anniversaire', '🎂'],
  ['Mot de la météo', '🌦️'],
  ['Mot du théâtre', '🎭'],
  ['Mot de la religion', '⛪'],
  ['Mot de la politique', '🗳️'],
  ['Mot de la science', '🔬'],
  ['Mot des mathématiques', '➗'],
  ['Mot de la médecine', '🩺'],
  ['Mot de la mode', '🕶️'],
  ['Mot du bébé', '🍼'],
  ['Mot de l’amour', '❤️'],
  ['Mot de la guerre', '🪖'],
  ['Mot de la magie', '🪄'],
  ['Mot du sommeil', '😴'],
  ['Mot du voyage', '🧳'],
  ['Chose ronde', '⚪'],
  ['Chose qui pique', '🌵'],
  ['Chose qui colle', '🍯'],
  ['Chose qui fait du bruit', '📢'],
  ['Chose froide', '🧊'],
  ['Chose chaude', '🔥'],
  ['Chose jaune', '🟡'],
  ['Chose rouge', '🔴'],
  ['Chose verte', '🟢'],
  ['Chose qui vole', '🪁'],
  ['Chose qui roule', '🛞'],
  ['Chose qui se mange', '🍽️'],
  ['Chose qu’on trouve dans un sac', '🎒'],
  ['Chose qu’on trouve dans un frigo', '🥶'],
  ['Chose plus grande qu’un éléphant', '🐘'],
  ['Chose plus petite qu’une souris', '🐭'],
  ['Verbe d’action', '🏃'],
  ['Adjectif', '✨'],
  ['Mot anglais utilisé en français', '💬'],
  ['Onomatopée', '💥'],
  ['Juron ou gros mot gentil', '🤬'],
  ['Mot de la Bretagne', '🥞'],
]

/** Lettres bleues (obligatoires) : chaque lettre, avec un doublon pour les plus courantes */
export const BLUE_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
export const BLUE_DOUBLES = 'AEIORSTNLU'.split('')
/** Lettres rouges (interdites) : lettres fréquentes, sinon la contrainte serait triviale */
export const RED_LETTERS = 'ABCDEFGHILMNOPRSTUV'.split('')

export const SPECIAL_COUNTS = { english: 6, inversion: 5, flash: 6 } as const

function slug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function buildCards(): Card[] {
  const cards: Card[] = []
  for (const l of BLUE_LETTERS) cards.push({ id: `blue-${l}-1`, kind: 'blue', letter: l })
  for (const l of BLUE_DOUBLES) cards.push({ id: `blue-${l}-2`, kind: 'blue', letter: l })
  for (const l of RED_LETTERS) cards.push({ id: `red-${l}`, kind: 'red', letter: l })
  for (const [theme, emoji] of THEMES) cards.push({ id: `theme-${slug(theme)}`, kind: 'theme', theme, emoji })
  for (let i = 1; i <= SPECIAL_COUNTS.english; i++) cards.push({ id: `english-${i}`, kind: 'english' })
  for (let i = 1; i <= SPECIAL_COUNTS.inversion; i++) cards.push({ id: `inversion-${i}`, kind: 'inversion' })
  for (let i = 1; i <= SPECIAL_COUNTS.flash; i++) cards.push({ id: `flash-${i}`, kind: 'flash' })
  return cards
}

export const ALL_CARDS: ReadonlyArray<Card> = buildCards()

export const CARD_BY_ID: ReadonlyMap<string, Card> = new Map(ALL_CARDS.map((c) => [c.id, c]))

export function getCard(id: string): Card {
  const c = CARD_BY_ID.get(id)
  if (!c) throw new Error(`Carte inconnue : ${id}`)
  return c
}
