import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true,
  include: ['./src/**/*.{js,jsx,ts,tsx}'],
  exclude: [],
  outdir: 'styled-system',
  jsxFramework: 'solid',

  theme: {
    extend: {
      tokens: {
        colors: {
          // Midnight theme (default dark)
          background: { value: '#1e1e2e' },
          foreground: { value: '#cdd6f4' },
          primary: { value: '#89b4fa' },
          primaryHover: { value: '#7ba4ea' },
          accent: { value: '#f38ba8' },
          accentHover: { value: '#e37b98' },
          muted: { value: '#313244' },
          mutedHover: { value: '#414354' },
          border: { value: '#45475a' },
          sidebar: { value: '#181825' },
          hover: { value: '#313244' },
          success: { value: '#a6e3a1' },
          warning: { value: '#f9e2af' },
          error: { value: '#f38ba8' },
          info: { value: '#89dceb' },

          // Event colors
          eventWork: { value: '#89b4fa' },
          eventPersonal: { value: '#a6e3a1' },
          eventMeeting: { value: '#f9e2af' },
          eventFocus: { value: '#cba6f7' },
          eventDefault: { value: '#6c7086' },
        },

        fonts: {
          body: { value: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
          mono: { value: '"JetBrains Mono", "Fira Code", Consolas, monospace' },
        },

        fontSizes: {
          xs: { value: '0.6875rem' },   // 11px
          sm: { value: '0.75rem' },     // 12px
          base: { value: '0.875rem' },  // 14px
          lg: { value: '1rem' },        // 16px
          xl: { value: '1.25rem' },     // 20px
          '2xl': { value: '1.5rem' },   // 24px
          '3xl': { value: '1.875rem' }, // 30px
        },

        fontWeights: {
          normal: { value: '400' },
          medium: { value: '500' },
          semibold: { value: '600' },
          bold: { value: '700' },
        },

        lineHeights: {
          tight: { value: '1.25' },
          normal: { value: '1.5' },
          relaxed: { value: '1.75' },
        },

        spacing: {
          xs: { value: '0.25rem' },  // 4px
          sm: { value: '0.5rem' },   // 8px
          md: { value: '1rem' },     // 16px
          lg: { value: '1.5rem' },   // 24px
          xl: { value: '2rem' },     // 32px
          '2xl': { value: '3rem' },  // 48px
        },

        radii: {
          none: { value: '0' },
          sm: { value: '0.25rem' },   // 4px
          md: { value: '0.5rem' },    // 8px
          lg: { value: '0.75rem' },   // 12px
          xl: { value: '1rem' },      // 16px
          full: { value: '9999px' },
        },

        shadows: {
          sm: { value: '0 1px 2px 0 rgb(0 0 0 / 0.05)' },
          md: { value: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' },
          lg: { value: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' },
          xl: { value: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' },
        },

        durations: {
          fast: { value: '100ms' },
          normal: { value: '200ms' },
          slow: { value: '300ms' },
        },

        easings: {
          default: { value: 'cubic-bezier(0.4, 0, 0.2, 1)' },
          in: { value: 'cubic-bezier(0.4, 0, 1, 1)' },
          out: { value: 'cubic-bezier(0, 0, 0.2, 1)' },
          inOut: { value: 'cubic-bezier(0.4, 0, 0.2, 1)' },
        },

        sizes: {
          sidebarWidth: { value: '280px' },
          sidebarCollapsed: { value: '60px' },
          headerHeight: { value: '56px' },
          eventMinHeight: { value: '24px' },
        },

        zIndex: {
          dropdown: { value: '1000' },
          sticky: { value: '1020' },
          modal: { value: '1040' },
          popover: { value: '1060' },
          tooltip: { value: '1080' },
          toast: { value: '1100' },
        },
      },

      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeOut: {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        slideInFromRight: {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        slideOutToRight: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(100%)' },
        },
        slideInFromBottom: {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        slideOutToBottom: {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(100%)' },
        },
        scaleIn: {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          from: { transform: 'scale(1)', opacity: '1' },
          to: { transform: 'scale(0.95)', opacity: '0' },
        },
        spin: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },

  globalCss: {
    '*': {
      margin: 0,
      padding: 0,
      boxSizing: 'border-box',
    },
    'html, body': {
      height: '100%',
      width: '100%',
      fontFamily: 'body',
      fontSize: 'base',
      lineHeight: 'normal',
      color: 'foreground',
      backgroundColor: 'background',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
    },
    '#root': {
      height: '100%',
      width: '100%',
    },
    'a': {
      color: 'primary',
      textDecoration: 'none',
      _hover: {
        textDecoration: 'underline',
      },
    },
    'button': {
      cursor: 'pointer',
      border: 'none',
      background: 'none',
      fontFamily: 'inherit',
      fontSize: 'inherit',
    },
    'input, textarea, select': {
      fontFamily: 'inherit',
      fontSize: 'inherit',
    },
    '::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '::-webkit-scrollbar-thumb': {
      background: 'border',
      borderRadius: 'full',
      _hover: {
        background: 'muted',
      },
    },
    '::selection': {
      background: 'primary',
      color: 'background',
    },
  },

  utilities: {
    extend: {
      truncate: {
        className: 'truncate',
        values: { type: 'boolean' },
        transform(value: boolean) {
          if (!value) return {}
          return {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }
        },
      },
      lineClamp: {
        className: 'line-clamp',
        transform(value: number) {
          return {
            display: '-webkit-box',
            WebkitLineClamp: value,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }
        },
      },
    },
  },
})
