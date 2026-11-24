import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useReducer, useState } from 'react'
import { GameHeader } from './components/GameHeader'
import { RulesModal } from './components/RulesModal'
import { randomSeed } from './game/rng'
import { loadState, reducer, saveState, type SetupConfig } from './game/store'
import { useHotkeys } from './hooks/useHotkeys'
import { ClassicScreen, classicSubtitle } from './screens/ClassicScreen'
import { Home } from './screens/Home'
import { Setup } from './screens/Setup'
import { TranquilleScreen, tranquilleSubtitle } from './screens/TranquilleScreen'

const pageTransition = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.25 },
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, () => loadState())
  const [rulesOpen, setRulesOpen] = useState(false)

  useEffect(() => {
    saveState(state)
  }, [state])

  const { game, settings } = state
  const sound = settings.sound

  useHotkeys(
    {
      r: () => setRulesOpen((o) => !o),
      u: () => dispatch({ type: 'UNDO' }),
    },
    state.screen === 'game',
  )

  const start = (setup: SetupConfig) => dispatch({ type: 'START', setup, seed: randomSeed() })
  const replay = () => state.lastSetup && start(state.lastSetup)
  const goHome = () => dispatch({ type: 'GO_HOME' })

  return (
    <div className="min-h-dvh">
      <AnimatePresence mode="wait">
        {state.screen === 'home' && (
          <motion.div key="home" {...pageTransition}>
            <Home
              canResume={!!game && game.phase !== 'gameOver'}
              onResume={() => dispatch({ type: 'RESUME' })}
              onNew={() => dispatch({ type: 'GO_SETUP' })}
              onRules={() => setRulesOpen(true)}
            />
          </motion.div>
        )}

        {state.screen === 'setup' && (
          <motion.div key="setup" {...pageTransition}>
            <Setup initial={state.lastSetup} onBack={goHome} onStart={start} />
          </motion.div>
        )}

        {state.screen === 'game' && game && (
          <motion.div key="game" {...pageTransition} className="mx-auto max-w-7xl px-4">
            <GameHeader
              subtitle={game.mode === 'tranquille' ? tranquilleSubtitle(game) : classicSubtitle(game)}
              sound={sound}
              canUndo={state.history.length > 0}
              onUndo={() => dispatch({ type: 'UNDO' })}
              onToggleSound={() => dispatch({ type: 'TOGGLE_SOUND' })}
              onRules={() => setRulesOpen(true)}
              onHome={goHome}
            />
            {game.mode === 'tranquille' ? (
              <TranquilleScreen
                game={game}
                sound={sound}
                modalOpen={rulesOpen}
                onDraw={() => dispatch({ type: 'T_DRAW' })}
                onSuccess={() => dispatch({ type: 'T_SUCCESS' })}
                onFail={() => dispatch({ type: 'T_FAIL' })}
                onChrono={(launcher, found) => dispatch({ type: 'T_CHRONO', launcher, found })}
                onReplay={replay}
                onHome={goHome}
              />
            ) : (
              <ClassicScreen
                game={game}
                sound={sound}
                modalOpen={rulesOpen}
                onReveal={() => dispatch({ type: 'REVEAL' })}
                onRelaunch={(stillIn) => dispatch({ type: 'RELAUNCH', stillIn })}
                onResolve={(resolution) => dispatch({ type: 'RESOLVE', resolution })}
                onFlash={(target) => dispatch({ type: 'FLASH', target })}
                onNextRound={() => dispatch({ type: 'NEXT_ROUND' })}
                onReplay={replay}
                onHome={goHome}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  )
}
