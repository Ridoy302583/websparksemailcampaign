// components/shared/ProfileImage.tsx - Handle Google profile images with fallback
import React, { useState, useEffect } from 'react';

interface ProfileImageProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackText?: string;
}

export const ProfileImage: React.FC<ProfileImageProps> = ({
  src,
  alt = 'Profile',
  size = 'md',
  className = '',
  fallbackText
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Size configurations
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      setImageError(true);
      return;
    }

    setIsLoading(true);
    setImageError(false);

    // Handle external images through proxy
    let processedSrc = src;
    
    // Use backend proxy for external images to avoid CORS issues
    if (src.includes('googleusercontent.com') || 
        src.includes('googleapis.com') || 
        src.includes('github.com') ||
        src.includes('gravatar.com') ||
        src.includes('linkedin.com')) {
      
      // Fix Google profile image URLs first
      if (src.includes('googleusercontent.com')) {
        processedSrc = src.replace(/=s\d+-c/, '=s200-c');
        if (!processedSrc.includes('=s')) {
          processedSrc += '=s200-c';
        }
      }
      
      // Use backend proxy
      processedSrc = `http://localhost:3001/api/image-proxy?url=${encodeURIComponent(processedSrc)}`;
    }

    // Create a new image to test loading
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(processedSrc);
      setImageError(false);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      console.warn('Failed to load profile image:', processedSrc);
      setImageError(true);
      setIsLoading(false);
    };
    
    img.src = processedSrc;
  }, [src]);

  // Generate initials from fallback text or alt
  const getInitials = (text: string) => {
    if (!text) return '?';
    
    const words = text.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return text[0]?.toUpperCase() || '?';
  };

  const initials = getInitials(fallbackText || alt);

  // Base classes
  const baseClasses = `
    ${sizeClasses[size]} 
    rounded-full 
    flex 
    items-center 
    justify-center 
    overflow-hidden 
    bg-gradient-to-br 
    from-blue-500 
    to-purple-600 
    text-white 
    font-medium 
    ${textSizeClasses[size]}
    ${className}
  `;

  if (isLoading) {
    return (
      <div className={`${baseClasses} animate-pulse bg-gray-300`}>
        <div className={`${sizeClasses[size]} bg-gray-400 rounded-full`}></div>
      </div>
    );
  }

  if (imageError || !imageSrc) {
    return (
      <div className={baseClasses} title={alt}>
        {initials}
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden ${className}`}>
      <img
        src={imageSrc}
        alt={alt}
        className="w-full h-full object-cover"
        onError={() => {
          console.warn('Image failed to display:', imageSrc);
          setImageError(true);
        }}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
      />
    </div>
  );
};
