import { Model } from 'mongoose';

import { MockGateway } from './mockgateway';
import {
  ChannelSchema,
  OverwriteSchema,
  UserSchema,
  TChannelSchema,
  TOverwriteSchema,
  TUserSchema,
} from './schemas';


export class Models {
  mock: MockGateway;

  Channel?: Model<TChannelSchema>;
  Overwrite?: Model<TOverwriteSchema>;
  User?: Model<TUserSchema>;

  constructor(mock: MockGateway) {
    this.mock = mock;
  }

  get mongoose() {
    return this.mock.mongoose;
  }

  intialize() {
    this.Channel = this.mongoose.model<TChannelSchema>('Channel', ChannelSchema, 'channels');
    this.Overwrite = this.mongoose.model<TOverwriteSchema>('Overwrite', OverwriteSchema, 'overwrites');
    this.User = this.mongoose.model<TUserSchema>('User', UserSchema, 'users');
  }
}
