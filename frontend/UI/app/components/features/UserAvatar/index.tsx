'use client';

import Image from 'next/image';

interface UserAvatarProps {
  size?: 'small' | 'medium' | 'large';
  src?: string;
  borderStyle?: 'circle' | 'rounded';
  className?: string;
}

export default function UserAvatar({
  size = 'medium',
  src = '/default-avatar.png',
  borderStyle = 'circle',
  className,
}: UserAvatarProps) {
  const sizeMap = {
    small: { class: 'w-8 h-8', width: 32, height: 32 },
    medium: { class: 'w-10 h-10', width: 40, height: 40 },
    large: { class: 'w-12 h-12', width: 48, height: 48 },
  };

  const borderMap = {
    circle: 'rounded-full',
    rounded: 'rounded-lg',
  };

  // Extract size from className if available
  const extractedSize = className?.match(/w-(\d+)/)?.[1];
  let imageWidth = sizeMap[size].width;
  let imageHeight = sizeMap[size].height;
  
  if (extractedSize) {
    const customSize = parseInt(extractedSize) * 4; // Tailwind's w-14 = 56px = 14*4
    imageWidth = customSize;
    imageHeight = customSize;
  }

  return (
    <div
      className={`${className || sizeMap[size].class} ${borderMap[borderStyle]} overflow-hidden`}
    >
      <Image
        src={src}
        alt="User Avatar"
        width={imageWidth}
        height={imageHeight}
        className="w-full h-full object-cover"
        quality={95}
        priority={true}
        unoptimized={false}
      />
    </div>
  );
} 