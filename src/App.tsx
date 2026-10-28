import { useEffect, useState } from 'react';
import { t } from '@/shared/i18n';
import { useKeyboardShortcuts } from '@/shared/useKeyboardShortcuts';
import { LanguageSwitch } from '@/ui';
import { ReactionDiffusion2D } from '@/view2d/ReactionDiffusion2D';
import { ReactionDiffusion3D } from '@/view3d/ReactionDiffusion3D';
import styles from './App.module.css';

/** Screens in the menu. Saved in the URL # so a reload opens the same screen */
const MODES = [
  {
    id: '2d',
    name: '2D',
    description: { ja: '平らな皿に広がる模様', en: 'Patterns spreading in a flat dish' },
  },
  {
    id: '3d',
    name: '3D',
    description: { ja: '立方体の中に育つ模様', en: 'Patterns growing inside a cube' },
  },
] as const;

type Mode = (typeof MODES)[number]['id'];

/** Gets the screen from the URL #. Uses 2D if the value is unknown */
function modeFromHash(): Mode {
  return MODES.find((item) => `#${item.id}` === location.hash)?.id ?? '2d';
}

/** The screen for each menu item */
const SCREENS = { '2d': ReactionDiffusion2D, '3d': ReactionDiffusion3D } satisfies Record<
  Mode,
  () => React.JSX.Element
>;

export function App() {
  const [mode, setMode] = useState(modeFromHash);

  // Watch # changes, so the browser's back and forward buttons also switch screens
  useEffect(() => {
    const onHashChange = () => setMode(modeFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const choose = (next: Mode) => {
    location.hash = next;
  };

  const Screen = SCREENS[mode];

  useKeyboardShortcuts({
    // M goes to the next screen in the menu, and back to the first after the last
    KeyM: () => choose(MODES[(MODES.findIndex((item) => item.id === mode) + 1) % MODES.length].id),
  });

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Reaction-Diffusion</h1>
        <nav className={styles.menu} title={t({ ja: 'M で切り替え', en: 'Press M to switch' })}>
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === mode ? `${styles.tab} ${styles.current}` : styles.tab}
              onClick={() => choose(item.id)}
            >
              <span className={styles.tabName}>{item.name}</span>
              <span className={styles.tabDescription}>{t(item.description)}</span>
            </button>
          ))}
        </nav>
        <LanguageSwitch className={styles.langs} />
      </header>
      <main className={styles.main}>
        <Screen />
      </main>
    </div>
  );
}
