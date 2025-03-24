tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#1c4e80',
                    dark: '#163e66'
                },
                secondary: '#7c909a',
                accent: {
                    DEFAULT: '#ea6947',
                    dark: '#d55a3a'
                },
                dark: {
                    DEFAULT: '#23282e',
                    lighter: '#2d343c'
                },
                light: '#d0dae5'
            },
            boxShadow: {
                'neon': '0 0 5px theme("colors.accent.DEFAULT"), 0 0 20px theme("colors.accent.DEFAULT")',
            }
        }
    }
}; 