import { extendTailwindMerge } from 'tailwind-merge';

export const cn = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: ['display', 'h1', 'h2', 'h3', 'body', 'body-sm', 'caption'],
        },
      ],
      'text-color': [
        {
          text: [
            'primary',
            'secondary',
            'muted',
            'critical',
            'high',
            'medium',
            'low',
            'info',
            'resolved',
          ],
        },
      ],
      'font-family': [
        {
          font: ['display', 'sans', 'mono'],
        },
      ],
    },
  },
});
