import {
  GatewayDispatchEvents,
  GatewayOpCodes,
} from '../constants';
import { MockGateway } from '../mockgateway';

import {
  IChannel,
  IOverwrite,
} from '../schemas';

import { GatewayRawEvents } from './rawevents';



export interface GatewayHandlerOptions {
  disabledEvents?: Array<string>,
  loadAllMembers?: boolean,
}

export class GatewayHandler {
  disabledEvents: Set<string>;
  dispatchHandler: GatewayDispatchHandler;
  loadAllMembers: boolean;
  memberChunksLeft: Set<string>;
  mock: MockGateway;

  constructor(
    mock: MockGateway,
    options: GatewayHandlerOptions = {},
  ) {
    this.mock = mock;
    this.mock.gateway.on('packet', this.onPacket.bind(this));

    this.dispatchHandler = new GatewayDispatchHandler(this);
    this.disabledEvents = new Set((options.disabledEvents || []).map((v) => {
      return v.toUpperCase();
    }));
    this.loadAllMembers = !!options.loadAllMembers;
    this.memberChunksLeft = new Set();
  }

  get gateway() {
    return this.mock.gateway;
  }

  get shouldLoadAllMembers(): boolean {
    return this.loadAllMembers && this.gateway.guildSubscriptions;
  }

  onPacket(packet: GatewayRawEvents.GatewayPacket): void {
    if (packet.op !== GatewayOpCodes.DISPATCH) {
      return;
    }

    const name: string = packet.t;
    const data: any = packet.d;

    if (!this.disabledEvents.has(name)) {
      const handler = this.dispatchHandler.getHandler(name);
      if (handler) {
        handler.call(this.dispatchHandler, data);
      }
    }
  }
}


export type GatewayDispatchHandlerFunction = (data: any) => void;


export class GatewayDispatchHandler {
  handler: GatewayHandler;

  constructor(handler: GatewayHandler) {
    this.handler = handler;
  }

  get mock() {
    return this.handler.mock;
  }

  get models() {
    return this.handler.mock.models;
  }

  getHandler(name: string): GatewayDispatchHandlerFunction | undefined {
    return (<any> this)[name];
  }

  async [GatewayDispatchEvents.READY](data: GatewayRawEvents.Ready) {
    await this.mock.reset();

    const _shardId = this.mock.shardId;
    const {
      Channel,
      User,
    } = this.models;

    if (User) {
      await User.updateOne({
        id: data.user.id,
        _shardId,
      }, {
        ...data.user,
        _shardId,
      }, {upsert: true});
    }

    if (Channel && data.private_channels && data.private_channels.length) {
      const operations: Array<any> = [];
      for (let raw of data.private_channels) {
        operations.push({
          updateOne: {
            filter: {id: raw.id, _shardId},
            update: {...raw, _shardId},
            upsert: true,
          },
        });
      }
      if (operations.length) {
        await Channel.bulkWrite(operations);
      }
    }
  }

  async [GatewayDispatchEvents.GUILD_CREATE](data: GatewayRawEvents.GuildCreate) {
    const _shardId = this.mock.shardId;
    const { Channel, Overwrite } = this.models;

    if (Channel && data.channels) {
      const operations: Array<any> = [];
      for (let raw of data.channels) {
        const channel = <IChannel> raw;
        channel.guild_id = data.id;
        operations.push({
          updateOne: {
            filter: {id: channel.id, _shardId},
            update: {...channel, _shardId},
            upsert: true,
          },
        });
      }
      if (operations.length) {
        await Channel.bulkWrite(operations);
      }
    }

    if (Overwrite && data.channels) {
      const operations: Array<any> = [];
      for (let channel of data.channels) {
        if (channel.permission_overwrites && channel.permission_overwrites.length) {
          for (let raw of channel.permission_overwrites) {
            const overwrite = <IOverwrite> raw;
            overwrite.channel_id = channel.id;
            operations.push({
              updateOne: {
                filter: {channel_id: channel.id, id: overwrite.id, _shardId},
                update: {...overwrite, _shardId},
                upsert: true,
              },
            });
          }
        }
      }
      if (operations.length) {
        await Overwrite.bulkWrite(operations);
      }
    }
  }
}
