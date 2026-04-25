import { classifyMulti } from '../src/api/classifyMulti';

global.fetch = jest.fn();
afterEach(() => jest.clearAllMocks());

test('returns array of classifications on success', async () => {
  (fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      items: [
        { item: 'plastic bottle', category: 'recycling', confidence: 88, tip: 'Rinse it.', bbox: { x: 0.1, y: 0.1, width: 0.2, height: 0.3 } },
        { item: 'banana peel', category: 'compost', confidence: 95, tip: 'Into the green bin.', bbox: { x: 0.5, y: 0.4, width: 0.2, height: 0.2 } },
      ],
    }),
  });

  const result = await classifyMulti('data:image/jpeg;base64,abc');
  expect(result).toHaveLength(2);
  expect(result[0].item).toBe('plastic bottle');
  expect(result[0].bbox.x).toBe(0.1);
  expect(fetch).toHaveBeenCalledWith(
    'https://txdpuiukpicwxbzgpbdu.supabase.co/functions/v1/classify-waste-multi',
    expect.objectContaining({ method: 'POST' })
  );
});

test('throws on non-ok response', async () => {
  (fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error: 'Rate limit reached.' }),
  });
  await expect(classifyMulti('data:image/jpeg;base64,abc')).rejects.toThrow('Rate limit reached.');
});

test('throws when items array is empty', async () => {
  (fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ items: [] }),
  });
  await expect(classifyMulti('data:image/jpeg;base64,abc')).rejects.toThrow('No items detected');
});
