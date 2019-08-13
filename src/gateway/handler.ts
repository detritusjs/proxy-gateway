import {
  GatewayDispatchEvents,
  GatewayOpCodes,
  PresenceStatuses,
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

    const user = <IUser> <unknown> data.user;
    await CreationTools.createUsers(this.mock, [user]);

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

  async [GatewayDispatchEvents.GUILD_MEMBER_ADD](data: GatewayRawEvents.GuildMemberAdd) {
    const _shardId = this.mock.shardId;
    const { Guild } = this.mock.models;

    if (Guild) {
      await Guild.updateOne({id: data.guild_id, _shardId}, {$inc: {count: 1}});
    }

    const user = <IUser> <unknown> data.user;
    await CreationTools.createUsers(this.mock, [user]);

    const member = <IMember> <unknown> data;
    member.user_id = user.id;
    await CreationTools.createMembers(this.mock, [member]);
  }

  async [GatewayDispatchEvents.GUILD_MEMBER_REMOVE](data: GatewayRawEvents.GuildMemberRemove) {
    const _shardId = this.mock.shardId;
    const { Guild, Member } = this.mock.models;

    if (Guild) {
      await Guild.updateOne({id: data.guild_id, _shardId}, {$inc: {count: -1}});
    }
    if (Member) {
      await Member.deleteOne({
        guild_id: data.guild_id,
        id: data.user.id,
        _shardId,
      });
    }
  }

  async [GatewayDispatchEvents.GUILD_MEMBER_UPDATE](data: GatewayRawEvents.GuildMemberUpdate) {
    // todo: premium subscription count increase
    const user = <IUser> <unknown> data.user;
    await CreationTools.createUsers(this.mock, [user]);

    const member = <IMember> <unknown> data;
    member.user_id = user.id;
    await CreationTools.createMembers(this.mock, [member]);
  }

  async [GatewayDispatchEvents.GUILD_MEMBERS_CHUNK](data: GatewayRawEvents.GuildMembersChunk) {
    await CreationTools.createUsers(this.mock, data.members.map((member) => member.user));
    await CreationTools.createMembers(this.mock, data.members.map((member: any) => {
      member.guild_id = data.guild_id;
      return member;
    }));
    if (data.presences) {
      await CreationTools.createPresences(this.mock, data.presences.map((presence: any) => {
        presence.guild_id = data.guild_id;
        return presence;
      }));
    }
  }

  async [GatewayDispatchEvents.GUILD_ROLE_CREATE](data: GatewayRawEvents.GuildRoleCreate) {
    const role = <any> data.role;
    role.guild_id = data.guild_id;
    await CreationTools.createRoles(this.mock, [role]);
  }

  async [GatewayDispatchEvents.GUILD_ROLE_DELETE](data: GatewayRawEvents.GuildRoleDelete) {
    const _shardId = this.mock.shardId;
    const { Role } = this.mock.models;

    if (Role) {
      await Role.deleteOne({
        guild_id: data.guild_id,
        id: data.role_id,
        _shardId,
      });
    }
  }

  async [GatewayDispatchEvents.GUILD_ROLE_UPDATE](data: GatewayRawEvents.GuildRoleUpdate) {
    const role = <any> data.role;
    role.guild_id = data.guild_id;
    await CreationTools.createRoles(this.mock, [role]);
  }

  async [GatewayDispatchEvents.GUILD_UPDATE](data: GatewayRawEvents.GuildUpdate) {
    await CreationTools.createRawGuilds(this.mock, [data]);
  }

  async [GatewayDispatchEvents.MESSAGE_CREATE](data: GatewayRawEvents.MessageCreate) {
    const members: Array<IMember> = [];
    const users: Array<IUser> = [data.author];

    if (data.member) {
      const member = <IMember> data.member;
      member.guild_id = <string> data.guild_id;
      member.user_id = data.author.id;
      members.push(member);
    }

    if (data.mentions) {
      for (const mention of data.mentions) {
        users.push(<IUser> <any> mention);

        if (mention.member) {
          const member = <IMember> mention.member;
          member.guild_id = <string> data.guild_id;
          member.user_id = mention.id;
          members.push(member);
        }
      }
    }

    await CreationTools.createMembers(this.mock, members);
    await CreationTools.createUsers(this.mock, users);

    // update channel last message id
  }

  async [GatewayDispatchEvents.PRESENCE_UPDATE](data: GatewayRawEvents.PresenceUpdate) {
    const user = <IUser> <unknown> data.user;
    await CreationTools.createUsers(this.mock, [user]);

    const cacheId = data.guild_id || '@me';
    if (data.status === PresenceStatuses.OFFLINE) {
      const _shardId = this.mock.shardId;
      const { Presence } = this.mock.models;
      if (Presence) {
        await Presence.deleteOne({
          cache_id: cacheId,
          user_id: user.id,
          _shardId,
        });
      }
    } else {
      const presence = <IPresence> <unknown> data;
      presence.cache_id = cacheId;
      presence.user_id = user.id;
      await CreationTools.createPresences(this.mock, [presence]);
    }

    if (data.guild_id) {
      const member = <IMember> <unknown> data;
      member.guild_id = data.guild_id;
      member.user_id = user.id;
      await CreationTools.createMembers(this.mock, [member]);
    }
  }

  async [GatewayDispatchEvents.TYPING_START](data: GatewayRawEvents.TypingStart) {
    if (data.member) {
      const user = <IUser> data.member.user;

      const member = <IMember> data.member;
      member.guild_id = <string> data.guild_id;
      member.user_id = user.id;

      await CreationTools.createUsers(this.mock, [user]);
      await CreationTools.createMembers(this.mock, [member]);
    }
  }

  async [GatewayDispatchEvents.USER_UPDATE](data: GatewayRawEvents.UserUpdate) {
    const user = <IUser> <unknown> data;
    await CreationTools.createUsers(this.mock, [user]);
  }

  async [GatewayDispatchEvents.VOICE_STATE_UPDATE](data: GatewayRawEvents.VoiceStateUpdate) {
    const voiceState = <IVoiceState> <unknown> data;
    voiceState.server_id = data.guild_id || data.channel_id;
    await CreationTools.createVoiceStates(this.mock, [voiceState]);

    if (data.member) {
      const user = <IUser> <unknown> data.member.user;
      await CreationTools.createUsers(this.mock, [user]);

      const member = <IMember> <unknown> data.member;
      if (data.guild_id) {
        member.guild_id = data.guild_id;
      }
      member.user_id = user.id;
      await CreationTools.createMembers(this.mock, [member]);
    }
  }
}
