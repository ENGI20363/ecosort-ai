import { classifyImage } from '../src/api/classify';

global.fetch = jest.fn();

afterEach(() => jest.clearAllMocks());

test('returns classification on success', async () => {
  (fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      item: 'plastic bottle',
      category: 'recycling',
      confidence: 92,
      tip: 'Rinse and place in blue bin.',
    }),
  });

  const result = await classifyImage('data:image/jpeg;base64,abc123');

  expect(result.item).toBe('plastic bottle');
  expect(result.category).toBe('recycling');
  expect(result.confidence).toBe(92);
  expect(fetch).toHaveBeenCalledWith(
    'https://txdpuiukpicwxbzgpbdu.supabase.co/functions/v1/classify-waste',
    expect.objectContaining({ method: 'POST' })
  );
});

test('throws on non-ok response', async () => {
  (fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error: 'Rate limit reached.' }),
  });

  await expect(classifyImage('data:image/jpeg;base64,abc')).rejects.toThrow('Rate limit reached.');
});
