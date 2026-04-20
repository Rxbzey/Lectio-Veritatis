import { toRoman } from '@/utils/toRoman';

interface NavigationOrbRomanWatermarkProps {
  index: number;
}

export function NavigationOrbRomanWatermark({ index }: NavigationOrbRomanWatermarkProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
      <span
        className="font-serif leading-none"
        style={{
          fontSize: 'clamp(12rem, 28vw, 36rem)',
          color: 'rgba(201,168,76,0.025)',
        }}
      >
        {toRoman(index + 1)}
      </span>
    </div>
  );
}
