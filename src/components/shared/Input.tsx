import { JSX, splitProps } from 'solid-js'
import { css, cx } from '../../../styled-system/css'

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  fullWidth?: boolean
}

export function Input(props: InputProps) {
  const [local, rest] = splitProps(props, ['label', 'error', 'fullWidth', 'class'])

  const containerStyles = css({
    display: 'flex',
    flexDirection: 'column',
    gap: 'xs',
    width: local.fullWidth ? '100%' : 'auto',
  })

  const labelStyles = css({
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'foreground',
  })

  const inputStyles = css({
    padding: 'sm md',
    backgroundColor: 'muted',
    border: '1px solid {colors.border}',
    borderRadius: 'md',
    color: 'foreground',
    fontSize: 'base',
    outline: 'none',
    transition: 'all 150ms',
    width: '100%',
    _placeholder: {
      color: 'mutedHover',
    },
    _focus: {
      borderColor: 'primary',
      boxShadow: '0 0 0 2px color-mix(in srgb, {colors.primary} 25%, transparent)',
    },
    _disabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  })

  const errorStyles = css({
    fontSize: 'xs',
    color: 'error',
  })

  return (
    <div class={containerStyles}>
      {local.label && <label class={labelStyles}>{local.label}</label>}
      <input
        class={cx(
          inputStyles,
          local.error && css({ borderColor: 'error' }),
          local.class
        )}
        {...rest}
      />
      {local.error && <span class={errorStyles}>{local.error}</span>}
    </div>
  )
}
