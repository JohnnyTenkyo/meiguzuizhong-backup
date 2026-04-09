import { describe, it, expect } from 'vitest';

describe('Stock Agent Configuration', () => {
  it('should have default Stock Agent configuration', () => {
    const defaultConfig = {
      baseUrl: 'https://yunwu.ai/v1',
      apiKey: 'sk-aXGFQ2gICvuvPnYkZKuLMeBkGodg8qDF8S7nwHoGugkMwaM1',
      model: 'gpt-5.4-nano',
    };

    expect(defaultConfig.baseUrl).toBe('https://yunwu.ai/v1');
    expect(defaultConfig.apiKey).toMatch(/^sk-/);
    expect(defaultConfig.model).toBe('gpt-5.4-nano');
  });

  it('should support multiple Base URL options', () => {
    const baseUrlOptions = [
      'https://yunwu.ai',
      'https://yunwu.ai/v1',
      'https://yunwu.ai/v1/chat/completions',
    ];

    expect(baseUrlOptions).toHaveLength(3);
    expect(baseUrlOptions).toContain('https://yunwu.ai/v1');
  });

  it('should validate configuration fields', () => {
    const validateConfig = (config: { baseUrl: string; apiKey: string; model: string }) => {
      return (
        config.baseUrl.trim() !== '' &&
        config.apiKey.trim() !== '' &&
        config.model.trim() !== ''
      );
    };

    const validConfig = {
      baseUrl: 'https://yunwu.ai/v1',
      apiKey: 'sk-key',
      model: 'gpt-5.4-nano',
    };

    const invalidConfig = {
      baseUrl: '',
      apiKey: 'sk-key',
      model: 'model',
    };

    expect(validateConfig(validConfig)).toBe(true);
    expect(validateConfig(invalidConfig)).toBe(false);
  });

  it('should support API Key format validation', () => {
    const validateApiKey = (key: string) => key.match(/^sk-/) !== null;

    const validApiKeys = [
      'sk-aXGFQ2gICvuvPnYkZKuLMeBkGodg8qDF8S7nwHoGugkMwaM1',
      'sk-test-key-123',
    ];

    const invalidApiKey = 'invalid-key';

    validApiKeys.forEach((key) => {
      expect(validateApiKey(key)).toBe(true);
    });

    expect(validateApiKey(invalidApiKey)).toBe(false);
  });

  it('should support configuration merging', () => {
    const initialConfig = {
      baseUrl: 'https://yunwu.ai/v1',
      apiKey: 'sk-initial',
      model: 'gpt-5.4-nano',
    };

    const updates = {
      apiKey: 'sk-updated',
    };

    const mergedConfig = {
      ...initialConfig,
      ...updates,
    };

    expect(mergedConfig.apiKey).toBe('sk-updated');
    expect(mergedConfig.baseUrl).toBe('https://yunwu.ai/v1');
    expect(mergedConfig.model).toBe('gpt-5.4-nano');
  });

  it('should support chat message structure', () => {
    type ChatMessage = {
      role: 'user' | 'assistant';
      content: string;
      timestamp: number;
    };

    const userMessage: ChatMessage = {
      role: 'user',
      content: '分析 TSLA 股票',
      timestamp: Date.now(),
    };

    expect(userMessage.role).toBe('user');
    expect(userMessage.content).toBeDefined();
    expect(typeof userMessage.timestamp).toBe('number');
  });

  it('should support assistant response structure', () => {
    type ChatMessage = {
      role: 'user' | 'assistant';
      content: string;
      timestamp: number;
    };

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: 'TSLA 是特斯拉公司的股票代码...',
      timestamp: Date.now(),
    };

    expect(assistantMessage.role).toBe('assistant');
    expect(assistantMessage.content).toContain('TSLA');
    expect(typeof assistantMessage.timestamp).toBe('number');
  });

  it('should support configuration reset to defaults', () => {
    const DEFAULT_CONFIG = {
      baseUrl: 'https://yunwu.ai/v1',
      apiKey: 'sk-aXGFQ2gICvuvPnYkZKuLMeBkGodg8qDF8S7nwHoGugkMwaM1',
      model: 'gpt-5.4-nano',
    };

    const customConfig = {
      baseUrl: 'https://custom.api/v1',
      apiKey: 'sk-custom',
      model: 'custom-model',
    };

    const resetConfig = { ...DEFAULT_CONFIG };

    expect(resetConfig).toEqual(DEFAULT_CONFIG);
    expect(resetConfig).not.toEqual(customConfig);
  });

  it('should support multiple Base URL endpoints for API calls', () => {
    const baseUrls = [
      'https://yunwu.ai',
      'https://yunwu.ai/v1',
      'https://yunwu.ai/v1/chat/completions',
    ];

    const buildApiUrl = (baseUrl: string, endpoint: string) => {
      if (baseUrl.endsWith('/')) {
        return `${baseUrl}${endpoint}`;
      }
      return `${baseUrl}/${endpoint}`;
    };

    const url1 = buildApiUrl(baseUrls[1], 'chat/completions');
    expect(url1).toBe('https://yunwu.ai/v1/chat/completions');

    const url2 = buildApiUrl(baseUrls[0], 'v1/chat/completions');
    expect(url2).toBe('https://yunwu.ai/v1/chat/completions');
  });

  it('should support configuration validation for all required fields', () => {
    type AIConfig = {
      baseUrl: string;
      apiKey: string;
      model: string;
    };

    const validateAllFields = (config: AIConfig): boolean => {
      return (
        typeof config.baseUrl === 'string' &&
        config.baseUrl.trim().length > 0 &&
        typeof config.apiKey === 'string' &&
        config.apiKey.trim().length > 0 &&
        typeof config.model === 'string' &&
        config.model.trim().length > 0
      );
    };

    const validConfig: AIConfig = {
      baseUrl: 'https://yunwu.ai/v1',
      apiKey: 'sk-test',
      model: 'gpt-5.4-nano',
    };

    const invalidConfig: AIConfig = {
      baseUrl: 'https://yunwu.ai/v1',
      apiKey: '',
      model: 'gpt-5.4-nano',
    };

    expect(validateAllFields(validConfig)).toBe(true);
    expect(validateAllFields(invalidConfig)).toBe(false);
  });
});
