import { createTheme } from '@shopify/restyle';

const globals = {
  light: {
    '--background': '0 0% 100%',
    '--foreground': '240 10% 3.9%',

    '--card': '0 0% 100%',
    '--card-foreground': '240 10% 3.9%',

    '--popover': '0 0% 100%',
    '--popover-foreground': '240 10% 3.9%',

    '--primary': '240 5.9% 10%',
    '--primary-foreground': '0 0% 98%',

    '--secondary': '240 4.8% 95.9%',
    '--secondary-foreground': '240 5.9% 10%',

    '--muted': '240 4.8% 95.9%',
    '--muted-foreground': '40 3.8% 46.1%',

    '--accent': '240 4.8% 95.9%',
    '--accent-foreground': '240 5.9% 10%',

    '--destructive': '0 72.22% 50.59%',
    '--destructive-foreground': '0 0% 98%',

    '--border': '240 5.9% 90%',
    '--input': '240 5.9% 90%',
    '--ring': '240 5% 64.9%',

    '--green': '173 58% 39%',
    '--yellow': '35 77% 49%',
    '--orange': '22 99% 52%',
    '--red': '347 87% 44%',

    '--chart-1': '12 76% 61%',
    '--chart-2': '173 58% 39%',
    '--chart-3': '197 37% 24%',
    '--chart-4': '43 74% 66%',
    '--chart-5': '27 87% 67%',

    '--chart-1-rgb': '231, 110, 80',
    '--chart-2-rgb': '42, 157, 144',
    '--chart-3-rgb': '39, 71, 84',
    '--chart-4-rgb': '232, 196, 104',
    '--chart-5-rgb': '244, 164, 98',
    '--chart-label': '100, 116, 139',
    '--chart-line': '100, 116, 139',
    '--chart-title': '2, 8, 23',

    '--radius': 8
  },
  dark: {
    '--background': '240 10% 3.9%',
    '--foreground': '0 0% 98%',

    '--card': '240 10% 3.9%',
    '--card-foreground': '0 0% 98%',

    '--popover': '240 10% 3.9%',
    '--popover-foreground': '0 0% 98%',

    '--primary': '0 0% 98%',
    '--primary-foreground': '240 5.9% 10%',

    '--secondary': '240 3.7% 15.9%',
    '--secondary-foreground': '0 0% 98%',

    '--muted': '240 3.7% 15.9%',
    '--muted-foreground': '240 5% 64.9%',

    '--accent': '240 3.7% 15.9%',
    '--accent-foreground': '0 0% 98%',

    '--destructive': '0 62.8% 30.6%',
    '--destructive-foreground': '0 85.7% 97.3%',

    '--border': '240 3.7% 15.9%',
    '--input': '240 3.7% 15.9%',
    '--ring': '240 4.9% 83.9%',

    '--green': '160 60% 45%',
    '--yellow': '41 86% 83%',
    '--orange': '23 92% 75%',
    '--red': '343 81% 75%',

    '--chart-1': '220 70% 50%',
    '--chart-2': '160 60% 45%',
    '--chart-3': '30 80% 55%',
    '--chart-4': '280 65% 60%',
    '--chart-5': '340 75% 55%',

    '--chart-1-rgb': '38, 98, 217',
    '--chart-2-rgb': '46, 184, 138',
    '--chart-3-rgb': '232, 140, 48',
    '--chart-4-rgb': '175, 87, 219',
    '--chart-5-rgb': '226, 54, 112',
    '--chart-label': '148, 163, 184',
    '--chart-line': '148, 163, 184',
    '--chart-title': '248, 250, 252',

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
    red: `hsl(${globals.light['--red']})`,
    chart_1: `hsl(${globals.light['--chart-1']})`,
    chart_2: `hsl(${globals.light['--chart-2']})`,
    chart_3: `hsl(${globals.light['--chart-3']})`,
    chart_4: `hsl(${globals.light['--chart-4']})`,
    chart_5: `hsl(${globals.light['--chart-5']})`,
    chart_1_rgb: `${globals.light['--chart-1-rgb']}`,
    chart_2_rgb: `${globals.light['--chart-2-rgb']}`,
    chart_3_rgb: `${globals.light['--chart-3-rgb']}`,
    chart_4_rgb: `${globals.light['--chart-4-rgb']}`,
    chart_5_rgb: `${globals.light['--chart-5-rgb']}`,
    chartLabel: `${globals.light['--chart-label']}`,
    chartLine: `${globals.light['--chart-line']}`,
    chartTitle: `${globals.light['--chart-title']}`
  },
  borderRadii: {
    lg: globals.light['--radius'],
    md: globals.light['--radius'] - 2,
    sm: globals.light['--radius'] - 4
  },
  spacing: {
    none: 0,
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
    red: `hsl(${globals.dark['--red']})`,
    chart_1: `hsl(${globals.dark['--chart-1']})`,
    chart_2: `hsl(${globals.dark['--chart-2']})`,
    chart_3: `hsl(${globals.dark['--chart-3']})`,
    chart_4: `hsl(${globals.dark['--chart-4']})`,
    chart_5: `hsl(${globals.dark['--chart-5']})`,
    chart_1_rgb: `${globals.dark['--chart-1-rgb']}`,
    chart_2_rgb: `${globals.dark['--chart-2-rgb']}`,
    chart_3_rgb: `${globals.dark['--chart-3-rgb']}`,
    chart_4_rgb: `${globals.dark['--chart-4-rgb']}`,
    chart_5_rgb: `${globals.dark['--chart-5-rgb']}`,
    chartLabel: `${globals.dark['--chart-label']}`,
    chartLine: `${globals.dark['--chart-line']}`,
    chartTitle: `${globals.dark['--chart-title']}`
  }
};

export type Theme = typeof theme;
export { theme, darkTheme };
