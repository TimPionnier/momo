import type { ReactNode } from 'react'
import { MomoCard } from './MomoCard'
import { Modal } from './Modal'
import type { Card } from '../game/types'

const EXAMPLES: { card: Card; title: string; text: string }[] = [
  { card: { id: 'ex-blue', kind: 'blue', letter: 'F' }, title: 'Lettre obligatoire', text: 'Le mot doit contenir cette lettre. Les mêmes lettres bleues se cumulent (F + F : « falafel »).' },
  { card: { id: 'ex-red', kind: 'red', letter: 'D' }, title: 'Lettre interdite', text: 'Le mot ne doit pas contenir cette lettre. Rouge + bleu sur la même lettre : les deux s’annulent.' },
  { card: { id: 'ex-theme', kind: 'theme', theme: 'Métier', emoji: '👷' }, title: 'Thème', text: 'Le mot doit appartenir au thème. Avec 2 thèmes, il suffit d’en respecter un.' },
  { card: { id: 'ex-en', kind: 'english' }, title: 'Accent anglais', text: 'Dites votre mot avec l’accent anglais.' },
  { card: { id: 'ex-inv', kind: 'inversion' }, title: 'Inversion', text: 'Les lettres bleues deviennent interdites, les rouges obligatoires. 2 inversions = pas d’inversion.' },
  { card: { id: 'ex-flash', kind: 'flash' }, title: 'Flash', text: 'Le 1er qui répond arrête le tour et donne les cartes en jeu à qui il veut.' },
]

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="mb-2 font-display text-xl tracking-wide text-momo-blue-light">{title}</h3>
      <div className="space-y-2 text-[15px] leading-relaxed text-white/90 sm:text-base">{children}</div>
    </section>
  )
}

export function RulesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Règles du MOMO" wide>
      <Section title="La règle officielle (2 à 6 joueurs)">
        <p>Chaque joueur a une pile de <b>12 cartes</b> face cachée (l’appli les gère pour vous).</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Tout le monde retourne une carte <b>en même temps</b> : l’appli les affiche au centre.</li>
          <li>Chacun cherche un mot qui respecte <b>toutes</b> les contraintes et le <b>crie</b> dès qu’il l’a.</li>
          <li><b>Le dernier à crier un mot, ou le premier qui se trompe</b>, ramasse toutes les cartes du tour.</li>
          <li>Le premier à avoir répondu donne en malus une de ses cartes ramassées (s’il en a) à qui il veut.</li>
        </ol>
        <p>
          <b>Fin de manche</b> quand toutes les piles sont vides : celui qui a ramassé le <b>moins de cartes</b> gagne la manche.
          Le premier à <b>3 manches</b> devient le <span className="text-momo-yellow">Roi du MOMO</span> !
        </p>
        <p><b>À 2 joueurs :</b> chacun a 2 piles de 11 cartes, pose 2 cartes par tour, et il faut trouver <b>2 mots</b> (un par groupe de cartes).</p>
      </Section>

      <Section title="Les cartes">
        <div className="grid gap-3 sm:grid-cols-2">
          {EXAMPLES.map((e) => (
            <div key={e.card.id} className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
              <MomoCard card={e.card} size="sm" flip={false} />
              <div>
                <div className="font-bold">{e.title}</div>
                <div className="text-sm text-white/75">{e.text}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Précisions & cas spéciaux">
        <ul className="list-disc space-y-1 pl-5">
          <li>Interdit d’utiliser 2 mots de même racine dans un même tour (ex : chant & chanter).</li>
          <li>Le mot doit être français ; il peut être accordé et conjugué. Noms propres et mots composés acceptés.</li>
          <li>Si 2 joueurs disent le même mot en même temps, les 2 réponses sont acceptées.</li>
          <li>Si vous vous trompez mais que personne ne le remarque, tant mieux pour vous !</li>
          <li><b>Personne ne trouve :</b> chacun ajoute une carte sur la sienne, on joue avec les nouvelles cartes, le perdant ramasse tout.</li>
          <li><b>Plusieurs sèchent :</b> tout le monde remet une carte, mais ceux qui ont déjà trouvé ne jouent plus ce tour.</li>
        </ul>
      </Section>

      <Section title="Mode Survie (4 à 6 joueurs)">
        <p>7 cartes par joueur. À la fin de chaque manche, le joueur qui a <b>le plus de cartes est éliminé</b>. En cas d’égalité : mort subite à 1 carte entre les ex æquo (celui qui ramasse est éliminé).</p>
        <p>Quand il ne reste que 2 joueurs, <b>finale</b> : 2 piles de 5 cartes chacun, 2 cartes par tour, 2 mots à trouver. Le gagnant remporte la partie !</p>
      </Section>

      <Section title="Mode Équipe (4 ou 6 joueurs)">
        <p>2 équipes. On joue normalement mais les cartes ramassées se comptent <b>par équipe</b>. L’équipe qui en ramasse le moins gagne la manche ; la première à 3 manches gagne.</p>
      </Section>

      <Section title="Variante plus tranquille (2 à 8 joueurs)">
        <p>Une pioche commune. À son tour, un joueur pioche une carte, la pose sur les précédentes et annonce un mot qui respecte <b>toutes les cartes accumulées</b>.</p>
        <p>S’il réussit, son voisin de gauche joue. Le premier qui faute ou sèche ramasse la pile ; son voisin recommence de zéro.</p>
        <p>La partie s’arrête quand la <b>2ᵉ carte Flash</b> est piochée (on finit le tour en cours). Le moins de cartes gagne.</p>
        <p><b>Chrono !</b> Pendant le tour d’un joueur, lancez un décompte de 15 secondes : s’il ne trouve pas, il ramasse ; s’il trouve, c’est vous qui ramassez. Silence pendant le décompte !</p>
      </Section>

      <Section title="Raccourcis clavier">
        <p><kbd className="rounded bg-white/15 px-1.5">Espace</kbd> / <kbd className="rounded bg-white/15 px-1.5">Entrée</kbd> action principale · <kbd className="rounded bg-white/15 px-1.5">1</kbd>–<kbd className="rounded bg-white/15 px-1.5">9</kbd> choisir un joueur · <kbd className="rounded bg-white/15 px-1.5">U</kbd> annuler · <kbd className="rounded bg-white/15 px-1.5">R</kbd> règles · <kbd className="rounded bg-white/15 px-1.5">Échap</kbd> fermer</p>
      </Section>
    </Modal>
  )
}
