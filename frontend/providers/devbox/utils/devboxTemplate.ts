import { z } from 'zod';

const uuidSchema = z.string().uuid();

export const CUSTOM_RUNTIME_ICON_ID = 'custom';
export const EXTERNAL_DEVBOX_UNMANAGED = 'EXTERNAL_DEVBOX_UNMANAGED';

export const isValidTemplateID = (value: unknown): value is string => {
  return typeof value === 'string' && uuidSchema.safeParse(value).success;
};

export const collectValidTemplateIDs = (values: unknown[]): string[] => {
  const seen = new Set<string>();

  return values.filter((value): value is string => {
    if (!isValidTemplateID(value) || seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

export const buildFallbackTemplateSummary = (templateID: unknown) => ({
  uid: typeof templateID === 'string' && templateID.length > 0 ? templateID : 'external',
  name: CUSTOM_RUNTIME_ICON_ID,
  templateRepository: {
    iconId: CUSTOM_RUNTIME_ICON_ID
  }
});

export const buildExternalDevboxUnmanagedError = (devboxName: string, templateID: unknown) => ({
  code: EXTERNAL_DEVBOX_UNMANAGED,
  reason: 'templateID_missing_or_invalid',
  devboxName,
  templateID: typeof templateID === 'string' ? templateID : ''
});

export const buildExternalDevboxUnmanagedResponse = (devboxName: string, templateID: unknown) => ({
  code: 422,
  message:
    'This Devbox was created externally and does not provide a valid templateID. Template-dependent operations are unavailable.',
  error: buildExternalDevboxUnmanagedError(devboxName, templateID)
});
