import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

const readSource = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('application resource unit labels', () => {
  it('uses GiB throughout the resource quota and storage editing surfaces', () => {
    const quotaBox = readSource('../../../src/pages/app/edit/components/QuotaBox.tsx');
    const form = readSource('../../../src/pages/app/edit/components/Form.tsx');
    const storeModal = readSource('../../../src/pages/app/edit/components/StoreModal.tsx');
    const monitor = readSource('../../../src/pages/app/detail/monitor.tsx');
    const tools = readSource('../../../src/utils/tools.ts');

    expect(quotaBox).toContain("unit: 'GiB'");
    expect(quotaBox).not.toContain("unit: 'Gi'");
    expect(form).toContain('GiB');
    expect(form).not.toMatch(/\bGi\b/);
    expect(storeModal).toContain('GiB');
    expect(storeModal).not.toMatch(/\bGi\b/);
    expect(monitor).toContain('GiB');
    expect(monitor).not.toMatch(/\bGB\b/);
    expect(tools).toContain("'GiB'");
    expect(tools).not.toContain("'GB'");
  });
});
