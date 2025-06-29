import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { briefingApi } from '../api/briefing';
import { adminApi } from '../api/admin';
import { notifications } from '@mantine/notifications';

// Query Keys
export const queryKeys = {
  briefing: {
    status: ['briefing', 'status'] as const,
    sentiment: ['briefing', 'sentiment'] as const,
    history: (days: number) => ['briefing', 'history', days] as const,
  },
  admin: {
    stats: ['admin', 'stats'] as const,
    redditSources: ['admin', 'reddit', 'sources'] as const,
    wordpressSources: ['admin', 'wordpress', 'sources'] as const,
  },
};

// Briefing Queries
export const useBriefingStatus = () => {
  return useQuery({
    queryKey: queryKeys.briefing.status,
    queryFn: briefingApi.getStatus,
  });
};

export const useBriefingSentiment = () => {
  return useQuery({
    queryKey: queryKeys.briefing.sentiment,
    queryFn: briefingApi.getSentiment,
  });
};

export const useBriefingHistory = (days: number = 7) => {
  return useQuery({
    queryKey: queryKeys.briefing.history(days),
    queryFn: () => briefingApi.getHistory(days),
  });
};

// Admin Queries
export const useAdminStats = () => {
  return useQuery({
    queryKey: queryKeys.admin.stats,
    queryFn: adminApi.getStats,
  });
};

export const useRedditSources = () => {
  return useQuery({
    queryKey: queryKeys.admin.redditSources,
    queryFn: adminApi.getRedditSources,
  });
};

export const useWordPressSources = () => {
  return useQuery({
    queryKey: queryKeys.admin.wordpressSources,
    queryFn: adminApi.getWordPressSources,
  });
};

// Briefing Mutations
export const useGenerateBriefing = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: briefingApi.generateBriefing,
    onSuccess: () => {
      notifications.show({
        title: 'Erfolg',
        message: 'Morning Briefing wurde erfolgreich generiert!',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.briefing.sentiment });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Fehler',
        message: error.message,
        color: 'red',
      });
    },
  });
};

export const useAnalyzeContent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: briefingApi.analyzeContent,
    onSuccess: (data) => {
      notifications.show({
        title: 'Analyse abgeschlossen',
        message: `${data.redditAnalyzed + data.wordpressAnalyzed} Inhalte wurden analysiert`,
        color: 'blue',
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.briefing.sentiment });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Fehler',
        message: error.message,
        color: 'red',
      });
    },
  });
};

// Admin Mutations
export const useCreateRedditSource = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.createRedditSource,
    onSuccess: () => {
      notifications.show({
        title: 'Erfolg',
        message: 'Reddit-Quelle wurde hinzugefügt!',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.redditSources });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Fehler',
        message: error.message,
        color: 'red',
      });
    },
  });
};

export const useUpdateRedditSource = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateRedditSource(id, data),
    onSuccess: () => {
      notifications.show({
        title: 'Erfolg',
        message: 'Reddit-Quelle wurde aktualisiert!',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.redditSources });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Fehler',
        message: error.message,
        color: 'red',
      });
    },
  });
};

export const useDeleteRedditSource = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.deleteRedditSource,
    onSuccess: () => {
      notifications.show({
        title: 'Erfolg',
        message: 'Reddit-Quelle wurde gelöscht!',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.redditSources });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Fehler',
        message: error.message,
        color: 'red',
      });
    },
  });
};

export const useCreateWordPressSource = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.createWordPressSource,
    onSuccess: () => {
      notifications.show({
        title: 'Erfolg',
        message: 'WordPress-Quelle wurde hinzugefügt!',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.wordpressSources });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Fehler',
        message: error.message,
        color: 'red',
      });
    },
  });
};

export const useUpdateWordPressSource = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateWordPressSource(id, data),
    onSuccess: () => {
      notifications.show({
        title: 'Erfolg',
        message: 'WordPress-Quelle wurde aktualisiert!',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.wordpressSources });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Fehler',
        message: error.message,
        color: 'red',
      });
    },
  });
};

export const useDeleteWordPressSource = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.deleteWordPressSource,
    onSuccess: () => {
      notifications.show({
        title: 'Erfolg',
        message: 'WordPress-Quelle wurde gelöscht!',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.wordpressSources });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Fehler',
        message: error.message,
        color: 'red',
      });
    },
  });
};

// Crawler Mutations
export const useRunFullCrawl = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.runFullCrawl,
    onSuccess: () => {
      notifications.show({
        title: 'Crawling gestartet',
        message: 'Vollständiger Crawl wurde gestartet!',
        color: 'blue',
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.briefing.status });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Fehler',
        message: error.message,
        color: 'red',
      });
    },
  });
};

export const useRunRedditCrawl = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.runRedditCrawl,
    onSuccess: () => {
      notifications.show({
        title: 'Reddit Crawling gestartet',
        message: 'Reddit Crawl wurde gestartet!',
        color: 'orange',
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.briefing.status });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Fehler',
        message: error.message,
        color: 'red',
      });
    },
  });
};

export const useRunWordPressCrawl = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.runWordPressCrawl,
    onSuccess: () => {
      notifications.show({
        title: 'WordPress Crawling gestartet',
        message: 'WordPress Crawl wurde gestartet!',
        color: 'blue',
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.briefing.status });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Fehler',
        message: error.message,
        color: 'red',
      });
    },
  });
};

export const useUpdateMarketData = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.updateMarketData,
    onSuccess: () => {
      notifications.show({
        title: 'Marktdaten aktualisiert',
        message: 'Marktdaten wurden erfolgreich aktualisiert!',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.briefing.sentiment });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Fehler',
        message: error.message,
        color: 'red',
      });
    },
  });
};