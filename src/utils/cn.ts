import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge doesn't know about the custom scales defined in tailwind.config.js.
 * Without this, it treats `text-h1` (font size) and `text-critical` (colour) as the
 * same class group and silently drops one of them.
 */
export const cn = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display',
            'h1',
            'h2',
            'h3',
            'body',
            'body-sm',
            'caption',
            'mono',
            'mono-sm',
          ],
        },
      ],
      'text-color': [
        {
          text: [
            'primary',
            'secondary',
            'muted',
            'disabled',
            'critical',
            'high',
            'medium',
            'low',
            'info',
            'resolved',
            'accent',
            'teal',
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
