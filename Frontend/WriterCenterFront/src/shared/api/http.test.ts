import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearTokens, getAccessToken, http, setAccessToken } from './http';
import { endpoints } from './endpoints';

describe('http auth integration', () => {
  beforeEach(() => {
    clearTokens();
    vi.restoreAllMocks();
  });

  it('keeps access token only in memory cache', () => {
    setAccessToken('memory-token');

    expect(getAccessToken()).toBe('memory-token');
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  it('refreshes access token via cookie endpoint on 401 and retries request', async () => {
    const adapter = vi.fn().mockResolvedValue({
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    });

    http.defaults.adapter = adapter;

    vi.spyOn(axios, 'post').mockResolvedValue({
      data: { accessToken: 'new-access-token' },
    } as never);

    const responseInterceptor = http.interceptors.response as unknown as {
      handlers: Array<{ rejected: (error: AxiosError) => Promise<unknown> }>;
    };
    const rejectedHandler = responseInterceptor.handlers[responseInterceptor.handlers.length - 1].rejected;

    const originalRequest = {
      url: '/books',
      method: 'get',
      headers: {},
    } as InternalAxiosRequestConfig & { _retry?: boolean };

    const error = {
      config: originalRequest,
      response: { status: 401 },
    } as AxiosError;

    await rejectedHandler(error);

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining(endpoints.auth.tokenRefresh),
      {},
      { withCredentials: true }
    );
    expect(getAccessToken()).toBe('new-access-token');
    expect(adapter).toHaveBeenCalled();
  });

  it('accepts 2xx responses for PUT update routes used by hooks', async () => {
    const updatedPayload = { ok: true };
    const adapter = vi.fn().mockImplementation((config) => {
      if (config.method !== 'put') {
        throw new Error(`Unexpected method: ${config.method}`);
      }

      return Promise.resolve({
        data: updatedPayload,
        status: 204,
        statusText: 'No Content',
        headers: {},
        config,
      });
    });

    http.defaults.adapter = adapter;

    const responses = await Promise.all([
      http.put(endpoints.books.byId('book-1'), { title: 'Livro atualizado' }),
      http.put(endpoints.chapters.byId('chapter-1'), { title: 'Capítulo atualizado' }),
      http.put(endpoints.characters.byId('character-1'), { name: 'Personagem atualizado' }),
      http.put(endpoints.speeches.byId('speech-1'), { text: 'Fala atualizada' }),
    ]);

    for (const response of responses) {
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(300);
    }

    expect(adapter).toHaveBeenCalledTimes(4);
  });

});
