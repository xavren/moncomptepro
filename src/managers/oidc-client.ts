import {
  addConnection,
  findByClientId,
  getByUserIdOrderedByConnectionCount,
} from '../repositories/oidc-client';
import { isEmpty, isString } from 'lodash';
import { NotFoundError } from '../errors';
import { KoaContextWithOIDC } from 'oidc-provider';
import { mustReturnOneOrganizationInPayload } from '../services/must-return-one-organization-in-payload';
import { getSelectedOrganizationId } from '../repositories/redis/selected-organization';
import * as Sentry from '@sentry/node';

export const getClientsOrderedByConnectionCount = async (
  user_id: number
): Promise<OidcClient[]> => {
  return await getByUserIdOrderedByConnectionCount(user_id);
};

export const recordNewConnection = async ({
  accountId,
  client,
  params,
}: {
  accountId: string;
  // tricky way to get the non exported Client type
  client: NonNullable<KoaContextWithOIDC['oidc']['client']>;
  params: KoaContextWithOIDC['oidc']['params'];
}): Promise<Connection> => {
  const user_id = parseInt(accountId, 10);

  const client_id = client.clientId;
  const oidc_client = await findByClientId(client_id);
  if (isEmpty(oidc_client)) {
    throw new NotFoundError();
  }
  const oidc_client_id = oidc_client.id;

  let organization_id: BaseConnection['organization_id'] = null;
  const scope = params?.scope;
  if (isString(scope) && mustReturnOneOrganizationInPayload(scope)) {
    try {
      organization_id = await getSelectedOrganizationId(user_id);
    } catch (err) {
      // This is unexpected, we silently fail and log it in sentry
      console.error(err);
      Sentry.captureException(err);
    }
  }

  return await addConnection({
    user_id,
    oidc_client_id,
    organization_id,
  });
};
