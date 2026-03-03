import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const defaultAvatars = [
  '/avatars/big-ears-1.svg',
  '/avatars/cute-avatar-1.svg',
  '/avatars/cute-avatar-2.svg',
  '/avatars/cute-avatar-3.svg',
  '/avatars/adventurer-1.svg',
  '/avatars/adventurer-2.svg',
];

export function getDefaultAvatar(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % defaultAvatars.length;
  return defaultAvatars[index];
}
