import confetti from 'canvas-confetti'

const COLORS = ['#ffc533', '#e5345f', '#1d7fd0', '#3eb0ee', '#ffffff']

export function celebrate(): void {
  try {
    const end = Date.now() + 1800
    const frame = () => {
      confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors: COLORS })
      confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors: COLORS })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    confetti({ particleCount: 140, spread: 100, origin: { y: 0.55 }, colors: COLORS })
    frame()
  } catch {
    /* canvas indisponible */
  }
}
