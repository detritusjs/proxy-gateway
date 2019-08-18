import { GatewayRawEvents } from '../gateway/rawevents';
import { ShardProxy } from '../proxy';
import {
  IChannel,
  IEmoji,
  IGuild,
  IMember,
  IPresence,
  IRole,
  IUser,
  IVoiceState,
} from '../schemas';


export const DefaultBulkWriteOptions = {ordered: false};

export async function createChannels(
  shard: ShardProxy,
  channels?: Array<IChannel>,
) {
  if (channels && channels.length) {
    const _shardId = shard.shardId;
    const { Channel } = shard.models;

    if (Channel) {
      const operations: Array<any> = [];
      for (const channel of channels) {
        operations.push({
          updateOne: {
            filter: {id: channel.id, _shardId},
            update: {...channel, _shardId},
            upsert: true,
          },
        });
      }
      if (operations.length) {
        await Channel.bulkWrite(operations, <any> DefaultBulkWriteOptions);
      }
    }
  }
}


export async function createEmojis(
  shard: ShardProxy,
  emojis?: Array<IEmoji>,
) {
  if (emojis && emojis.length) {
    const _shardId = shard.shardId;
    const { Emoji } = shard.models;

    if (Emoji) {
      const operations: Array<any> = [];
      for (const emoji of emojis) {
        operations.push({
          updateOne: {
            filter: {id: emoji.id, _shardId},
            update: {...emoji, _shardId},
            upsert: true,
          },
        });
      }
      if (operations.length) {
        await Emoji.bulkWrite(operations, <any> DefaultBulkWriteOptions);
      }
    }
  }
}


export async function createGuilds(
  shard: ShardProxy,
  guilds?: Array<IGuild>,
) {
  if (guilds && guilds.length) {
    const _shardId = shard.shardId;
    const { Guild } = shard.models;

    if (Guild) {
      const operations: Array<any> = [];
      for (const guild of guilds) {
        operations.push({
          updateOne: {
            filter: {id: guild.id, _shardId},
            update: {...guild, _shardId},
            upsert: true,
          },
        });
      }
      if (operations.length) {
        await Guild.bulkWrite(operations, <any> DefaultBulkWriteOptions);
      }
    }
  }
}


export async function createMembers(
  shard: ShardProxy,
  members?: Array<IMember>,
) {
  if (members && members.length) {
    const models = shard.models;
    const _shardId = shard.shardId;
    const { Member } = models;

    if (Member) {
      let operations: Array<any>;
      if (models.operationsQueueTime) {
        operations = models.operations.members;
      } else {
        operations = [];
      }
      for (const member of members) {
        operations.push({
          updateOne: {
            filter: {guild_id: member.guild_id, user_id: member.user_id, _shardId},
            update: {...member, _shardId},
            upsert: true,
          },
        });
      }
      if (operations.length) {
        if (models.operationsQueueTime) {
          models.operationTimeouts.members.start(models.operationsQueueTime, async () => {
            const ops = operations.slice(0);
            operations.length = 0;
            await Member.bulkWrite(ops, <any> DefaultBulkWriteOptions);
          });
        } else {
          await Member.bulkWrite(operations, <any> DefaultBulkWriteOptions);
        }
      }
    }
  }
}

export async function createPresences(
  shard: ShardProxy,
  presences?: Array<IPresence>,
) {
  if (presences && presences.length) {
    const models = shard.models;
    const _shardId = shard.shardId;
    const { Presence } = models;

    if (Presence) {
      let operations: Array<any>;
      if (models.operationsQueueTime) {
        operations = models.operations.presences;
      } else {
        operations = [];
      }
      for (const presence of presences) {
        operations.push({
          updateOne: {
            filter: {cache_id: presence.cache_id, user_id: presence.user_id, _shardId},
            update: {...presence, _shardId},
            upsert: true,
          },
        });
      }
      if (operations.length) {
        if (models.operationsQueueTime) {
          models.operationTimeouts.presences.start(models.operationsQueueTime, async () => {
            const ops = operations.slice(0);
            operations.length = 0;
            await Presence.bulkWrite(ops, <any> DefaultBulkWriteOptions);
          });
        } else {
          await Presence.bulkWrite(operations, <any> DefaultBulkWriteOptions);
        }
      }
    }
  }
}

