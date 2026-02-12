import { useQuery } from '@tanstack/react-query';
import { http } from '../api/http';

export interface AuthorStats {
  overview: {
    works: {
      books: number;
      chapters: number;
      speeches: number;
    };
    audience: {
      followers: number;
    };
    engagement: {
      likes: number;
      comments: number;
    };
    earnings: {
      lifetime: number;
      current: number;
    };
  };
}

export function useAuthorStats() {
  return useQuery<AuthorStats>({
    queryKey: ['authorStats'],
    queryFn: async () => {
      const { data } = await http.get('/analytics/author');
      return data;
    }
  });
}
