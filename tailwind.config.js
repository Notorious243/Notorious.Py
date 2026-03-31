/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
    	container: {
    		center: true,
    		padding: '2rem',
    		screens: {
    			'2xl': '1400px'
    		}
    	},
    	extend: {
    		colors: {
    			indigo: {
    				'50': '#EBF0F7',
    				'100': '#D0DEF0',
    				'200': '#A1BDE0',
    				'300': '#729CD1',
    				'400': '#437BC1',
    				'500': '#1F5AA0',
    				'600': '#0F3460',
    				'700': '#0C2B52',
    				'800': '#092244',
    				'900': '#061936',
    				'950': '#031024'
    			},
    			violet: {
    				'50': '#ECF2F9',
    				'100': '#D5E2F1',
    				'200': '#ABC5E3',
    				'300': '#81A8D5',
    				'400': '#578BC7',
    				'500': '#2D6EB9',
    				'600': '#153E6E',
    				'700': '#12345E',
    				'800': '#0F2A4E',
    				'900': '#0C203E',
    				'950': '#061228'
    			},
    			purple: {
    				'50': '#EEF3FA',
    				'100': '#D9E5F2',
    				'200': '#B3CBE5',
    				'300': '#8DB1D8',
    				'400': '#6797CB',
    				'500': '#417DBE',
    				'600': '#1C4E82',
    				'700': '#184370',
    				'800': '#14385E',
    				'900': '#102D4C',
    				'950': '#081A30'
    			},
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			}
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		keyframes: {
    			'accordion-down': {
    				from: { height: '0' },
    				to: { height: 'var(--radix-accordion-content-height)' }
    			},
    			'accordion-up': {
    				from: { height: 'var(--radix-accordion-content-height)' },
    				to: { height: '0' }
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out'
    		}
    	}
    },
    plugins: [require("tailwindcss-animate")],
}
