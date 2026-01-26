/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Notion 风格颜色
        notion: {
          bg: {
            DEFAULT: '#FFFFFF',
            page: '#F7F6F3',
            hover: '#F1F1EF',
            selected: '#E9E9E6',
          },
          text: {
            DEFAULT: '#37352F',
            secondary: '#787774',
            tertiary: '#9B9A97',
            disabled: '#C1C1BD',
          },
          border: {
            DEFAULT: '#E9E9E6',
            hover: '#D9D9D6',
          },
          accent: {
            blue: '#0B85FF',
            green: '#0F7B0F',
            yellow: '#EAB308',
            red: '#E16259',
            purple: '#9065B0',
            orange: '#F97316',
          },
        },
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Helvetica',
          '"Apple Color Emoji"',
          'Arial',
          'sans-serif',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
        ],
      },
      borderRadius: {
        notion: '3px',
      },
      boxShadow: {
        notion: 'rgba(15, 15, 15, 0.03) 0px 0px 0px 1px, rgba(15, 15, 15, 0.03) 0px 3px 6px, rgba(15, 15, 15, 0.08) 0px 9px 24px',
        'notion-sm': 'rgba(15, 15, 15, 0.03) 0px 0px 0px 1px, rgba(15, 15, 15, 0.03) 0px 2px 4px',
      },
    },
  },
  plugins: [],
}
