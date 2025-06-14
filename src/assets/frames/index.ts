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
};

export const frameDimensions = {
  square: { width: 2400, height: 2400 },
  horizontal: { width: 3200, height: 2400 },
  vertical: { width: 2400, height: 3200 },
  risala: { width: 1080, height: 1350 }, // Replace with actual PNG size if different
};

export type FrameType = 'square' | 'horizontal' | 'vertical' | 'risala';
