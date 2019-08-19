import { Document, Schema } from 'mongoose';

import { GatewayRawEvents } from './gateway/rawevents';
import { deleteEmpty } from './utils';



export const OverwriteSchema = new Schema({
  allow: Number,
  deny: Number,
  id: String,
  type: String,
});



export interface IChannel extends GatewayRawEvents.RawChannel {
  recipient_ids?: Array<string>,
}

export type TChannelSchema = IChannel & Document;

export const ChannelSchema = new Schema({
  _shardId: {index: true, type: Number},
  bitrate: {set: deleteEmpty, type: Number},
  guild_id: {index: true, set: deleteEmpty, type: String},
  id: {index: true, type: String},
  last_message_id: {set: deleteEmpty, type: String},
  last_pin_timestamp: {set: deleteEmpty, type: String},
  name: String,
  //nicks
  nsfw: {set: deleteEmpty, type: Boolean},
  owner_id: {set: deleteEmpty, type: String},
  parent_id: {set: deleteEmpty, type: String},
  permission_overwrites: {set: deleteEmpty, type: [OverwriteSchema]},
  position: {set: deleteEmpty, type: Number},
  rate_limit_per_user: {set: deleteEmpty, type: Number},
  recipient_ids: {set: deleteEmpty, type: [String]},
  //recipients
  topic: {set: deleteEmpty, type: String},
  type: Number,
  user_limit: {set: deleteEmpty, type: Number},
});
ChannelSchema.index({
  _shardId: 1,
  id: 1,
}, {unique: true});



export interface IEmoji {
  animated: boolean,
  available: boolean,
  guild_id: string,
  id: string,
  name: string,
  managed: boolean,
  require_colons: boolean,
  roles: Array<string>,
}

export type TEmojiSchema = IEmoji & Document;

export const EmojiSchema = new Schema({
  _shardId: {index: true, type: Number},
  animated: Boolean,
  available: Boolean,
  guild_id: {index: true, type: String},
  id: {index: true, type: String},
  name: String,
  managed: Boolean,
  require_colons: Boolean,
  roles: [String],
});
EmojiSchema.index({
  _shardId: 1,
  guild_id: 1,
  id: 1,
}, {unique: true});



export interface IGuild {
  afk_channel_id: null | string,
  afk_timeout: number,
  application_id: null | string,
  banner: null | string,
  default_message_notifications: number,
  embed_channel_id: null | string,
  embed_enabled: boolean,
  explicit_content_filter: number,
  features: Array<string>,
  guild_id: string,
  icon: null | string,
  id: string,
  max_members: number,
  max_presences: number,
  mfa_level: number,
  name: string,
  owner_id: string,
  preferred_locale: null | string,
  premium_subscription_count: number,
  premium_tier: number,
  region: string,
  splash: null | string,
  system_channel_flags: number,
  system_channel_id: null | string,
  unavailable: boolean,
  vanity_url_code: null | string,
  verification_level: number,
  widget_channel_id: null | number,
  widget_enabled: boolean,
}

export type TGuildSchema = IGuild & Document;

export const GuildSchema = new Schema({
  _shardId: {index: true, type: Number},
  afk_channel_id: String,
  afk_timeout: Number,
  application_id: {set: deleteEmpty, type: String},
  banner: String,
  default_message_notifications: Number,
  embed_channel_id: String,
  embed_enabled: Boolean,
  explicit_content_filter: Number,
  features: [String],
  icon: String,
  id: {index: true, type: String},
  max_members: Number,
  max_presences: Number,
  member_count: Number,
  mfa_level: Number,
  name: String,
  owner_id: String,
  preferred_locale: {set: deleteEmpty, type: String},
  premium_subscription_count: Number,
  premium_tier: Number,
  region: String,
  splash: String,
  system_channel_flags: Number,
  system_channel_id: String,
  unavailable: Boolean,
  vanity_url_code: String,
  verification_level: Number,
  widget_channel_id: String,
  widget_enabled: Boolean,
});
GuildSchema.index({
  _shardId: 1,
  id: 1,
}, {unique: true});



export interface IMember extends GatewayRawEvents.RawMember {
  deaf: boolean,
  guild_id: String,
  joined_at: string,
  mute: boolean,
  nick: null | string,
  premium_since: null | string,
  roles: Array<string>,
  user_id: String,
}

export type TMemberSchema = IMember & Document;

export const MemberSchema = new Schema({
  _shardId: {index: true, type: Number},
  deaf: Boolean,
  guild_id: {index: true, type: String},
  mute: Boolean,
  nick: {set: deleteEmpty, type: String},
  premium_since: {set: deleteEmpty, type: String},
  roles: [String],
  user_id: {index: true, type: String},
});
MemberSchema.index({
  _shardId: 1,
  guild_id: 1,
  user_id: 1,
}, {unique: true});



