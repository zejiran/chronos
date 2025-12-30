import { For, createSignal } from 'solid-js';
import { css } from '../../../styled-system/css';
import {
  useTheme,
  ThemeName,
  ThemeMode,
  Density,
  THEME_PALETTES,
} from '../../lib/theme';

export function ThemeSelector() {
  const { settings, setTheme, setThemeMode, setDensity, toggleHighContrast, toggleReducedMotion } = useTheme();

  const themes = Object.entries(THEME_PALETTES) as [ThemeName, { name: string; preview: string[] }][];
  const modes: { value: ThemeMode; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];
  const densities: { value: Density; label: string }[] = [
    { value: 'compact', label: 'Compact' },
    { value: 'comfortable', label: 'Comfortable' },
    { value: 'spacious', label: 'Spacious' },
  ];

  return (
    <div class={css({
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      padding: '1rem',
    })}>
      {/* Theme Selection */}
      <section>
        <h3 class={css({
          fontSize: '0.875rem',
          fontWeight: '600',
          color: 'var(--colors-foreground)',
          marginBottom: '0.75rem',
        })}>
          Theme
        </h3>
        <div class={css({
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem',
        })}>
          <For each={themes}>
            {([key, { name, preview }]) => (
              <button
                type="button"
                onClick={() => setTheme(key)}
                class={css({
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '2px solid',
                  borderColor: settings().theme === key ? 'var(--colors-primary)' : 'var(--colors-border)',
                  backgroundColor: settings().theme === key ? 'var(--colors-muted)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    borderColor: 'var(--colors-primary)',
                  },
                })}
              >
                <div class={css({
                  display: 'flex',
                  gap: '0.25rem',
                })}>
                  <For each={preview}>
                    {(color) => (
                      <div
                        style={{ 'background-color': color }}
                        class={css({
                          width: '1rem',
                          height: '1rem',
                          borderRadius: '0.25rem',
                        })}
                      />
                    )}
                  </For>
                </div>
                <span class={css({
                  fontSize: '0.75rem',
                  color: 'var(--colors-foreground)',
                })}>
                  {name}
                </span>
              </button>
            )}
          </For>
        </div>
      </section>

      {/* Mode Selection */}
      <section>
        <h3 class={css({
          fontSize: '0.875rem',
          fontWeight: '600',
          color: 'var(--colors-foreground)',
          marginBottom: '0.75rem',
        })}>
          Mode
        </h3>
        <div class={css({
          display: 'flex',
          gap: '0.5rem',
        })}>
          <For each={modes}>
            {({ value, label }) => (
              <button
                type="button"
                onClick={() => setThemeMode(value)}
                class={css({
                  flex: 1,
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: '1px solid',
                  borderColor: settings().mode === value ? 'var(--colors-primary)' : 'var(--colors-border)',
                  backgroundColor: settings().mode === value ? 'var(--colors-primary)' : 'transparent',
                  color: settings().mode === value ? 'white' : 'var(--colors-foreground)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    borderColor: 'var(--colors-primary)',
                  },
                })}
              >
                {label}
              </button>
            )}
          </For>
        </div>
      </section>

      {/* Density Selection */}
      <section>
        <h3 class={css({
          fontSize: '0.875rem',
          fontWeight: '600',
          color: 'var(--colors-foreground)',
          marginBottom: '0.75rem',
        })}>
          Density
        </h3>
        <div class={css({
          display: 'flex',
          gap: '0.5rem',
        })}>
          <For each={densities}>
            {({ value, label }) => (
              <button
                type="button"
                onClick={() => setDensity(value)}
                class={css({
                  flex: 1,
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: '1px solid',
                  borderColor: settings().density === value ? 'var(--colors-primary)' : 'var(--colors-border)',
                  backgroundColor: settings().density === value ? 'var(--colors-primary)' : 'transparent',
                  color: settings().density === value ? 'white' : 'var(--colors-foreground)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    borderColor: 'var(--colors-primary)',
                  },
                })}
              >
                {label}
              </button>
            )}
          </For>
        </div>
      </section>

      {/* Accessibility Options */}
      <section>
        <h3 class={css({
          fontSize: '0.875rem',
          fontWeight: '600',
          color: 'var(--colors-foreground)',
          marginBottom: '0.75rem',
        })}>
          Accessibility
        </h3>
        <div class={css({
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        })}>
          <label class={css({
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          })}>
            <span class={css({
              fontSize: '0.875rem',
              color: 'var(--colors-foreground)',
            })}>
              High contrast
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={settings().highContrast}
              onClick={toggleHighContrast}
              class={css({
                width: '2.5rem',
                height: '1.5rem',
                borderRadius: '0.75rem',
                backgroundColor: settings().highContrast ? 'var(--colors-primary)' : 'var(--colors-muted)',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background-color 0.15s ease',
              })}
            >
              <span
                class={css({
                  position: 'absolute',
                  top: '0.125rem',
                  width: '1.25rem',
                  height: '1.25rem',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  transition: 'left 0.15s ease',
                })}
                style={{
                  left: settings().highContrast ? '1.125rem' : '0.125rem',
                }}
              />
            </button>
          </label>

          <label class={css({
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          })}>
            <span class={css({
              fontSize: '0.875rem',
              color: 'var(--colors-foreground)',
            })}>
              Reduced motion
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={settings().reducedMotion}
              onClick={toggleReducedMotion}
              class={css({
                width: '2.5rem',
                height: '1.5rem',
                borderRadius: '0.75rem',
                backgroundColor: settings().reducedMotion ? 'var(--colors-primary)' : 'var(--colors-muted)',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background-color 0.15s ease',
              })}
            >
              <span
                class={css({
                  position: 'absolute',
                  top: '0.125rem',
                  width: '1.25rem',
                  height: '1.25rem',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  transition: 'left 0.15s ease',
                })}
                style={{
                  left: settings().reducedMotion ? '1.125rem' : '0.125rem',
                }}
              />
            </button>
          </label>
        </div>
      </section>
    </div>
  );
}
