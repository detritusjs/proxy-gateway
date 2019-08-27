import { Model as MongooseModel } from 'mongoose';

import { GatewayRawEvents } from '../gateway/rawevents';
import { ModelOperation } from '../models';
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


export const DefaultBulkWriteOptions = {
  j: false,
  ordered: false,
  w: 0,
};

export async function createChannels(
  shard: ShardProxy,
  channels?: Array<IChannel>,
) {
  if (channels && channels.length) {
    const _shardId = shard.shardId;
    const { Channel } = shard.models;
    const operations = shard.models.operations.channels;

    if (Channel) {
      const ops = (operations.time) ? operations.ops : [];
      for (const channel of channels) {
        const update = <any> channel;
        update._shardId = _shardId;

        ops.push({
          updateOne: {
            filter: {id: channel.id, _shardId},
            update: {$set: update},
            upsert: true,
          },
        });
      }
      await startOperations(Channel, ops, operations);
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
    const operations = shard.models.operations.emojis;

    if (Emoji) {
      const ops = (operations.time) ? operations.ops : [];
      for (const emoji of emojis) {
        const update = <any> emoji;
        update._shardId = _shardId;

        ops.push({
          updateOne: {
            filter: {id: emoji.id, _shardId},
            update: {$set: update},
            upsert: true,
          },
        });
      }
      await startOperations(Emoji, ops, operations);
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
    const operations = shard.models.operations.guilds;

    if (Guild) {
      const ops = (operations.time) ? operations.ops : [];
      for (const guild of guilds) {
        const update = <any> guild;
        update._shardId = _shardId;

        ops.push({
          updateOne: {
            filter: {id: guild.id, _shardId},
            update: {$set: update},
            upsert: true,
          },
        });
      }
      await startOperations(Guild, ops, operations);
    }
  }
}


export async function createMembers(
  shard: ShardProxy,
  members?: Array<IMember>,
) {
  if (members && members.length) {
    const _shardId = shard.shardId;
    const { Member } = shard.models;
    const operations = shard.models.operations.members;

    if (Member) {
      const ops = (operations.time) ? operations.ops : [];
      for (const member of members) {
        const update = <any> member;
        update._shardId = _shardId;

        ops.push({
          updateOne: {
            filter: {guild_id: member.guild_id, user_id: member.user_id, _shardId},
            update: {$set: update},
            upsert: true,
          },
        });
      }
      await startOperations(Member, ops, operations);
    }
  }
}

export async function createPresences(
  shard: ShardProxy,
  presences?: Array<IPresence>,
) {
  if (presences && presences.length) {
    const _shardId = shard.shardId;
    const { Presence } = shard.models;
    const operations = shard.models.operations.presences;

    if (Presence) {
      const ops = (operations.time) ? operations.ops : [];
      for (const presence of presences) {
        const update = <any> presence;
        update._shardId = _shardId;

        ops.push({
          updateOne: {
            filter: {guild_id: presence.guild_id, user_id: presence.user_id, _shardId},
            update: {$set: update},
            upsert: true,
          },
        });
      }
      await startOperations(Presence, ops, operations);
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
    const operations = shard.models.operations.roles;

    if (Role) {
      const ops = (operations.time) ? operations.ops : [];
      for (const role of roles) {
        const update = <any> role;
        update._shardId = _shardId;

        ops.push({
          updateOne: {
            filter: {guild_id: role.guild_id, id: role.id, _shardId},
            update: {$set: update},
            upsert: true,
          },
        });
      }
      await startOperations(Role, ops, operations);
    }
  }
}

export async function createUsers(
  shard: ShardProxy,
  users?: Array<IUser>,
) {
  if (users && users.length) {
    const _shardId = shard.shardId;
    const { User } = shard.models;
    const operations = shard.models.operations.users;

    if (User) {
      const ops = (operations.time) ? operations.ops : [];
      for (const user of users) {
        const update = <any> user;
        update._shardId = _shardId;

        ops.push({
          updateOne: {
            filter: {id: user.id, _shardId},
            update: {$set: update},
            upsert: true,
          },
        });
      }
      await startOperations(User, ops, operations);
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
    const operations = shard.models.operations.voiceStates;

    if (VoiceState) {
      const ops = (operations.time) ? operations.ops : [];
      for (const voiceState of voiceStates) {
        const update = <any> voiceState;
        update._shardId = _shardId;

        ops.push({
          updateOne: {
            filter: {server_id: voiceState.server_id, user_id: voiceState.user_id, _shardId},
            update: {$set: update},
            upsert: true,
          },
        });
      }
      await startOperations(VoiceState, ops, operations);
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
      // @ts-ignore
      guild.channels = undefined;
    }

    if (guild.emojis) {
      for (const raw of guild.emojis) {
        const emoji = <any> raw;
        emoji.guild_id = guild.id;
        emojis.push(emoji);
      }
      // @ts-ignore
      guild.emojis = undefined;
    }

    if (guild.members) {
      for (const raw of guild.members) {
        const member = <any> raw;
        member.guild_id = guild.id;
        member.user_id = member.user.id;
        members.push(member);
        users.push(member.user);
      }
      // @ts-ignore
      guild.members = undefined;
    }

    if (guild.presences) {
      for (const raw of guild.presences) {
        const presence = <any> raw;
        presence.guild_id = guild.id;
        presence.user_id = presence.user.id;
        presences.push(presence);
      }
      // @ts-ignore
      guild.presences = undefined;
    }

    if (guild.roles) {
      for (const raw of guild.roles) {
        const role = <any> raw;
        role.guild_id = guild.id;
        roles.push(role);
      }
      // @ts-ignore
      guild.roles = undefined;
    }

    if (guild.voice_states) {
      for (const raw of guild.voice_states) {
        const voiceState = <any> raw;
        voiceState.guild_id = guild.id;
        voiceState.server_id = guild.id;
        voiceStates.push(voiceState);
      }
      // @ts-ignore
      guild.voice_states = undefined;
    }
  }

  await createMembers(shard, members);
  await createUsers(shard, users);

  await createGuilds(shard, guilds);
  await createChannels(shard, channels);
  await createEmojis(shard, emojis);
  await createPresences(shard, presences);
  await createRoles(shard, roles);
  await createVoiceStates(shard, voiceStates);

  /*
  setImmediate(createGuilds, shard, guilds);
  setImmediate(createChannels, shard, channels);
  setImmediate(createEmojis, shard, emojis);
  setImmediate(createMembers, shard, members);
  setImmediate(createPresences, shard, presences);
  setImmediate(createRoles, shard, roles);
  setImmediate(createUsers, shard, users);
  setImmediate(createVoiceStates, shard, voiceStates);
  */
  /*
  await Promise.all([
    createGuilds(shard, guilds),
    createChannels(shard, channels),
    createEmojis(shard, emojis),
    createMembers(shard, members),
    createPresences(shard, presences),
    createRoles(shard, roles),
    createUsers(shard, users),
    createVoiceStates(shard, voiceStates),
  ]);
  */
}


export async function startOperations(
  Model: MongooseModel<any>,
  ops: Array<any>,
  operations: ModelOperation,
) {
  if (ops.length) {
    if (operations.time) {
      if (!operations.timer.hasStarted) {
        const handler = async () => {
          const cloned = ops.slice(0);
          ops.length = 0;
          await Model.bulkWrite(cloned, <any> DefaultBulkWriteOptions);
          if (ops.length) {
            operations.timer.start(operations.time, handler, false);
          }
        };
        operations.timer.start(operations.time, handler, false);
      }
    } else {
      await Model.bulkWrite(ops, <any> DefaultBulkWriteOptions);
    }
  }
}
