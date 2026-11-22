import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ruby: {
          DEFAULT: '#8F1D35',
          hover: '#7A172C',
          dark: '#631022',
          light: '#A72844',
          50: '#FDF2F4',
          100: '#FBE4E8',
          200: '#F5BAC4',
          600: '#8F1D35',
          700: '#7A172C',
          800: '#631022',
          900: '#4D0A18',
        },
        gold: {
          DEFAULT: '#D9B66F',
          hover: '#C9A65F',
          light: '#F5E8C9',
          dark: '#B08C44',
          50: '#FAF6ED',
          100: '#F5ECD4',
          200: '#EBD9AA',
          500: '#D9B66F',
          600: '#C9A65F',
          700: '#B08C44',
        },
        ivory: {
          DEFAULT: '#FFF9F1',
          50: '#FFFFFF',
          100: '#FFFDF9',
          200: '#FFF9F1',
          300: '#F9F1E2',
          400: '#EFE3CE',
        },
        espresso: {
          DEFAULT: '#332522',
          muted: '#5C433E',
          subtle: '#8C6C65',
          light: '#AB928C',
          900: '#231816',
          800: '#332522',
          700: '#473430',
          600: '#5C433E',
        },
        rose: {
          DEFAULT: '#F3E4E6',
          panel: '#F7ECEE',
          accent: '#E8D0D3',
          dark: '#D9B7BC',
          50: '#FCF7F8',
          100: '#F7ECEE',
          200: '#F3E4E6',
          300: '#E5CDD1',
        },
        brand: {
          ruby: '#8F1D35',
          gold: '#D9B66F',
          ivory: '#FFF9F1',
          espresso: '#332522',
          rose: '#F3E4E6',
        },
      },
    },
  },
  plugins: [],
};

export default config;
