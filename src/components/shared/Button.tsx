import { JSX, splitProps, Show } from 'solid-js'
import { css, cx } from '../../../styled-system/css'

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: JSX.Element
  iconPosition?: 'left' | 'right'
}

export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, [
    'variant',
    'size',
    'loading',
    'icon',
    'iconPosition',
    'children',
    'class',
    'disabled',
  ])

  const variant = () => local.variant ?? 'primary'
  const size = () => local.size ?? 'md'
  const iconPosition = () => local.iconPosition ?? 'left'

  const baseStyles = css({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'sm',
    fontWeight: 'medium',
    borderRadius: 'md',
    transition: 'all 150ms',
    cursor: 'pointer',
    border: 'none',
    outline: 'none',
    _focus: {
      boxShadow: '0 0 0 2px {colors.primary}',
    },
    _disabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  })

  const variantStyles = {
    primary: css({
      backgroundColor: 'primary',
      color: 'background',
      _hover: {
        backgroundColor: 'primaryHover',
      },
    }),
    secondary: css({
      backgroundColor: 'muted',
      color: 'foreground',
      _hover: {
        backgroundColor: 'mutedHover',
      },
    }),
    ghost: css({
      backgroundColor: 'transparent',
      color: 'foreground',
      _hover: {
        backgroundColor: 'hover',
      },
    }),
    danger: css({
      backgroundColor: 'error',
      color: 'background',
      _hover: {
        opacity: 0.9,
      },
    }),
  }

  const sizeStyles = {
    sm: css({
      padding: '4px 8px',
      fontSize: 'sm',
    }),
    md: css({
      padding: '8px 16px',
      fontSize: 'base',
    }),
    lg: css({
      padding: '12px 24px',
      fontSize: 'lg',
    }),
  }

  return (
    <button
      class={cx(baseStyles, variantStyles[variant()], sizeStyles[size()], local.class)}
      disabled={local.disabled || local.loading}
      {...rest}
    >
      <Show when={local.loading}>
        <span
          class={css({
            animation: 'spin 1s linear infinite',
          })}
        >
          ⏳
        </span>
      </Show>
      <Show when={!local.loading && local.icon && iconPosition() === 'left'}>
        {local.icon}
      </Show>
      {local.children}
      <Show when={!local.loading && local.icon && iconPosition() === 'right'}>
        {local.icon}
      </Show>
    </button>
  )
}
