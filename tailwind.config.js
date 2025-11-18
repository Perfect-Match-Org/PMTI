const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */

module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx}',
        './pages/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                'press-start': ['"Press Start 2P"', 'sans-serif'],
                'dela-gothic-one': ['"Dela Gothic One"', 'sans-serif'],
                'work-sans': ['"Work Sans"', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
