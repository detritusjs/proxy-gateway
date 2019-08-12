import { Mongoose } from 'mongoose';
import { Gateway } from 'detritus-client-socket';

import { GatewayHandler, GatewayHandlerOptions } from './gateway/handler';
import { Models } from './models';


export interface GatewayOptions extends Gateway.SocketOptions, GatewayHandlerOptions {

}

export interface MockGatewayOptions {
  gateway?: GatewayOptions,
}

export interface MockGatewayRunOptions {
  wait?: boolean,
}

export class MockGateway {
  gateway: Gateway.Socket;
  handler: GatewayHandler;
  models: Models;
  mongoose: Mongoose;

  constructor(token: string, options: MockGatewayOptions = {}) {
    this.gateway = new Gateway.Socket(token, options.gateway);
    this.mongoose = new Mongoose();

    this.handler = new GatewayHandler(this, options.gateway);
    this.models = new Models(this);
  }

  get db() {
    return this.mongoose.connection;
  }

  get shardCount(): number {
    return this.gateway.shardCount;
  }

  get shardId(): number {
    return this.gateway.shardId;
  }

  async reset(): Promise<void> {
    const {
      Channel,
      Overwrite,
      User,
    } = this.models;

    if (Channel) {
      await Channel.deleteMany({_shardId: this.shardId});
    }
    if (Overwrite) {
      await Overwrite.deleteMany({_shardId: this.shardId});
    }
    if (User) {
      await User.deleteMany({_shardId: this.shardId});
    }
  }

  async run(
    url: string,
    mongoUrl: string,
    options: MockGatewayRunOptions = {},
  ): Promise<MockGateway> {
    await this.mongoose.connect(mongoUrl, {
      dbName: 'detritus',
      useNewUrlParser: true,
    });
    this.models.intialize();

    this.gateway.connect(url);

    const wait = options.wait || options.wait === undefined;
    await new Promise((resolve) => {
      if (wait) {
        this.gateway.once('ready', resolve);
      } else {
        resolve();
      }
    });
    return this;
  }
}
