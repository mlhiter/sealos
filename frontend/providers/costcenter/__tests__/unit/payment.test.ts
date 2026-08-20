import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { valuationMap } from '../../src/constants/payment';

describe('resource valuation units', () => {
  it('prices network resources in GiB while preserving binary scaling', () => {
    expect(valuationMap.get('network')).toMatchObject({
      unit: 'GiB',
      scale: 1024
    });
  });

  it('labels object storage size quotas as GiB', () => {
    const quotaSource = readFileSync(
      new URL('../../src/components/valuation/quota.tsx', import.meta.url),
      'utf8'
    );

    expect(quotaSource).toContain("'objectstorage/size'");
    expect(quotaSource).toContain("unit: 'GiB'");
    expect(quotaSource).not.toContain("unit: 'GB'");
  });
});
