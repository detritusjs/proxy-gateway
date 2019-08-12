import { Document, Schema } from 'mongoose';

import { GatewayRawEvents } from './gateway/rawevents';
import { deleteEmpty } from './utils';


export interface IOverwrite extends GatewayRawEvents.RawChannelOverwrite {
  channel_id: string,
}

export type TOverwriteSchema = IOverwrite & Document;

export const OverwriteSchema = new Schema({
  _shardId: {index: true, type: Number},
  allow: Number,
  channel_id: String,
  deny: Number,
  id: String,
  type: String,
});
OverwriteSchema.index({
  _shardId: 1,
  channel_id: 1,
  id: 1,
}, {unique: true});
OverwriteSchema.index({
  _shardId: 1,
  channel_id: 1,
});


export interface IChannel extends GatewayRawEvents.RawChannel {

}

export type TChannelSchema = IChannel & Document;

export const ChannelSchema = new Schema({
  _shardId: {index: true, type: Number},
  bitrate: {set: deleteEmpty, type: Number},
  guild_id: {set: deleteEmpty, type: String},
  id: String,
  last_message_id: {set: deleteEmpty, type: String},
  last_pin_timestamp: {set: deleteEmpty, type: String},
  name: String,
  //nicks
  nsfw: {set: deleteEmpty, type: Boolean},
  owner_id: {set: deleteEmpty, type: String},
  parent_id: {set: deleteEmpty, type: String},
  //permission_overwrites: [{type: Schema.Types.ObjectId, ref: 'Overwrite'}],
  //permission_overwrites: {set: deleteEmpty, type: [OverwriteSchema]},
  position: {set: deleteEmpty, type: Number},
  rate_limit_per_user: {set: deleteEmpty, type: Number},
  //recipients
  topic: {set: deleteEmpty, type: String},
  type: Number,
  user_limit: {set: deleteEmpty, type: Number},
});
ChannelSchema.index({
  _shardId: 1,
  id: 1,
}, {unique: true});
ChannelSchema.index({
  _shardId: 1,
  guild_id: 1,
});


export interface IUser extends GatewayRawEvents.RawUserMe {

}

export type TUserSchema = IUser & Document;

export const UserSchema = new Schema({
  _shardId: {index: true, type: Number},
  avatar: String,
  bot: Boolean,
  email: {set: deleteEmpty, type: String},
  discriminator: String,
  flags: {set: deleteEmpty, type: Number},
  id: String,
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
