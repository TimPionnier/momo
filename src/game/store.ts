import { createClassicGame, nextRound, relaunchTurn, resolveFlash, resolveTurn, revealTurn, type Resolution } from './classic'
import { chronoTranquille, createTranquilleGame, drawTranquille, failTranquille, succeedTranquille } from './tranquille'
import type { ClassicGame, Game, Mode, Player, Settings, TranquilleGame } from './types'

export type Screen = 'home' | 'setup' | 'game'

export interface SetupConfig {
  mode: Mode
  players: Player[]
}

export interface AppState {
  screen: Screen
  game: Game | null
  settings: Settings
  lastSetup: SetupConfig | null
  /** Historique pour « Annuler » (non sauvegardé) */
  history: Game[]
}

export type Action =
  | { type: 'GO_HOME' }
  | { type: 'GO_SETUP' }
  | { type: 'RESUME' }
  | { type: 'START'; setup: SetupConfig; seed: number }
  | { type: 'REVEAL' }
  | { type: 'RELAUNCH'; stillIn?: string[] }
  | { type: 'RESOLVE'; resolution: Resolution }
  | { type: 'FLASH'; target: string }
  | { type: 'NEXT_ROUND' }
  | { type: 'T_DRAW' }
  | { type: 'T_SUCCESS' }
  | { type: 'T_FAIL' }
  | { type: 'T_CHRONO'; launcher: string; found: boolean }
  | { type: 'UNDO' }
  | { type: 'TOGGLE_SOUND' }

export const STORAGE_KEY = 'momo-companion-v1'
const HISTORY_LIMIT = 20

export const initialState: AppState = {
  screen: 'home',
  game: null,
  settings: { sound: true },
  lastSetup: null,
  history: [],
}

function updateClassic(state: AppState, fn: (g: ClassicGame) => ClassicGame): AppState {
  const g = state.game
  if (!g || g.mode === 'tranquille') return state
  const next = fn(g)
  if (next === g) return state
  return { ...state, game: next, history: [...state.history, g].slice(-HISTORY_LIMIT) }
}

function updateTranquille(state: AppState, fn: (g: TranquilleGame) => TranquilleGame): AppState {
  const g = state.game
  if (!g || g.mode !== 'tranquille') return state
  const next = fn(g)
  if (next === g) return state
  return { ...state, game: next, history: [...state.history, g].slice(-HISTORY_LIMIT) }
}

export function createGame(setup: SetupConfig, seed: number): Game {
  return setup.mode === 'tranquille'
    ? createTranquilleGame(setup.players, seed)
    : createClassicGame(setup.mode, setup.players, seed)
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'GO_HOME':
      return { ...state, screen: 'home' }
    case 'GO_SETUP':
      return { ...state, screen: 'setup' }
    case 'RESUME':
      return state.game ? { ...state, screen: 'game' } : state
    case 'START':
      return {
        ...state,
        screen: 'game',
        game: createGame(action.setup, action.seed),
        lastSetup: action.setup,
        history: [],
      }
    case 'REVEAL':
      return updateClassic(state, revealTurn)
    case 'RELAUNCH':
      return updateClassic(state, (g) => relaunchTurn(g, action.stillIn))
    case 'RESOLVE':
      return updateClassic(state, (g) => resolveTurn(g, action.resolution))
    case 'FLASH':
      return updateClassic(state, (g) => resolveFlash(g, action.target))
    case 'NEXT_ROUND':
      return updateClassic(state, nextRound)
    case 'T_DRAW':
      return updateTranquille(state, drawTranquille)
    case 'T_SUCCESS':
      return updateTranquille(state, succeedTranquille)
    case 'T_FAIL':
      return updateTranquille(state, failTranquille)
    case 'T_CHRONO':
      return updateTranquille(state, (g) => chronoTranquille(g, action.launcher, action.found))
    case 'UNDO': {
      if (state.history.length === 0) return state
      return { ...state, game: state.history[state.history.length - 1], history: state.history.slice(0, -1) }
    }
    case 'TOGGLE_SOUND':
      return { ...state, settings: { ...state.settings, sound: !state.settings.sound } }
  }
}

type Persisted = Pick<AppState, 'screen' | 'game' | 'settings' | 'lastSetup'>

export function saveState(state: AppState, storage: Storage = localStorage): void {
  try {
    const data: Persisted = { screen: state.screen, game: state.game, settings: state.settings, lastSetup: state.lastSetup }
    storage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* stockage indisponible (navigation privée…) : on continue sans sauvegarde */
  }
}

export function loadState(storage: Storage = localStorage): AppState {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return initialState
    const data = JSON.parse(raw) as Partial<Persisted>
    return {
      ...initialState,
      screen: data.game && data.screen === 'game' ? 'game' : data.screen === 'setup' ? 'setup' : 'home',
      game: data.game ?? null,
      settings: { ...initialState.settings, ...data.settings },
      lastSetup: data.lastSetup ?? null,
    }
  } catch {
    return initialState
  }
}
