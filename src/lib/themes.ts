
export type Theme = {
  name: string;
  label: string;
  className: string;
  primary: string; // HSL value as string
  accent: string;  // HSL value as string
};

export const themes: Theme[] = [
  {
    name: 'classic',
    label: 'Clasic',
    className: 'theme-classic',
    primary: '262 70% 65%',
    accent: '289 75% 70%',
  },
  {
    name: 'orange',
    label: 'Apune',
    className: 'theme-orange',
    primary: '24 85% 60%',
    accent: '45 80% 55%',
  },
  {
    name: 'blue',
    label: 'Ocean',
    className: 'theme-blue',
    primary: '217 80% 65%',
    accent: '188 75% 60%',
  },
  {
    name: 'green',
    label: 'Pădure',
    className: 'theme-green',
    primary: '142 65% 40%',
    accent: '158 55% 55%',
  },
  {
    name: 'red',
    label: 'Vulkan',
    className: 'theme-red',
    primary: '0 75% 65%',
    accent: '348 72% 65%',
  },
  {
    name: 'cyan',
    label: 'Neon',
    className: 'theme-cyan',
    primary: '180 70% 50%',
    accent: '240 60% 75%',
  },
  {
    name: 'pink',
    label: 'Cireașă',
    className: 'theme-pink',
    primary: '340 100% 90%',
    accent: '0 0% 100%',
  },
  {
    name: 'graphite',
    label: 'Grafit',
    className: 'theme-graphite',
    primary: '220 10% 50%',
    accent: '220 10% 70%',
  },
];

    
