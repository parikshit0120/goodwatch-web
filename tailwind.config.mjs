/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        gw: {
          bg: '#0D0D0F',
          card: '#1A1A1F',
          accent: '#E63946',
          'accent-hover': '#FF4D5A',
          text: '#FFFFFF',
          'text-secondary': '#8E8E93',
          border: '#2C2C2E'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
