/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './context/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      // ── Clinical Serenity color palette ─────────────────────────────────
      colors: {
        // Primary – Sky Precision
        'primary'                  : '#006591',
        'on-primary'               : '#ffffff',
        'primary-container'        : '#0ea5e9',
        'on-primary-container'     : '#003751',
        'primary-fixed'            : '#c9e6ff',
        'primary-fixed-dim'        : '#89ceff',
        'on-primary-fixed'         : '#001e2f',
        'on-primary-fixed-variant' : '#004c6e',
        'inverse-primary'          : '#89ceff',

        // Secondary – Tactile Teal
        'secondary'                   : '#006a61',
        'on-secondary'                : '#ffffff',
        'secondary-container'         : '#86f2e4',
        'on-secondary-container'      : '#006f66',
        'secondary-fixed'             : '#89f5e7',
        'secondary-fixed-dim'         : '#6bd8cb',
        'on-secondary-fixed'          : '#00201d',
        'on-secondary-fixed-variant'  : '#005049',

        // Tertiary – Warm Amber
        'tertiary'                    : '#8a5100',
        'on-tertiary'                 : '#ffffff',
        'tertiary-container'          : '#de8712',
        'on-tertiary-container'       : '#4d2b00',
        'tertiary-fixed'              : '#ffdcbd',
        'tertiary-fixed-dim'          : '#ffb86e',
        'on-tertiary-fixed-variant'   : '#693c00',

        // Error
        'error'                : '#ba1a1a',
        'on-error'             : '#ffffff',
        'error-container'      : '#ffdad6',
        'on-error-container'   : '#93000a',

        // Surface tiers
        'surface'                    : '#f7f9fb',
        'surface-bright'             : '#f7f9fb',
        'surface-tint'               : '#006591',
        'surface-variant'            : '#e0e3e5',
        'surface-container-lowest'   : '#ffffff',
        'surface-container-low'      : '#f2f4f6',
        'surface-container'          : '#eceef0',
        'surface-container-high'     : '#e6e8ea',
        'surface-container-highest'  : '#e0e3e5',

        // On-Surface
        'on-surface'            : '#191c1e',
        'on-surface-variant'    : '#3e4850',
        'inverse-surface'       : '#2d3133',
        'inverse-on-surface'    : '#eff1f3',

        // Outline
        'outline'         : '#6e7880',
        'outline-variant' : '#bec8d2',

        // Background
        'background'    : '#f7f9fb',
        'on-background' : '#191c1e',
      },

      // ── Typography ────────────────────────────────────────────────────────
      fontFamily: {
        manrope : ['Manrope', 'sans-serif'],
        inter   : ['Inter', 'sans-serif'],
        sans    : ['Inter', 'sans-serif'],
      },
      fontSize: {
        'display-lg'  : ['3.5rem',   { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'headline-md' : ['1.75rem',  { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'title-md'    : ['1.125rem', { lineHeight: '1.4' }],
        'body-md'     : ['0.875rem', { lineHeight: '1.6' }],
        'label-sm'    : ['0.6875rem',{ lineHeight: '1.4', letterSpacing: '0.05em' }],
      },

      // ── Shadows ───────────────────────────────────────────────────────────
      boxShadow: {
        'cloud'  : '0px 20px 40px rgba(25, 28, 30, 0.06)',
        'cloud-lg': '0px 32px 64px rgba(25, 28, 30, 0.10)',
      },

      // ── Border radius ─────────────────────────────────────────────────────
      borderRadius: {
        'xl'   : '0.75rem',
        '2xl'  : '1rem',
        '3xl'  : '1.5rem',
        '4xl'  : '2rem',
        '5xl'  : '2.5rem',
      },

      // ── Animations ────────────────────────────────────────────────────────
      animation: {
        'fade-in'    : 'fadeIn 0.3s ease-out',
        'slide-up'   : 'slideUp 0.4s ease-out',
        'pulse-soft' : 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn   : { from: { opacity: '0' },                 to: { opacity: '1' } },
        slideUp  : { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: '1' },            '50%': { opacity: '0.5' } },
      },
    },
  },
  plugins: [],
};
