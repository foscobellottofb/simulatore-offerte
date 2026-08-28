import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        enel: {
          green: '#00843D',
          greenDark: '#00612C',
          navy: '#0F1F3D',
          navyLight: '#1B3A66',
          ink: '#12181B',
          paper: '#F7F8F6',
          line: '#E1E5E2',
          amber: '#E8A33D'
        }
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)']
      }
    }
  },
  plugins: []
};

export default config;
