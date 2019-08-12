import { Constants as SocketConstants } from 'detritus-client-socket';

const {
  GatewayDispatchEvents,
  GatewayOpCodes,
} = SocketConstants;
export {
  GatewayDispatchEvents,
  GatewayOpCodes,
};

export type Snowflake = number | string;
