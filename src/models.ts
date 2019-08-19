import { Model, Mongoose } from 'mongoose';

import { Timers } from 'detritus-utils';

import {
  ChannelSchema,
  EmojiSchema,
  GuildSchema,
  MemberSchema,
  PresenceSchema,
  RoleSchema,
  UserSchema,
  VoiceStateSchema,
  TChannelSchema,
  TEmojiSchema,
  TGuildSchema,
  TMemberSchema,
  TPresenceSchema,
  TRoleSchema,
  TUserSchema,
  TVoiceStateSchema,
} from './schemas';



export interface ModelOperation {
  ops: Array<any>,
  time: number,
  timer: Timers.Timeout,
}

export const ModelKeys = Object.freeze([
  'Channel',
  'Emoji',
  'Guild',
  'Member',
  'Presence',
  'Role',
  'User',
  'VoiceState',
]);

export class Models {
  readonly mongoose = new Mongoose();
  readonly operations: {[key: string]: ModelOperation} = {
    channels: {
      ops: [],
      time: 0,
      timer: new Timers.Timeout(),
    },
    emojis: {
      ops: [],
      time: 0,
      timer: new Timers.Timeout(),
    },
    guilds: {
      ops: [],
      time: 0,
      timer: new Timers.Timeout(),
    },
    members: {
      ops: [],
      time: 100,
      timer: new Timers.Timeout(),
    },
    presences: {
      ops: [],
      time: 100,
      timer: new Timers.Timeout(),
    },
    roles: {
      ops: [],
      time: 0,
      timer: new Timers.Timeout(),
    },
    users: {
      ops: [],
      time: 100,
      timer: new Timers.Timeout(),
    },
    voiceStates: {
      ops: [],
      time: 0,
      timer: new Timers.Timeout(),
    },
  };

  ran: boolean = false;

  Channel?: Model<TChannelSchema>;
  Emoji?: Model<TEmojiSchema>;
  Guild?: Model<TGuildSchema>;
  Member?: Model<TMemberSchema>;
  Presence?: Model<TPresenceSchema>;
  Role?: Model<TRoleSchema>;
  User?: Model<TUserSchema>;
  VoiceState?: Model<TVoiceStateSchema>;

  intialize() {
    this.Channel = this.mongoose.model<TChannelSchema>('Channel', ChannelSchema, 'channels');
    this.Emoji = this.mongoose.model<TEmojiSchema>('Emoji', EmojiSchema, 'emojis');
    this.Guild = this.mongoose.model<TGuildSchema>('Guild', GuildSchema, 'guilds');
    this.Member = this.mongoose.model<TMemberSchema>('Member', MemberSchema, 'members');
    this.Presence = this.mongoose.model<TPresenceSchema>('Presence', PresenceSchema, 'presences');
    this.Role = this.mongoose.model<TRoleSchema>('Role', RoleSchema, 'roles');
    this.User = this.mongoose.model<TUserSchema>('User', UserSchema, 'users');
    this.VoiceState = this.mongoose.model<TVoiceStateSchema>('VoiceState', VoiceStateSchema, 'voicestates');
  }

  async connect(url: string, options: any): Promise<this> {
    if (!this.ran) {
      await this.mongoose.connect(url, Object.assign({
        dbName: 'detritus',
        poolSize: 12,
        useCreateIndex: true,
        useNewUrlParser: true,
      }, options));
      this.intialize();
      this.ran = true;
    }
    return this;
  }
}
