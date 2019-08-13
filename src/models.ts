import { Model } from 'mongoose';

import { MockGateway } from './mockgateway';
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


const ModelKeys = [
  'Channel',
  'Emoji',
  'Guild',
  'Member',
  'Presence',
  'Role',
  'User',
  'VoiceState',
];


export class Models {
  mock: MockGateway;

  Channel?: Model<TChannelSchema>;
  Emoji?: Model<TEmojiSchema>;
  Guild?: Model<TGuildSchema>;
  Member?: Model<TMemberSchema>;
  Presence?: Model<TPresenceSchema>;
  Role?: Model<TRoleSchema>;
  User?: Model<TUserSchema>;
  VoiceState?: Model<TVoiceStateSchema>;

  constructor(mock: MockGateway) {
    this.mock = mock;
  }

  get mongoose() {
    return this.mock.mongoose;
  }

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

  async reset() {
    const _shardId = this.mock.shardId;
    for (let key in ModelKeys) {
      if (key in this) {
        const model = <Model<any>> (<any> this)[key];
        if (model) {
          await model.deleteMany({_shardId});
        }
      }
    }
  }
}
