import { Pipe, PipeTransform } from '@angular/core';

/**
 * TimeAgoPipe
 * 
 * Transforms a date string or Date object into a human-readable relative time string.
 * 
 * @example
 * {{ post.createdAt | timeAgo }}
 * // Output: "2h", "3d", "1sem", etc.
 * 
 * @example With suffix
 * {{ post.createdAt | timeAgo:true }}
 * // Output: "há 2 horas", "há 3 dias", etc.
 */
@Pipe({
  name: 'timeAgo',
  standalone: true,
  pure: true
})
export class TimeAgoPipe implements PipeTransform {
  
  transform(value: string | Date | null | undefined, withSuffix: boolean = false): string {
    if (!value) {
      return '';
    }

    const date = value instanceof Date ? value : new Date(value);
    
    if (isNaN(date.getTime())) {
      return '';
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Handle future dates
    if (diffInSeconds < 0) {
      return withSuffix ? 'em breve' : 'agora';
    }

    // Less than a minute
    if (diffInSeconds < 60) {
      return withSuffix ? 'agora mesmo' : 'agora';
    }

    // Minutes
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      if (withSuffix) {
        return `há ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
      }
      return `${diffInMinutes}min`;
    }

    // Hours
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      if (withSuffix) {
        return `há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
      }
      return `${diffInHours}h`;
    }

    // Days
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      if (withSuffix) {
        return `há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
      }
      return `${diffInDays}d`;
    }

    // Weeks
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      if (withSuffix) {
        return `há ${diffInWeeks} semana${diffInWeeks > 1 ? 's' : ''}`;
      }
      return `${diffInWeeks}sem`;
    }

    // Months
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      if (withSuffix) {
        return `há ${diffInMonths} ${diffInMonths > 1 ? 'meses' : 'mês'}`;
      }
      return `${diffInMonths}mês${diffInMonths > 1 ? 'es' : ''}`;
    }

    // Years
    const diffInYears = Math.floor(diffInDays / 365);
    if (withSuffix) {
      return `há ${diffInYears} ano${diffInYears > 1 ? 's' : ''}`;
    }
    return `${diffInYears}ano${diffInYears > 1 ? 's' : ''}`;
  }
}
