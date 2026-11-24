import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { STORAGE_KEY } from './game/store'

function setup() {
  const user = userEvent.setup({ delay: null })
  const utils = render(<App />)
  return { user, ...utils }
}

/** Avance les faux timers par paliers (les décomptes enchaînent un timer par rendu). */
async function flush(ms = 0, step = 250) {
  for (let t = 0; t <= ms; t += step) {
    await act(async () => {
      vi.advanceTimersByTime(Math.min(step, ms))
    })
  }
}

function collectedOf(name: string): number {
  return Number(within(screen.getByTestId(`score-${name}`)).getByTestId('collected').textContent)
}

async function createGame(user: ReturnType<typeof userEvent.setup>, mode: RegExp, names: string[]) {
  await user.click(screen.getByRole('button', { name: /nouvelle partie/i }))
  await user.click(screen.getByRole('button', { name: mode }))
  // Ajuste le nombre de joueurs
  let inputs = screen.getAllByRole('textbox')
  while (inputs.length < names.length) {
    await user.click(screen.getByRole('button', { name: /ajouter un joueur/i }))
    inputs = screen.getAllByRole('textbox')
  }
  while (inputs.length > names.length) {
    await user.click(screen.getAllByRole('button', { name: /retirer/i })[0])
    inputs = screen.getAllByRole('textbox')
  }
  for (let i = 0; i < names.length; i++) {
    await user.clear(inputs[i])
    await user.type(inputs[i], names[i])
  }
  await user.click(screen.getByRole('button', { name: /lancer la partie/i }))
}

async function reveal(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /retourner les cartes/i }))
  await flush(3000)
}

beforeEach(() => {
  // Graine fixe : le tirage des cartes est reproductible d'une exécution à l'autre
  vi.spyOn(Math, 'random').mockReturnValue(0.42)
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('parcours règle officielle', () => {
  it('crée les joueurs, joue plusieurs tours avec malus et relances', async () => {
    const { user } = setup()
    expect(screen.getByLabelText('MOMO')).toBeInTheDocument()
    await createGame(user, /règle officielle/i, ['Alice', 'Bob', 'Carl'])

    expect(screen.getByTestId('game-subtitle')).toHaveTextContent('Manche 1')
    expect(screen.getByTestId('score-Alice')).toBeInTheDocument()

    // Tour 1 : 3 cartes retournées, Bob ramasse
    await reveal(user)
    expect(screen.getAllByTestId('momo-card')).toHaveLength(3)
    expect(screen.getByTestId('constraints')).toBeInTheDocument()
    expect(screen.getByTestId('game-subtitle')).toHaveTextContent('Tour 1')
    await user.click(screen.getByRole('button', { name: /qui ramasse 3 cartes/i }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Bob/ }))
    expect(collectedOf('Bob')).toBe(3)

    // Tour 2 : personne ne trouve → nouvelles cartes, 6 en jeu
    await reveal(user)
    await user.click(screen.getByRole('button', { name: /personne ne trouve/i }))
    expect(screen.getByText(/nouvelles cartes/i)).toBeInTheDocument()
    expect(screen.getByText(/6 cartes en jeu/i)).toBeInTheDocument()

    // Alice ramasse ; Bob a répondu en premier et donne une carte à Carl
    await user.click(screen.getByRole('button', { name: /qui ramasse 6 cartes/i }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Alice/ }))
    expect(screen.getByText(/qui a répondu en premier/i)).toBeInTheDocument()
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Bob/ }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Carl/ }))
    expect(collectedOf('Alice')).toBe(6)
    expect(collectedOf('Bob')).toBe(2)
    expect(collectedOf('Carl')).toBe(1)

    // Annuler revient à l'état précédent
    await user.click(screen.getByRole('button', { name: /annuler la dernière action/i }))
    expect(collectedOf('Alice')).toBe(0)
  })

  it('joue une partie complète à 2 joueurs au clavier jusqu’au Roi du MOMO', async () => {
    const { user } = setup()
    await createGame(user, /règle officielle/i, ['Alice', 'Bob'])
    expect(screen.getByText(/2 piles/i)).toBeInTheDocument()

    let guard = 0
    while (!screen.queryByTestId('winner-title') && guard++ < 200) {
      if (screen.queryByRole('button', { name: /retourner les cartes/i })) {
        await user.keyboard(' ')
        await flush(3000)
        expect(screen.getAllByTestId('momo-card')).toHaveLength(4)
        await user.keyboard(' ') // ouvre « Qui ramasse ? » ou « Flash »
        await user.keyboard('1') // Alice
      } else if (screen.queryByRole('button', { name: /manche suivante/i })) {
        expect(screen.getByTestId('round-headline')).toHaveTextContent('Bob gagne la manche')
        await user.keyboard('{Enter}')
      } else {
        throw new Error('État inattendu')
      }
    }
    expect(screen.getByTestId('winner-title')).toHaveTextContent('Bob devient le Roi du MOMO')

    // Rejouer relance une partie avec les mêmes joueurs
    await user.click(screen.getByRole('button', { name: /rejouer/i }))
    expect(screen.getByTestId('game-subtitle')).toHaveTextContent('Manche 1')
    expect(collectedOf('Alice')).toBe(0)
  })
})

