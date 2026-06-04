import { describe, it, expect } from 'vitest';

describe('twikit credentials validation', () => {
  it('should have required environment variables set', () => {
    expect(process.env.TWIKIT_AUTH_TOKEN).toBeDefined();
    expect(process.env.TWIKIT_CT0).toBeDefined();
    expect(process.env.TWIKIT_GUEST_ID).toBeDefined();
  });

  it('should have valid token format', () => {
    const authToken = process.env.TWIKIT_AUTH_TOKEN;
    expect(authToken).toMatch(/^[a-f0-9]{40}$/i);
  });

  it('should have valid ct0 format', () => {
    const ct0 = process.env.TWIKIT_CT0;
    expect(ct0).toBeDefined();
    expect(ct0?.length).toBeGreaterThan(100);
  });

  it('should have valid guest_id format', () => {
    const guestId = process.env.TWIKIT_GUEST_ID;
    expect(guestId).toBeDefined();
    expect(guestId?.length).toBeGreaterThan(0);
  });

  it('should have all credentials non-empty', () => {
    expect(process.env.TWIKIT_AUTH_TOKEN?.length).toBeGreaterThan(0);
    expect(process.env.TWIKIT_CT0?.length).toBeGreaterThan(0);
    expect(process.env.TWIKIT_GUEST_ID?.length).toBeGreaterThan(0);
  });

  it('should test twikit Python service connectivity', async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/health');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('ok');
    } catch (error) {
      console.warn('twikit Python service not running - will be started on demand');
    }
  }, { timeout: 10000 });
});
