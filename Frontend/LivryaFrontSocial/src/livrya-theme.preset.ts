/**
 * LIVRIA — PrimeNG Theme Configuration
 * Versão: 1.0.0 | Data: 2026-01-01
 * 
 * Este arquivo define o preset customizado do PrimeNG baseado no Aura,
 * utilizando a paleta de cores oficial da Livrya.
 */

import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Preset customizado da Livrya para PrimeNG 20
 * 
 * Cores:
 * - Primary: Verde musgo editorial (#4F6F64)
 * - Secondary: Papel/Bege (#B89A7F)
 * - Accent: Vinho fechado (#6B2E3A)
 */
const LivriaPreset = definePreset(Aura, {
  semantic: {
    // Cores primárias - Verde musgo editorial
    primary: {
      50:  '#E9F1EE',
      100: '#D4E3DC',
      200: '#B8CFC4',
      300: '#9BBBAD',
      400: '#7FA797',
      500: '#4F6F64',
      600: '#445F56',
      700: '#394F48',
      800: '#2F403A',
      900: '#25322D',
    },

    // Esquema de cores por modo (light/dark)
    colorScheme: {
      light: {
        // Superfícies - Tons de papel/bege
        surface: {
          0:   '#FFFFFF',
          50:  '#FAF7F2',
          100: '#F2ECE2',
          200: '#E8DDCF',
          300: '#DCCBB8',
          400: '#CDB39E',
          500: '#B89A7F',
          600: '#9E846C',
          700: '#7F6A56',
          800: '#5F5042',
          900: '#3E352E',
        },
        // Cores de texto
        text: {
          color: '#18181B',
          secondary: '#52525B',
          muted: '#A1A1AA',
        },
        // Fundo principal
        ground: {
          background: '#FAF7F2',
        },
        // Bordas
        border: {
          color: '#E4E4E7',
        },
      },
      dark: {
        // Superfícies dark mode
        surface: {
          0:   '#1A1A20',
          50:  '#141418',
          100: '#202028',
          200: '#27272A',
          300: '#3F3F46',
          400: '#52525B',
          500: '#71717A',
          600: '#A1A1AA',
          700: '#D4D4D8',
          800: '#E4E4E7',
          900: '#F4F4F5',
        },
        // Cores de texto dark mode
        text: {
          color: '#F5F5F6',
          secondary: 'rgba(245,245,246,0.72)',
          muted: 'rgba(245,245,246,0.50)',
        },
        // Fundo principal dark
        ground: {
          background: '#0F0F12',
        },
        // Bordas dark
        border: {
          color: 'rgba(228,228,231,0.12)',
        },
      },
    },
  },
});

export default LivriaPreset;

/**
 * Cores adicionais para referência (não fazem parte do PrimeNG):
 * 
 * Accent (Vinho):
 * - accent-500: #6B2E3A
 * 
 * Gamificação:
 * - livra: #D4AF37
 * - achievement-bronze: #CD7F32
 * - achievement-silver: #C0C0C0
 * - achievement-gold: #FFD700
 * 
 * Semânticas:
 * - success-500: #4CAF50
 * - warning-500: #E6A700
 * - error-500: #C0392B
 * - info-500: #3A6EA5
 */