describe('parcours mode survie', () => {
  it('élimine un joueur en fin de manche', async () => {
    const { user } = setup()
    await createGame(user, /mode survie/i, ['Alice', 'Bob', 'Carl', 'Dina'])
    for (let t = 0; t < 7; t++) {
      await user.keyboard(' ')
      await flush(3000)
      await user.keyboard(' ')
      await user.keyboard('4') // Dina ramasse
      if (screen.queryByText(/qui a répondu en premier/i)) await user.click(screen.getByRole('button', { name: /pas de malus/i }))
    }
    expect(screen.getByTestId('round-headline')).toHaveTextContent('Dina est éliminé')
    await user.click(screen.getByRole('button', { name: /manche suivante/i }))
    expect(screen.getByTestId('score-Dina')).toHaveClass('opacity-45')
  })
})

describe('parcours variante tranquille', () => {
  it('pioche, réussite, échec et chrono 15 s', async () => {
    const { user } = setup()
    await createGame(user, /variante tranquille/i, ['Alice', 'Bob', 'Carl'])
    expect(screen.getByTestId('current-player')).toHaveTextContent('Alice')

    await user.click(screen.getByRole('button', { name: /pioche une carte/i }))
    expect(screen.getAllByTestId('momo-card')).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: /trouvé !/i }))
    expect(screen.getByTestId('current-player')).toHaveTextContent('Bob')

    await user.click(screen.getByRole('button', { name: /pioche une carte/i }))
    expect(screen.getAllByTestId('momo-card')).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: /raté/i }))
    expect(collectedOf('Bob')).toBe(2)
    expect(screen.getByTestId('current-player')).toHaveTextContent('Carl')

    // Chrono : Alice lance, le temps s'écoule → Carl ramasse
    await user.click(screen.getByRole('button', { name: /pioche une carte/i }))
    await user.click(screen.getByRole('button', { name: /chrono 15 s/i }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Alice/ }))
    expect(screen.getByTestId('chrono-left')).toHaveTextContent('15')
    for (let i = 0; i < 16; i++) await flush(1000)
    await user.click(screen.getByRole('button', { name: /temps écoulé/i }))
    expect(collectedOf('Carl')).toBe(1)

    // Chrono : Bob lance sur Alice, elle trouve → Bob ramasse
    await user.click(screen.getByRole('button', { name: /pioche une carte/i }))
    await user.click(screen.getByRole('button', { name: /chrono 15 s/i }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Bob/ }))
    await flush(3000)
    await user.click(screen.getByRole('button', { name: /a trouvé/i }))
    expect(collectedOf('Bob')).toBe(3)
  })
})

describe('sauvegarde et règles', () => {
  it('restaure la partie après un rafraîchissement', async () => {
    const { user, unmount } = setup()
    await createGame(user, /règle officielle/i, ['Alice', 'Bob', 'Carl'])
    await reveal(user)
    await user.click(screen.getByRole('button', { name: /qui ramasse|flash/i }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Carl/ }))
    expect(localStorage.getItem(STORAGE_KEY)).toContain('"mode":"classic"')
    unmount()

    render(<App />)
    expect(screen.getByTestId('game-subtitle')).toHaveTextContent('Tour 1')
    expect(collectedOf('Carl')).toBe(3)
    await user.click(screen.getByRole('button', { name: /accueil/i }))
    expect(screen.getByRole('button', { name: /reprendre la partie/i })).toBeInTheDocument()
  })

  it('affiche la modale des règles', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /règles du jeu/i }))
    const dialog = screen.getByRole('dialog', { name: /règles du momo/i })
    expect(within(dialog).getByText(/roi du momo/i)).toBeInTheDocument()
    expect(within(dialog).getByText(/mode survie/i)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: /fermer/i }))
    await flush(500)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('valide le nombre de joueurs selon le mode', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /nouvelle partie/i }))
    await user.click(screen.getByRole('button', { name: /mode survie/i }))
    expect(screen.getByRole('alert')).toHaveTextContent('de 4 à 6 joueurs')
    expect(screen.getByRole('button', { name: /lancer la partie/i })).toBeDisabled()
  })
})