export const PresenceActivitySchema = new Schema({
  application_id: {set: deleteEmpty, type: String},
  assets: {
    set: deleteEmpty,
    type: {
      large_image: {set: deleteEmpty, type: String},
      large_text: {set: deleteEmpty, type: String},
      small_image: {set: deleteEmpty, type: String},
      small_text: {set: deleteEmpty, type: String},
    },
  },
  created_at: {set: deleteEmpty, type: Number},
  details: {set: deleteEmpty, type: String},
  flags: {set: deleteEmpty, type: Number},
  id: {set: deleteEmpty, type: String},
  instance: {set: deleteEmpty, type: Boolean},
  metadata: {set: deleteEmpty, type: Schema.Types.Mixed},
  name: String,
  party: {
    set: deleteEmpty,
    type: {
      id: {set: deleteEmpty, type: String},
      size: {set: deleteEmpty, type: [Number]},
    },
  },
  secrets: {
    set: deleteEmpty,
    type: {
      join: {set: deleteEmpty, type: String},
      match: {set: deleteEmpty, type: String},
      spectate: {set: deleteEmpty, type: String},
    },
  },
  session_id: {set: deleteEmpty, type: String},
  state: {set: deleteEmpty, type: String},
  sync_id: {set: deleteEmpty, type: String},
  timestamps: {
    set: deleteEmpty,
    type: {
      end: {set: deleteEmpty, type: Number},
      start: Number,
    },
  },
  type: Number,
  url: {set: deleteEmpty, type: String},
});


export interface IPresence {
  activities: Array<GatewayRawEvents.RawPresenceActivity>,
  guild_id: string,
  client_status: {
    desktop?: string,
    mobile?: string,
    web?: string,
  },
  game: GatewayRawEvents.RawPresenceActivity,
  last_modified?: number,
  status: string,
  user_id: string,
}

export type TPresenceSchema = IPresence & Document;

export const PresenceSchema = new Schema({
  _shardId: {index: true, type: Number},
  activities: [PresenceActivitySchema],
  client_status: {
    desktop: {set: deleteEmpty, type: String},
    mobile: {set: deleteEmpty, type: String},
    web: {set: deleteEmpty, type: String},
  },
  game: {set: deleteEmpty, type: PresenceActivitySchema},
  guild_id: {index: true, type: String},
  last_modified: {set: deleteEmpty, type: Number},
  status: String,
  user_id: {index: true, type: String},
});
PresenceSchema.index({
  _shardId: 1,
  guild_id: 1,
  user_id: 1,
}, {unique: true});



export interface IRole {
  color: number,
  guild_id: string,
  hoist: boolean,
  id: string,
  managed: boolean,
  mentionable: boolean,
  name: string,
  permissions: number,
  position: number,
}

export type TRoleSchema = IRole & Document;

export const RoleSchema = new Schema({
  _shardId: {index: true, type: Number},
  color: Number,
  guild_id: {index: true, type: String},
  hoist: Boolean,
  id: {index: true, type: String},
  manage: Boolean,
  mentionable: Boolean,
  name: String,
  permissions: Number,
  position: Number,
});
RoleSchema.index({
  _shardId: 1,
  guild_id: 1,
  id: 1,
}, {unique: true});



export interface IUser {
  avatar: null | string,
  bot: boolean,
  discriminator: string,
  email?: string,
  flags?: number,
  locale?: string,
  id: string,
  mfa_enabled?: boolean,
  phone?: string,
  premium_type?: number,
  username: string,
  verified?: boolean,
}

export type TUserSchema = IUser & Document;

export const UserSchema = new Schema({
  _shardId: {index: true, type: Number},
  avatar: String,
  bot: Boolean,
  email: {set: deleteEmpty, type: String},
  discriminator: String,
  flags: {set: deleteEmpty, type: Number},
  id: {index: true, type: String},
  locale: {set: deleteEmpty, type: String},
  mfa_enabled: {set: deleteEmpty, type: Boolean},
  phone: {set: deleteEmpty, type: String},
  premium_type: {set: deleteEmpty, type: Number},
  username: String,
  verified: {set: deleteEmpty, type: Boolean},
});
UserSchema.index({
  _shardId: 1,
  id: 1,
}, {unique: true});



export interface IVoiceState {
  channel_id: string,
  deaf: boolean,
  guild_id?: string,
  mute: boolean,
  self_deaf: boolean,
  self_mute: boolean,
  self_stream: boolean,
  self_video: boolean,
  server_id: string,
  session_id: string,
  suppress: boolean,
  user_id: string,
}

export type TVoiceStateSchema = IRole & Document;

export const VoiceStateSchema = new Schema({
  _shardId: {index: true, type: Number},
  channel_id: {index: true, set: deleteEmpty, type: String},
  deaf: Boolean,
  guild_id: {index: true, set: deleteEmpty, type: String},
  mute: Boolean,
  self_deaf: Boolean,
  self_mute: Boolean,
  self_stream: Boolean,
  self_video: Boolean,
  server_id: {index: true, type: String},
  session_id: String,
  suppress: Boolean,
  user_id: {index: true, type: String},
});
VoiceStateSchema.index({
  _shardId: 1,
  server_id: 1,
  user_id: 1,
}, {unique: true});


GuildSchema.virtual('channels', {
  ref: 'Channel',
  localField: 'id',
  foreignField: 'guild_id',
  justOne: false,
});
GuildSchema.virtual('emojis', {
  ref: 'Emoji',
  localField: 'id',
  foreignField: 'guild_id',
  justOnce: false,
});
GuildSchema.virtual('members', {
  ref: 'Member',
  localField: 'id',
  foreignField: 'guild_id',
  justOne: false,
});
GuildSchema.virtual('presences', {
  ref: 'Presence',
  localField: 'id',
  foreignField: 'guild_id',
  justOne: false,
});
GuildSchema.virtual('roles', {
  ref: 'Role',
  localField: 'id',
  foreignField: 'guild_id',
  justOne: false,
});
GuildSchema.virtual('voicestates', {
  ref: 'VoiceState',
  localField: 'id',
  foreignField: 'guild_id',
  justOne: false,
});
MemberSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: 'id',
  justOne: true,
});
PresenceSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: 'id',
  justOne: true,
});
