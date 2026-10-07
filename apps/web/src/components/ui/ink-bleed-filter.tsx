export interface InkBleedFilterProps {
  id?: string;
  baseFrequency?: number;
  numOctaves?: number;
  scale?: number;
  stdDeviation?: number;
}

export function InkBleedFilter({
  id = 'ink-bleed',
  baseFrequency = 0.03,
  numOctaves = 4,
  scale = 30,
  stdDeviation = 4,
}: InkBleedFilterProps) {
  return (
    <svg
      className="absolute w-0 h-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
      tabIndex={-1}
    >
      <defs>
        <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
          {/* 1. Blur the incoming shape to give it a soft edge */}
          <feGaussianBlur in="SourceGraphic" stdDeviation={stdDeviation} result="blur" />
          
          {/* 2. Sharpen the blurred edge to create a liquid/membrane look */}
          <feColorMatrix 
            in="blur" 
            mode="matrix" 
            values="1 0 0 0 0  
                    0 1 0 0 0  
                    0 0 1 0 0  
                    0 0 0 25 -10" 
            result="liquid" 
          />
          
          {/* 3. Generate fractal noise (the paper texture / organic randomness) */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency={baseFrequency}
            numOctaves={numOctaves}
            result="noise"
          />
          
          {/* 4. Displace the sharp liquid edge using the noise */}
          <feDisplacementMap
            in="liquid"
            in2="noise"
            scale={scale}
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />
          
          {/* 5. Draw it over the original or just use it as is */}
          <feMerge>
            <feMergeNode in="displaced" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}

export default InkBleedFilter;
