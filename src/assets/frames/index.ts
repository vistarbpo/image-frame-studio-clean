import squareFrame from './Square.png';
import horizontalFrame from './Horizontal.png';
import verticalFrame from './Vertical.png';

export const frameAssets = {
  square: {
    bottom: squareFrame,
  },
  horizontal: {
    bottom: horizontalFrame,
  },
  vertical: {
    bottom: verticalFrame,
  },
  risala: {
    bottom: '/risala/frame.png',
  },
  'taif-risala': {
    bottom: '/taif-risala/frame.png',
  },
  'milad1': {
    bottom: '/milad1/frame.png',
  },
  'jizan-risala': {
    bottom: '/jizan-risala/frame.png',
  },
  'habibi-day': {
    bottom: '/habibi-day/frame.png',
  },
};

// Frame dimensions - update these if you change the frame PNG files
// The dimensions should match the actual PNG file dimensions for proper aspect ratio
export const frameDimensions = {
  square: { width: 2400, height: 2400 },
  horizontal: { width: 3200, height: 2400 },
  vertical: { width: 2400, height: 3200 }, // Update if new vertical frame has different dimensions
  risala: { width: 1080, height: 1350 }, // Update if new risala frame has different dimensions
  'taif-risala': { width: 1080, height: 1350 }, // Update if new taif-risala frame has different dimensions
  'milad1': { width: 1080, height: 1350 }, // Update if new milad1 frame has different dimensions
  'jizan-risala': { width: 1080, height: 1350 }, // Update if new jizan-risala frame has different dimensions
  'habibi-day': { width: 2400, height: 2400 }, // Square frame dimensions
};

export type FrameType = 'square' | 'horizontal' | 'vertical' | 'risala' | 'taif-risala' | 'milad1' | 'jizan-risala' | 'habibi-day';
