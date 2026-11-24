import { describe, expect, it } from 'vitest'
import { initialState, loadState, reducer, saveState, STORAGE_KEY, type AppState } from './store'
import { makePlayers } from './testUtils'

function started(mode: 'classic' | 'tranquille' = 'classic'): AppState {
  return reducer(initialState, { type: 'START', setup: { mode, players: makePlayers(3) }, seed: 123 })
}

describe('reducer', () => {
  it('démarre une partie et passe à l’écran de jeu', () => {
    const s = started()
    expect(s.screen).toBe('game')
    expect(s.game?.mode).toBe('classic')
    expect(s.lastSetup?.players).toHaveLength(3)
  })

  it('enchaîne retournement et résolution, et permet d’annuler', () => {
    let s = reducer(started(), { type: 'REVEAL' })
    expect(s.game && s.game.mode !== 'tranquille' && s.game.phase).toBe('play')
    s = reducer(s, { type: 'RESOLVE', resolution: { loser: 'p1' } })
    expect(s.game?.collected.p1).toBe(3)
    expect(s.history).toHaveLength(2)
    s = reducer(s, { type: 'UNDO' })
    expect(s.game?.collected.p1).toBe(0)
    s = reducer(s, { type: 'UNDO' })
    s = reducer(s, { type: 'UNDO' })
    expect(s.history).toHaveLength(0)
  })

  it('n’ajoute rien à l’historique si l’action est sans effet', () => {
    const s = reducer(started(), { type: 'RESOLVE', resolution: { loser: 'p1' } })
    expect(s.history).toHaveLength(0)
  })

  it('ignore les actions d’un autre mode', () => {
    const s = started('tranquille')
    expect(reducer(s, { type: 'REVEAL' })).toBe(s)
    const t = reducer(s, { type: 'T_DRAW' })
    expect(t.game?.mode === 'tranquille' && t.game.stack).toHaveLength(1)
    expect(reducer(started(), { type: 'T_DRAW' }).history).toHaveLength(0)
  })

  it('active / coupe le son', () => {
    expect(reducer(initialState, { type: 'TOGGLE_SOUND' }).settings.sound).toBe(false)
  })
})

describe('sauvegarde localStorage', () => {
  it('sauvegarde et restaure la partie en cours', () => {
    const s = reducer(started(), { type: 'REVEAL' })
    saveState(s)
    const loaded = loadState()
    expect(loaded.screen).toBe('game')
    expect(loaded.game).toEqual(s.game)
    expect(loaded.history).toEqual([])
  })

  it('retombe sur l’état initial si la sauvegarde est absente ou corrompue', () => {
    expect(loadState()).toEqual(initialState)
    localStorage.setItem(STORAGE_KEY, '{oops')
    expect(loadState()).toEqual(initialState)
  })
})
