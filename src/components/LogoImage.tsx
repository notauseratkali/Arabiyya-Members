import React, { useState, useEffect } from 'react';
import { useLogo } from '../context/LogoContext';

interface LogoImageProps {
  className?: string;
  alt?: string;
}

export const LogoImage: React.FC<LogoImageProps> = ({ 
  className = "w-full h-full object-contain", 
  alt = "Arabiyya Rovers Crest" 
}) => {
  const { logoUrl } = useLogo();
  const [imgSrc, setImgSrc] = useState<string>(logoUrl || '/logo.svg');

  useEffect(() => {
    if (logoUrl) {
      setImgSrc(logoUrl);
    }
  }, [logoUrl]);

  return (
    <img 
      src={imgSrc} 
      alt={alt} 
      className={className} 
      onError={() => {
        if (imgSrc !== '/logo.svg') {
          setImgSrc('/logo.svg');
        }
      }}
    />
  );
};
