import { nutritionService } from '@/features/nutrition/services/nutrition.service';
import { apiClient } from '@/services/api/api-client';
import { useOutbox } from '@/services/sync';

jest.mock('@/services/api/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('the offline demo (mock mode)', () => {
  it('only updates the on-device database: nothing is queued or sent', async () => {
    await nutritionService.addWater('2026-11-04', 250, 3500);
    expect((await nutritionService.getDay('2026-11-04')).hydrationMl).toBe(250);
    expect(useOutbox.getState().items).toHaveLength(0);
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
