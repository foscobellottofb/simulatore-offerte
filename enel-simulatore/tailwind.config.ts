import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        enel: {
          green: '#009A7A',
          greenDark: '#00745C',
          navy: '#006FBB',
          navyLight: '#3E93CE',
          magenta: '#E70066',
          ink: '#12181B',
          paper: '#FBFCFC',
          line: '#E4E7E9',
          amber: '#E8A33D'
        }
      },
      fontFamily: {
        body: ['var(--font-body)', 'sans-serif']
      }
    }
  },
  plugins: []
};

export default config;
