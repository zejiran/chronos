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
    gap: '6px',
    width: local.fullWidth ? '100%' : 'auto',
  })

  const labelStyles = css({
    fontSize: '14px',
    fontWeight: '500',
    color: 'foreground',
    marginBottom: '2px',
  })

  const inputStyles = css({
    paddingTop: '8px',
    paddingBottom: '8px',
    paddingLeft: '12px',
    paddingRight: '12px',
    backgroundColor: 'background',
    border: '1px solid',
    borderColor: 'border',
    borderRadius: '6px',
    color: 'foreground',
    fontSize: '14px',
    height: '36px',
    outline: 'none',
    transition: 'all 150ms',
    width: '100%',
    _placeholder: {
      color: 'mutedHover',
    },
    _focus: {
      borderColor: 'primary',
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
