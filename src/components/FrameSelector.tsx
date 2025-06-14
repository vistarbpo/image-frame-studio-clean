
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FrameType } from "@/assets/frames";

interface FrameSelectorProps {
  selectedFrame: FrameType;
  onSelectFrame: (frameType: FrameType) => void;
}

export function FrameSelector({ selectedFrame, onSelectFrame }: FrameSelectorProps) {
  return (
    <div className="flex gap-2 justify-center mb-4">
      <Button
        variant={selectedFrame === 'square' ? "default" : "outline"}
        onClick={() => onSelectFrame('square')}
        className="rounded-full"
      >
        Square
      </Button>
      <Button
        variant={selectedFrame === 'horizontal' ? "default" : "outline"}
        onClick={() => onSelectFrame('horizontal')}
        className="rounded-full"
      >
        Horizontal
      </Button>
      <Button
        variant={selectedFrame === 'vertical' ? "default" : "outline"}
        onClick={() => onSelectFrame('vertical')}
        className="rounded-full"
      >
        Vertical
      </Button>
    </div>
  );
}