export async function createRoles(
  shard: ShardProxy,
  roles?: Array<IRole>,
) {
  if (roles && roles.length) {
    const _shardId = shard.shardId;
    const { Role } = shard.models;

    if (Role) {
      const operations: Array<any> = [];
      for (const role of roles) {
        operations.push({
          updateOne: {
            filter: {guild_id: role.guild_id, id: role.id, _shardId},
            update: {...role, _shardId},
            upsert: true,
          },
        });
      }
      if (operations.length) {
        await Role.bulkWrite(operations, <any> DefaultBulkWriteOptions);
      }
    }
  }
}

export async function createUsers(
  shard: ShardProxy,
  users?: Array<IUser>,
) {
  if (users && users.length) {
    const models = shard.models;
    const _shardId = shard.shardId;
    const { User } = models;

    if (User) {
      let operations: Array<any>;
      if (models.operationsQueueTime) {
        operations = models.operations.users;
      } else {
        operations = [];
      }
      for (const user of users) {
        operations.push({
          updateOne: {
            filter: {id: user.id, _shardId},
            update: {...user, _shardId},
            upsert: true,
          },
        });
      }
      if (operations.length) {
        if (models.operationsQueueTime) {
          models.operationTimeouts.users.start(models.operationsQueueTime, async () => {
            const ops = operations.slice(0);
            operations.length = 0;
            await User.bulkWrite(ops, <any> DefaultBulkWriteOptions);
          });
        } else {
          await User.bulkWrite(operations, <any> DefaultBulkWriteOptions);
        }
      }
    }
  }
}

export async function createVoiceStates(
  shard: ShardProxy,
  voiceStates?: Array<IVoiceState>,
) {
  if (voiceStates && voiceStates.length) {
    const _shardId = shard.shardId;
    const { VoiceState } = shard.models;

    if (VoiceState) {
      const operations: Array<any> = [];
      for (const voiceState of voiceStates) {
        operations.push({
          updateOne: {
            filter: {server_id: voiceState.server_id, user_id: voiceState.user_id, _shardId},
            update: {...voiceState, _shardId},
            upsert: true,
          },
        });
      }
      if (operations.length) {
        await VoiceState.bulkWrite(operations, <any> DefaultBulkWriteOptions);
      }
    }
  }
}




export async function createRawGuilds(
  shard: ShardProxy,
  guilds: Array<GatewayRawEvents.RawGuild>,
) {
  const channels: Array<IChannel> = [];
  const emojis: Array<IEmoji> = [];
  const members: Array<IMember> = [];
  const presences: Array<IPresence> = [];
  const roles: Array<IRole> = [];
  const users: Array<IUser> = [];
  const voiceStates: Array<IVoiceState> = [];

  for (const guild of guilds) {
    if (guild.channels) {
      for (const raw of guild.channels) {
        const channel = <any> raw;
        channel.guild_id = guild.id;
        channels.push(channel);
      }
    }

    if (guild.emojis) {
      for (const raw of guild.emojis) {
        const emoji = <any> raw;
        emoji.guild_id = guild.id;
        emojis.push(emoji);
      }
    }

    if (guild.members) {
      for (const raw of guild.members) {
        const member = <any> raw;
        member.guild_id = guild.id;
        member.user_id = member.user.id;
        members.push(member);
        users.push(member.user);
      }
    }

    if (guild.presences) {
      for (const raw of guild.presences) {
        const presence = <any> raw;
        presence.cache_id = guild.id;
        presence.user_id = presence.user.id;
        presences.push(presence);
      }
    }

    if (guild.roles) {
      for (const raw of guild.roles) {
        const role = <any> raw;
        role.guild_id = guild.id;
        roles.push(role);
      }
    }

    if (guild.voice_states) {
      for (const raw of guild.voice_states) {
        const voiceState = <any> raw;
        voiceState.guild_id = guild.id;
        voiceState.server_id = guild.id;
        voiceStates.push(voiceState);
      }
    }
  }

  await createGuilds(shard, guilds);
  await createChannels(shard, channels);
  await createEmojis(shard, emojis);
  await createMembers(shard, members);
  await createPresences(shard, presences);
  await createRoles(shard, roles);
  await createUsers(shard, users);
  await createVoiceStates(shard, voiceStates);
}
