import { createTheme } from '@shopify/restyle';

const globals = {
  light: {
    '--background': '0 0% 100%',
    '--foreground': '222.2 84% 4.9%',

    '--card': '0 0% 100%',
    '--card-foreground': '222.2 84% 4.9%',

    '--popover': '0 0% 100%',
    '--popover-foreground': '222.2 84% 4.9%',

    '--primary': '222.2 47.4% 11.2%',
    '--primary-foreground': '210 40% 98%',

    '--secondary': '210 40% 96.1%',
    '--secondary-foreground': '222.2 47.4% 11.2%',

    '--muted': '210 40% 96.1%',
    '--muted-foreground': '215.4 16.3% 46.9%',

    '--accent': '210 40% 96.1%',
    '--accent-foreground': '222.2 47.4% 11.2%',

    '--destructive': '0 84.2% 60.2%',
    '--destructive-foreground': '210 40% 98%',

    '--border': '214.3 31.8% 91.4%',
    '--input': '214.3 31.8% 91.4%',
    '--ring': '222.2 84% 4.9%',

    '--radius': 8
  },
  dark: {
    '--background': '222.2 84% 4.9%',
    '--foreground': '210 40% 98%',

    '--card': '222.2 84% 4.9%',
    '--card-foreground': '210 40% 98%',

    '--popover': '222.2 84% 4.9%',
    '--popover-foreground': '210 40% 98%',

    '--primary': '210 40% 98%',
    '--primary-foreground': '222.2 47.4% 11.2%',

    '--secondary': '217.2 32.6% 17.5%',
    '--secondary-foreground': '210 40% 98%',

    '--muted': '217.2 32.6% 17.5%',
    '--muted-foreground': '215 20.2% 65.1%',

    '--accent': '217.2 32.6% 17.5%',
    '--accent-foreground': '210 40% 98%',

    '--destructive': '0 62.8% 30.6%',
    '--destructive-foreground': '210 40% 98%',

    '--border': '217.2 32.6% 17.5%',
    '--input': '217.2 32.6% 17.5%',
    '--ring': '212.7,26.8%,83.9',

    '--radius': 8
  }
};

const theme = createTheme({
  colors: {
    background: `hsl(${globals.light['--background']})`,
    input: `hsl(${globals.light['--input']})`,
    border: `hsl(${globals.light['--border']})`,
    primary: `hsl(${globals.light['--primary']})`,
    primaryForeground: `hsl(${globals.light['--foreground']})`,
    secondary: `hsl(${globals.light['--secondary']})`,
    secondaryForeground: `hsl(${globals.light['--secondary-foreground']})`,
    destructive: `hsl(${globals.light['--destructive']})`,
    destructiveForeground: `hsl(${globals.light['--destructive-foreground']})`,
    muted: `hsl(${globals.light['--muted']})`,
    mutedForeground: `hsl(${globals.light['--muted-foreground']})`,
    accent: `hsl(${globals.light['--accent']})`,
    accentForeground: `hsl(${globals.light['--accent-foreground']})`,
    popover: `hsl(${globals.light['--popover']})`,
    popoverForeground: `hsl(${globals.light['--popover-foreground']})`,
    card: `hsl(${globals.light['--card']})`,
    cardForeground: `hsl(${globals.light['--card-foreground']})`
  },
  borderRadii: {
    lg: globals.light['--radius'],
    md: globals.light['--radius'] - 2,
    sm: globals.light['--radius'] - 4
  },
  spacing: {
    s: 8,
    m: 16,
    l: 24,
    xl: 40
  },
  buttonVariants: {
    defaults: {
      color: 'primary',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 'md',
      height: 40,
      fontWeight: 'medium'
    },
    primary: {
      bg: 'primary',
      color: 'primaryForeground'
    },
    secondary: {
      bg: 'secondary',
      color: 'secondaryForeground'
    },
    destructive: {
      bg: 'destructive',
      color: 'destructiveForeground'
    },
    outline: {
      borderWidth: 1,
      borderColor: 'input',
      bg: 'background'
    },
    ghost: {},
    link: {}
  },
  textVariants: {
    buttonLabel: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: 'medium'
    },
    header: {
      fontWeight: 'bold',
      fontSize: 34
    },
    body: {
      fontSize: 16,
      lineHeight: 24
    },
    defaults: {
      // We can define a default text variant here.
    }
  }
});

const darkTheme: Theme = {
  ...theme,
  colors: {
    background: `hsl(${globals.dark['--background']})`,
    input: `hsl(${globals.dark['--input']})`,
    border: `hsl(${globals.dark['--border']})`,
    primary: `hsl(${globals.dark['--primary']})`,
    primaryForeground: `hsl(${globals.dark['--foreground']})`,
    secondary: `hsl(${globals.dark['--secondary']})`,
    secondaryForeground: `hsl(${globals.dark['--secondary-foreground']})`,
    destructive: `hsl(${globals.dark['--destructive']})`,
    destructiveForeground: `hsl(${globals.dark['--destructive-foreground']})`,
    muted: `hsl(${globals.dark['--muted']})`,
    mutedForeground: `hsl(${globals.dark['--muted-foreground']})`,
    accent: `hsl(${globals.dark['--accent']})`,
    accentForeground: `hsl(${globals.dark['--accent-foreground']})`,
    popover: `hsl(${globals.dark['--popover']})`,
    popoverForeground: `hsl(${globals.dark['--popover-foreground']})`,
    card: `hsl(${globals.dark['--card']})`,
    cardForeground: `hsl(${globals.dark['--card-foreground']})`
  }
};

export type Theme = typeof theme;
export { theme, darkTheme };
