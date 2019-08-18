import {
  GatewayDispatchEvents,
  GatewayOpCodes,
  PresenceStatuses,
} from '../constants';
import { ShardProxy } from '../proxy';

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
  readonly shard: ShardProxy;

  disabledEvents: Set<string>;
  dispatchHandler: GatewayDispatchHandler;
  loadAllMembers: boolean;
  memberChunks: {
    done: Set<string>,
    left: Set<string>,
  } = {
    done: new Set(),
    left: new Set(),
  };
  queue: Array<[Function, any]> = [];
  ready: boolean = false;

  constructor(
    shard: ShardProxy,
    options: GatewayHandlerOptions = {},
  ) {
    this.shard = shard;
    this.shard.gateway.on('packet', this.onPacket.bind(this));

    this.dispatchHandler = new GatewayDispatchHandler(this);
    this.disabledEvents = new Set((options.disabledEvents || []).map((v) => {
      return v.toUpperCase();
    }));
    this.loadAllMembers = !!options.loadAllMembers;
  }

  get gateway() {
    return this.shard.gateway;
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
        switch (name) {
          case GatewayDispatchEvents.READY: {
            handler.call(this.dispatchHandler, data);
          }; break;
          default: {
            if (this.ready) {
              handler.call(this.dispatchHandler, data);
            } else {
              this.queue.push([handler, data]);
            }
          };
        }
      }
    }
  }

  async reset() {
    this.queue.length = 0;
    await this.shard.reset();
    this.memberChunks.done.clear();
    this.memberChunks.left.clear();
  }
}


export type GatewayDispatchHandlerFunction = (data: any) => void;


export class GatewayDispatchHandler {
  handler: GatewayHandler;

  constructor(handler: GatewayHandler) {
    this.handler = handler;
  }

  get shard() {
    return this.handler.shard;
  }

  getHandler(name: string): GatewayDispatchHandlerFunction | undefined {
    return (<any> this)[name];
  }

  async [GatewayDispatchEvents.READY](data: GatewayRawEvents.Ready) {
    this.handler.ready = false;
    await this.handler.reset();

    const user = <IUser> <unknown> data.user;
    await CreationTools.createUsers(this.shard, [user]);

    if (data.private_channels) {
      const channels: Array<IChannel> = data.private_channels;
      const users: Array<IUser> = [];

      for (const channel of channels) {
        if (channel.recipients) {
          channel.recipient_ids = channel.recipients.map((recipient) => {
            users.push(recipient);
            return recipient.id;
          });
        }
      }

      await CreationTools.createChannels(this.shard, channels);
      await CreationTools.createUsers(this.shard, users);
    }

    if (data.guilds) {
      await CreationTools.createRawGuilds(this.shard, data.guilds);
      if (this.handler.shouldLoadAllMembers) {
        const requestChunksNow: Array<string> = [];
        for (const guild of data.guilds) {
          if (guild.unavailable) {
            this.handler.memberChunks.left.add(guild.id);
          } else {
            if (this.shard.gateway.largeThreshold < guild.member_count) {
              requestChunksNow.push(guild.id);
              this.handler.memberChunks.done.add(guild.id);
            }
          }
        }
        if (requestChunksNow.length) {
          this.shard.gateway.requestGuildMembers(requestChunksNow, {
            limit: 0,
            presences: true,
            query: '',
          });
        }
      }
    }

    if (data.presences) {
      await CreationTools.createPresences(this.shard, data.presences.map((presence: any) => {
        presence.guild_id = '@me';
        presence.user_id = presence.user.id;
        return <IPresence> presence;
      }));
    }

    while (this.handler.queue.length) {
      const [handler, raw] = (<[Function, any]> this.handler.queue.shift());
      await Promise.resolve(handler.call(this, raw));
    }

    this.handler.ready = true;
    this.shard.emit('ready');
  }

  async [GatewayDispatchEvents.CHANNEL_CREATE](data: GatewayRawEvents.ChannelCreate) {
    const channel = <IChannel> <unknown> data;
    if (channel.recipients) {
      const users: Array<IUser> = [];

      channel.recipient_ids = channel.recipients.map((recipient) => {
        users.push(recipient);
        return recipient.id;
      });

      await CreationTools.createUsers(this.shard, users);
    }
    await CreationTools.createChannels(this.shard, [channel]);
  }

