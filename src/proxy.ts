import { Model } from 'mongoose';

import {
  Client as DetritusRestClient,
  ClientOptions as RestOptions
} from 'detritus-client-rest';
import { Gateway } from 'detritus-client-socket';
import { EventEmitter } from 'detritus-utils';

import { AuthTypes } from './constants';
import { GatewayHandler, GatewayHandlerOptions } from './gateway/handler';
import { ProxyCluster } from './proxycluster';
import { Models, ModelKeys } from './models';


export interface GatewayOptions extends Gateway.SocketOptions, GatewayHandlerOptions {

}

export interface ShardProxyOptions {
  cluster?: ProxyCluster,
  isBot?: boolean,
  gateway?: GatewayOptions,
  models?: Models,
  rest?: RestOptions,
}

export interface ShardProxyRunOptions {
  dbOptions?: Object,
  url?: string,
  wait?: boolean,
}

export class ShardProxy extends EventEmitter {
  readonly cluster?: ProxyCluster;
  readonly gateway: Gateway.Socket;
  readonly handler: GatewayHandler;
  readonly models: Models;
  readonly rest: DetritusRestClient;

  ran: boolean = false;

  constructor(token: string, options: ShardProxyOptions) {
    super();
    if (!token) {
      throw new Error('Token is required for this library to work.');
    }

    options = Object.assign({isBot: true}, options);

    this.cluster = options.cluster;
    this.gateway = new Gateway.Socket(token, options.gateway);

    this.handler = new GatewayHandler(this, options.gateway);
    this.models = options.models || new Models();
    this.rest = new DetritusRestClient(token, Object.assign({
      authType: (options.isBot) ? AuthTypes.BOT : AuthTypes.USER,
    }, options.rest));
  }

  get db() {
    return this.mongoose.connection;
  }

  get mongoose() {
    return this.models.mongoose;
  }

  get shardCount(): number {
    return this.gateway.shardCount;
  }

  get shardId(): number {
    return this.gateway.shardId;
  }

  kill(): void {
    this.gateway.kill();
    this.reset();
  }

  async reset(): Promise<void> {
    const _shardId = this.shardId;
    const models = this.models;
    for (const key of ModelKeys) {
      if (key in models) {
        const model = <Model<any>> (<any> models)[key];
        if (model) {
          await model.deleteMany({_shardId});
        }
      }
    }
  }

  async run(
    dbUrl: string,
    options: ShardProxyRunOptions = {},
  ): Promise<ShardProxy> {
    if (!this.ran) {
      this.ran = true;
      await this.models.connect(dbUrl, options.dbOptions);

      let gatewayUrl = options.url;
      if (!gatewayUrl) {
        const data = await this.rest.fetchGateway();
        gatewayUrl = data.url;
      }
      this.gateway.connect(gatewayUrl);

      const wait = options.wait || options.wait === undefined;
      await new Promise((resolve) => {
        if (wait) {
          this.gateway.once('ready', resolve);
        } else {
          resolve();
        }
      });
    }
    return this;
  }
}
