import {
  GatewayDispatchEvents,
  GatewayOpCodes,
} from '../constants';
import { MockGateway } from '../mockgateway';

import {
  IChannel,
  IEmoji,
  IMember,
  IPresence,
  IRole,
  IUser,
  IVoiceState,
} from '../schemas';

import * as CreationTools from '../utils/creationtools';

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

  getHandler(name: string): GatewayDispatchHandlerFunction | undefined {
    return (<any> this)[name];
  }

  async [GatewayDispatchEvents.READY](data: GatewayRawEvents.Ready) {
    await this.mock.reset();


    await CreationTools.createUsers(this.mock, [data.user]);
    if (data.private_channels) {
      await CreationTools.createChannels(this.mock, data.private_channels);
    }

    if (data.guilds) {
      await CreationTools.createRawGuilds(this.mock, data.guilds);
    }

    if (data.presences) {
      await CreationTools.createPresences(this.mock, data.presences.map((presence: any) => {
        presence.cache_id = '@me';
        return <IPresence> presence;
      }));
    }
  }

  async [GatewayDispatchEvents.CHANNEL_CREATE](data: GatewayRawEvents.ChannelCreate) {
    await CreationTools.createChannels(this.mock, [data]);
  }

  async [GatewayDispatchEvents.CHANNEL_DELETE](data: GatewayRawEvents.ChannelDelete) {
    const _shardId = this.mock.shardId;
    const { Channel } = this.mock.models;

    if (Channel) {
      await Channel.deleteOne({id: data.id, _shardId});
    }
  }

  async [GatewayDispatchEvents.CHANNEL_PINS_UPDATE](data: GatewayRawEvents.ChannelPinsUpdate) {
    // pretty much a very partial channel object lol
    const channel = <any> data;
    await CreationTools.createChannels(this.mock, [channel]);
  }

  async [GatewayDispatchEvents.CHANNEL_UPDATE](data: GatewayRawEvents.ChannelUpdate) {
    await CreationTools.createChannels(this.mock, [data]);
  }

  async [GatewayDispatchEvents.GUILD_CREATE](data: GatewayRawEvents.GuildCreate) {
    await CreationTools.createRawGuilds(this.mock, [data]);
  }

  async [GatewayDispatchEvents.GUILD_DELETE](data: GatewayRawEvents.GuildDelete) {
    const _shardId = this.mock.shardId;
    const {
      Channel,
      Emoji,
      Guild,
      Member,
      Presence,
      Role,
      VoiceState,
    } = this.mock.models;

    if (data.unavailable) {
      // guild just became unavailable, merge into db
      if (Guild) {
        const guild = <any> data;
        await CreationTools.createGuilds(this.mock, [guild]);
      }
    } else {
      if (Guild) {
        await Guild.deleteOne({id: data.id, _shardId});
      }
      if (Channel) {
        await Channel.deleteMany({guild_id: data.id, _shardId});
      }
      if (Emoji) {
        await Emoji.deleteMany({guild_id: data.id, _shardId});
      }
      if (Member) {
        await Member.deleteMany({guild_id: data.id, _shardId});
      }
      if (Presence) {
        await Presence.deleteMany({guild_id: data.id, _shardId});
      }
      if (Role) {
        await Role.deleteMany({guild_id: data.id, _shardId});
      }
      if (VoiceState) {
        await VoiceState.deleteMany({guild_id: data.id, _shardId});
      }
    }
  }

  async [GatewayDispatchEvents.GUILD_EMOJIS_UPDATE](data: GatewayRawEvents.GuildEmojisUpdate) {
    const _shardId = this.mock.shardId;
    const { Emoji } = this.mock.models;

    if (Emoji) {
      await Emoji.deleteMany({guild_id: data.guild_id, _shardId});
    }

    await CreationTools.createEmojis(this.mock, data.emojis.map((emoji: any) => {
      emoji.guild_id = data.guild_id;
      return emoji;
    }));
  }

  async [GatewayDispatchEvents.GUILD_UPDATE](data: GatewayRawEvents.GuildUpdate) {
    await CreationTools.createRawGuilds(this.mock, [data]);
  }
}