  async [GatewayDispatchEvents.CHANNEL_DELETE](data: GatewayRawEvents.ChannelDelete) {
    const _shardId = this.shard.shardId;
    const { Channel } = this.shard.models;

    if (Channel) {
      await Channel.deleteOne({id: data.id, _shardId});
    }
  }

  async [GatewayDispatchEvents.CHANNEL_PINS_UPDATE](data: GatewayRawEvents.ChannelPinsUpdate) {
    const _shardId = this.shard.shardId;
    const { Channel } = this.shard.models;

    if (Channel) {
      await Channel.updateOne({id: data.channel_id, _shardId}, {last_pin_timestamp: data.last_pin_timestamp});
    }
  }

  async [GatewayDispatchEvents.CHANNEL_UPDATE](data: GatewayRawEvents.ChannelUpdate) {
    const channel = <IChannel> <unknown> data;
    if (channel.recipients) {
      const users: Array<IUser> = [];

      channel.recipient_ids = channel.recipients.map((recipient) => {
        users.push(recipient);
        return recipient.id;
      });

      await CreationTools.createUsers(this.shard, users);
    }
    await CreationTools.createChannels(this.shard, [channel]);
  }

  // maybe store user from ban events?

  async [GatewayDispatchEvents.GUILD_CREATE](data: GatewayRawEvents.GuildCreate) {
    await CreationTools.createRawGuilds(this.shard, [data]);

    if (this.handler.shouldLoadAllMembers) {
      if (!this.handler.memberChunks.done.has(data.id)) {
        this.handler.memberChunks.left.add(data.id);
      }

      if (this.handler.memberChunks.left.has(data.id)) {
        if (this.shard.gateway.largeThreshold < data.member_count) {
          this.shard.gateway.requestGuildMembers(data.id, {
            limit: 0,
            presences: true,
            query: '',
          });
        }
        this.handler.memberChunks.done.add(data.id);
        this.handler.memberChunks.left.delete(data.id);
      }
    }
  }

