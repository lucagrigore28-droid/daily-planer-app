
export type Theme = {
  name: string;
  label: string;
  className: string;
  primary: string; // HSL value as string or hex
  accent: string;  // HSL value as string or hex
};

export const themes: Theme[] = [
  {
    name: 'classic',
    label: 'Clasic',
    className: 'theme-classic',
    primary: 'hsl(262 84% 60%)',
    accent: 'hsl(289 84% 65%)',
  },
  {
    name: 'orange',
    label: 'Apune',
    className: 'theme-orange',
    primary: 'hsl(24 94% 53%)',
    accent: 'hsl(45 93% 47%)',
  },
  {
    name: 'blue',
    label: 'Ocean',
    className: 'theme-blue',
    primary: 'hsl(217 91% 60%)',
    accent: 'hsl(188 84% 53%)',
  },
  {
    name: 'green',
    label: 'Pădure',
    className: 'theme-green',
    primary: 'hsl(142 76% 36%)',
    accent: 'hsl(158 64% 52%)',
  },
  {
    name: 'red',
    label: 'Vulkan',
    className: 'theme-red',
    primary: 'hsl(0 84% 60%)',
    accent: 'hsl(348 83% 60%)',
  },
  {
    name: 'cyan',
    label: 'Neon',
    className: 'theme-cyan',
    primary: 'hsl(180 80% 45%)',
    accent: 'hsl(240 70% 70%)',
  },
  {
    name: 'pink',
    label: 'Cireașă',
    className: 'theme-pink',
    primary: 'hsl(340 100% 90%)',
    accent: 'hsl(0 0% 100%)',
  },
  {
    name: 'graphite',
    label: 'Grafit',
    className: 'theme-graphite',
    primary: 'hsl(220 10% 50%)',
    accent: 'hsl(220 10% 70%)',
  },
];
