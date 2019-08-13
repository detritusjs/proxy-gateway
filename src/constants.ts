import { Constants as SocketConstants } from 'detritus-client-socket';

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