  async [GatewayDispatchEvents.GUILD_DELETE](data: GatewayRawEvents.GuildDelete) {
    const _shardId = this.shard.shardId;
    const {
      Channel,
      Emoji,
      Guild,
      Member,
      Presence,
      Role,
      VoiceState,
    } = this.shard.models;

    if (data.unavailable) {
      // guild just became unavailable, merge into db
      if (Guild) {
        const guild = <any> data;
        await CreationTools.createGuilds(this.shard, [guild]);
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
    const _shardId = this.shard.shardId;
    const { Emoji } = this.shard.models;

    if (Emoji) {
      await Emoji.deleteMany({guild_id: data.guild_id, _shardId});
    }

    await CreationTools.createEmojis(this.shard, data.emojis.map((emoji: any) => {
      emoji.guild_id = data.guild_id;
      return emoji;
    }));
  }

  async [GatewayDispatchEvents.GUILD_MEMBER_ADD](data: GatewayRawEvents.GuildMemberAdd) {
    const _shardId = this.shard.shardId;
    const { Guild } = this.shard.models;

    if (Guild) {
      await Guild.updateOne({id: data.guild_id, _shardId}, {$inc: {count: 1}});
    }

    const user = <IUser> <unknown> data.user;
    await CreationTools.createUsers(this.shard, [user]);

    const member = <IMember> <unknown> data;
    member.user_id = user.id;
    await CreationTools.createMembers(this.shard, [member]);
  }

  async [GatewayDispatchEvents.GUILD_MEMBER_REMOVE](data: GatewayRawEvents.GuildMemberRemove) {
    const _shardId = this.shard.shardId;
    const { Guild, Member } = this.shard.models;

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
    await CreationTools.createUsers(this.shard, [user]);

    const member = <IMember> <unknown> data;
    member.user_id = user.id;
    await CreationTools.createMembers(this.shard, [member]);
  }

  async [GatewayDispatchEvents.GUILD_MEMBERS_CHUNK](data: GatewayRawEvents.GuildMembersChunk) {
    await CreationTools.createUsers(this.shard, data.members.map((member) => member.user));
    await CreationTools.createMembers(this.shard, data.members.map((member: any) => {
      member.guild_id = data.guild_id;
      member.user_id = member.user.id;
      return member;
    }));
    if (data.presences) {
      await CreationTools.createPresences(this.shard, data.presences.map((presence: any) => {
        presence.guild_id = data.guild_id;
        presence.user_id = presence.user.id;
        return presence;
      }));
    }
  }

  async [GatewayDispatchEvents.GUILD_ROLE_CREATE](data: GatewayRawEvents.GuildRoleCreate) {
    const role = <any> data.role;
    role.guild_id = data.guild_id;
    await CreationTools.createRoles(this.shard, [role]);
  }

  async [GatewayDispatchEvents.GUILD_ROLE_DELETE](data: GatewayRawEvents.GuildRoleDelete) {
    const _shardId = this.shard.shardId;
    const { Role } = this.shard.models;

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
    await CreationTools.createRoles(this.shard, [role]);
  }

  async [GatewayDispatchEvents.GUILD_UPDATE](data: GatewayRawEvents.GuildUpdate) {
    await CreationTools.createRawGuilds(this.shard, [data]);
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

    await CreationTools.createMembers(this.shard, members);
    await CreationTools.createUsers(this.shard, users);

    const _shardId = this.shard.shardId;
    const { Channel } = this.shard.models;

    if (Channel) {
      await Channel.updateOne({id: data.channel_id, _shardId}, {last_message_id: data.id});
    }
  }

  async [GatewayDispatchEvents.PRESENCE_UPDATE](data: GatewayRawEvents.PresenceUpdate) {
    const user = <IUser> <unknown> data.user;
    await CreationTools.createUsers(this.shard, [user]);

    const cacheId = data.guild_id || '@me';
    if (data.status === PresenceStatuses.OFFLINE) {
      const _shardId = this.shard.shardId;
      const { Presence } = this.shard.models;
      if (Presence) {
        await Presence.deleteOne({
          guild_id: cacheId,
          user_id: user.id,
          _shardId,
        });
      }
    } else {
      const presence = <IPresence> <unknown> data;
      presence.guild_id = cacheId;
      presence.user_id = user.id;
      await CreationTools.createPresences(this.shard, [presence]);
    }

    if (data.guild_id) {
      const member = <IMember> <unknown> data;
      member.guild_id = data.guild_id;
      member.user_id = user.id;
      await CreationTools.createMembers(this.shard, [member]);
    }
  }

  async [GatewayDispatchEvents.TYPING_START](data: GatewayRawEvents.TypingStart) {
    if (data.member) {
      const user = <IUser> data.member.user;

      const member = <IMember> data.member;
      member.guild_id = <string> data.guild_id;
      member.user_id = user.id;

      await CreationTools.createUsers(this.shard, [user]);
      await CreationTools.createMembers(this.shard, [member]);
    }
  }

  async [GatewayDispatchEvents.USER_UPDATE](data: GatewayRawEvents.UserUpdate) {
    const user = <IUser> <unknown> data;
    await CreationTools.createUsers(this.shard, [user]);
  }

  async [GatewayDispatchEvents.VOICE_STATE_UPDATE](data: GatewayRawEvents.VoiceStateUpdate) {
    const voiceState = <IVoiceState> <unknown> data;
    voiceState.server_id = data.guild_id || data.channel_id;
    if (data.channel_id) {
      await CreationTools.createVoiceStates(this.shard, [voiceState]);
    } else {
      const _shardId = this.shard.shardId;
      const { VoiceState } = this.shard.models;
      if (VoiceState) {
        await VoiceState.deleteOne({
          server_id: voiceState.server_id,
          user_id: voiceState.user_id,
          _shardId,
        });
      }
    }

    if (data.member) {
      const user = <IUser> <unknown> data.member.user;
      await CreationTools.createUsers(this.shard, [user]);

      const member = <IMember> <unknown> data.member;
      if (data.guild_id) {
        member.guild_id = data.guild_id;
      }
      member.user_id = user.id;
      await CreationTools.createMembers(this.shard, [member]);
    }
  }
}
