
export type Theme = {
  name: string;
  label: string;
  className: string;
  primary: string; // HSL value as string
  accent: string;  // HSL value as string
};

export const themes: Theme[] = [
  {
    name: 'purple',
    label: 'Apus',
    className: 'theme-purple',
    primary: '262 84% 60%',
    accent: '289 84% 65%',
  },
  {
    name: 'orange',
    label: 'Apune',
    className: 'theme-orange',
    primary: '24 94% 53%',
    accent: '45 93% 47%',
  },
  {
    name: 'blue',
    label: 'Ocean',
    className: 'theme-blue',
    primary: '217 91% 60%',
    accent: '188 84% 53%',
  },
  {
    name: 'green',
    label: 'Pădure',
    className: 'theme-green',
    primary: '142 76% 36%',
    accent: '158 64% 52%',
  },
  {
    name: 'red',
    label: 'Vulkan',
    className: 'theme-red',
    primary: '0 84% 60%',
    accent: '348 83% 60%',
  },
];

    