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

    '--green': '109 58% 40%',
    '--yellow': '35 77% 49%',
    '--orange': '22 99% 52%',
    '--red': '347 87% 44%',

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

    '--green': '115 54% 76%',
    '--yellow': '41 86% 83%',
    '--orange': '23 92% 75%',
    '--red': '343 81% 75%',

    '--radius': 8
  }
};

const theme = createTheme({
  colors: {
    background: `hsl(${globals.light['--background']})`,
    input: `hsl(${globals.light['--input']})`,
    border: `hsl(${globals.light['--border']})`,
    primary: `hsl(${globals.light['--primary']})`,
    primaryForeground: `hsl(${globals.light['--primary-foreground']})`,
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
    cardForeground: `hsl(${globals.light['--card-foreground']})`,
    green: `hsl(${globals.light['--green']})`,
    yellow: `hsl(${globals.light['--yellow']})`,
    orange: `hsl(${globals.light['--orange']})`,
    red: `hsl(${globals.light['--red']})`
  },
  borderRadii: {
    lg: globals.light['--radius'],
    md: globals.light['--radius'] - 2,
    sm: globals.light['--radius'] - 4
  },
  spacing: {
    xxs: 2,
    xs: 4,
    s: 8,
    sm: 10,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 40
  },
  buttonVariants: {
    defaults: {
      bg: 'primary',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 'md',
      height: 40,
      fontWeight: 'medium'
    },
    secondary: {
      bg: 'secondary'
    },
    destructive: {
      bg: 'destructive'
    },
    outline: {
      borderWidth: 1,
      borderColor: 'border',
      bg: 'background'
    },
    ghost: {},
    link: {}
  },
  buttonLabelVariants: {
    defaults: {
      color: 'primaryForeground'
    },
    secondary: {
      color: 'secondaryForeground'
    },
    destructive: {
      color: 'destructiveForeground'
    },
    outline: {
      color: 'secondaryForeground'
    },
    ghost: {},
    link: {
      color: 'primary'
    }
  },
  inputVariants: {
    focused: {
      borderColor: 'primary'
    },
    error: {
      borderColor: 'destructive'
    },
    defaults: {
      color: 'primary',
      borderColor: 'secondary',
      borderWidth: 1,
      borderRadius: 'sm',
      height: 40,
      paddingVertical: 's',
      paddingHorizontal: 'm'
    }
  },
  textVariants: {
    buttonLabel: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: 500
    },
    inputLabel: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: 500
    },
    header: {
      fontWeight: 'bold',
      fontSize: 32
    },
    header2: {
      fontWeight: 'bold',
      fontSize: 26
    },
    header3: {
      fontWeight: 'bold',
      fontSize: 20
    },
    body: {
      fontSize: 16,
      lineHeight: 24
    },
    defaults: {}
  }
});

const darkTheme: Theme = {
  ...theme,
  colors: {
    background: `hsl(${globals.dark['--background']})`,
    input: `hsl(${globals.dark['--input']})`,
    border: `hsl(${globals.dark['--border']})`,
    primary: `hsl(${globals.dark['--primary']})`,
    primaryForeground: `hsl(${globals.dark['--primary-foreground']})`,
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
    cardForeground: `hsl(${globals.dark['--card-foreground']})`,
    green: `hsl(${globals.dark['--green']})`,
    yellow: `hsl(${globals.dark['--yellow']})`,
    orange: `hsl(${globals.dark['--orange']})`,
    red: `hsl(${globals.dark['--red']})`
  }
};

export type Theme = typeof theme;
export { theme, darkTheme };
