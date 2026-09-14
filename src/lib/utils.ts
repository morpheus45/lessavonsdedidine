import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Fusionne des classes Tailwind en laissant la dernière gagner.
 *
 * `clsx` gère les conditions, `tailwind-merge` résout les conflits : sans
 * lui, `cn('p-4', 'p-8')` produirait les deux classes et c'est l'ordre du
 * CSS généré — pas celui de l'appel — qui trancherait.
 */
export function cn(...entrees: ClassValue[]) {
  return twMerge(clsx(entrees));
}
