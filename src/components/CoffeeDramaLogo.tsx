import React, { useState } from 'react';

interface LogoProps {
  className?: string;
}

export const HouseDramaLogo: React.FC<LogoProps> = ({ className = '' }) => {
  const [imgFailed, setImgFailed] = useState(false);

  if (imgFailed) {
    return (
      <div className={`inline-flex items-center gap-2 select-none ${className}`}>
        <svg
          width="28"
          height="26"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="shrink-0"
        >
          <path
            d="M32 8L6 30.5C4.5 31.8 5.4 34.2 7.4 34.2H11.5V52C11.5 54.2 13.3 56 15.5 56H48.5C50.7 56 52.5 54.2 52.5 52V34.2H56.6C58.6 34.2 59.5 31.8 58 30.5L51 24.4V15.5C51 14.1 49.9 13 48.5 13H45.5C44.1 13 43 14.1 43 15.5V17.5L34.3 10C33.6 9.4 32.4 9.4 32 8Z"
            fill="#FF2B2B"
          />
          <path
            d="M27.2 26.8C25.8 25.9 24 26.9 24 28.5V43.5C24 45.1 25.8 46.1 27.2 45.2L39.8 37.7C41.1 36.9 41.1 35.1 39.8 34.3L27.2 26.8Z"
            fill="#FFFFFF"
          />
        </svg>
        <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#FF2B2B] whitespace-nowrap shrink-0">
          HOUSE <span className="text-[#EF4444]">DRAMA</span>
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src="/assets/aistudio/file_0000000001d0820799e3ae2eb34d615c_080ce864.png"
        alt="House Drama"
        onError={() => setImgFailed(true)}
        className="h-7 sm:h-9 w-auto object-contain shrink-0"
      />
    </div>
  );
};

export const CoffeeDramaLogo = HouseDramaLogo;
