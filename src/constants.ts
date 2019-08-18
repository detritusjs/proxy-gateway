import { Constants as RestConstants } from 'detritus-client-rest';
import { Constants as SocketConstants } from 'detritus-client-socket';

const { AuthTypes } = RestConstants;
export { AuthTypes };

const {
  GatewayDispatchEvents,
  GatewayOpCodes,
  GatewayPresenceStatuses,
} = SocketConstants;
export {
  GatewayDispatchEvents,
  GatewayOpCodes,
  GatewayPresenceStatuses as PresenceStatuses,
};

export type Snowflake = number | string;


export const ClusterIPCOpCodes = Object.freeze({
  READY: 0,
  DISCONNECT: 1,
  RECONNECTING: 2,
  RESPAWN_ALL: 3,
});
