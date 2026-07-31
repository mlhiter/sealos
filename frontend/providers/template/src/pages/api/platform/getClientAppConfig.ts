import { Config } from '@/config';
import { jsonRes } from '@/services/backend/response';
import { ClientAppConfigSchema } from '@/types/config';
import {
  isServerMisconfiguredError,
  validateClientAppConfigOrThrow
} from '@sealos/shared/server/config';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getTemplateCategories } from '@/services/backend/template-categories';
import { ensureTemplateRepoFresh } from '@/services/backend/template-repo';

export async function getClientAppConfigServer() {
  await ensureTemplateRepoFresh();
  const fullConfig = Config();
  const categories = getTemplateCategories(fullConfig.template.categories);
  return validateClientAppConfigOrThrow(ClientAppConfigSchema, {
    brandName: fullConfig.template.ui.brandName,
    desktopDomain: fullConfig.template.desktopDomain,
    currencySymbol: fullConfig.template.ui.currencySymbol,
    categories,
    showAuthor: fullConfig.template.features.showAuthor,
    carousel: fullConfig.template.ui.carousel
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    jsonRes(res, {
      code: 200,
      data: await getClientAppConfigServer()
    });
  } catch (error) {
    if (isServerMisconfiguredError(error)) {
      return jsonRes(res, { code: 500, message: 'Server misconfigured' });
    }
    console.error('[Client App Config] Unexpected server error:', error);
    return jsonRes(res, { code: 500, message: 'Internal Server Error' });
  }
}
