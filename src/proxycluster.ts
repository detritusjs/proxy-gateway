import { Client as DetritusRestClient } from 'detritus-client-rest';
import { BaseCollection, EventEmitter, Timers } from 'detritus-utils';

import { ProxyClusterProcessChild } from './cluster/processchild';
import { AuthTypes } from './constants';
import {
  ShardProxy,
  ShardProxyOptions,
  ShardProxyRunOptions,
} from './proxy';
import { Models } from './models';


export interface ProxyClusterOptions extends ShardProxyOptions {
  shardCount?: number,
  shards?: [number, number],
}

export interface ProxyClusterRunOptions extends ShardProxyRunOptions {
  delay?: number,
  shardCount?: number,
}

export class ProxyCluster extends EventEmitter {
  readonly manager?: ProxyClusterProcessChild;
  readonly models: Models;
  readonly rest: DetritusRestClient;
  readonly shards = new BaseCollection<number, ShardProxy>();
  readonly token: string;

  ran: boolean = false;
  shardCount: number = 0;
  shardEnd: number = -1;
  shardStart: number = 0;
  shardOptions: ShardProxyOptions = {};

  constructor(
    token: string,
    options: ProxyClusterOptions = {},
  ) {
    super();
    options = Object.assign({}, options);

    if (process.env.CLUSTER_MANAGER === 'true') {
      token = <string> process.env.CLUSTER_TOKEN;
      options.shardCount = +(<string> process.env.CLUSTER_SHARD_COUNT);
      options.shards = [
        +(<string> process.env.CLUSTER_SHARD_START),
        +(<string> process.env.CLUSTER_SHARD_END),
      ];
    }

    if (!token) {
      throw new Error('A Token is required for this library to work.');
    }
    this.token = token;

    this.shardCount = +(options.shardCount || this.shardCount);
    if (Array.isArray(options.shards)) {
      if (options.shards.length !== 2) {
        throw new Error('Shards need to be in the format of [shardStart, shardEnd]');
      }
      const [shardStart, shardEnd] = options.shards;
      this.shardEnd = +shardEnd;
      this.shardStart = +shardStart;
    }

    this.models = new Models();

    Object.assign(this.shardOptions, options);
    this.shardOptions.isBot = true;
    this.shardOptions.rest = Object.assign({}, this.shardOptions.rest);
    this.shardOptions.rest.authType = AuthTypes.BOT;

    this.rest = new DetritusRestClient(token, this.shardOptions.rest);
    this.shardOptions.rest.globalBucket = this.rest.globalBucket;

    this.shardOptions.cluster = this;
    this.shardOptions.models = this.models;

    if (process.env.CLUSTER_MANAGER === 'true') {
      this.manager = new ProxyClusterProcessChild(this);
    }
  }

  setShardCount(value: number): void {
    Object.defineProperty(this, 'shardCount', {value});
  }

  setShardEnd(value: number): void {
    Object.defineProperty(this, 'shardEnd', {value});
  }

  setShardStart(value: number): void {
    Object.defineProperty(this, 'shardStart', {value});
  }

  kill(): void {
    if (this.ran) {
      for (let [shardId, shard] of this.shards) {
        shard.kill();
      }
      this.shards.clear();
      Object.defineProperty(this, 'ran', {value: false});
      this.emit('killed');
      this.clearListeners();
    }
  }

  async run(
    dbUrl: string,
    options: ProxyClusterRunOptions = {},
  ): Promise<ProxyCluster> {
    if (this.ran) {
      return this;
    }
    options = Object.assign({
      delay: 5000,
      url: process.env.GATEWAY_URL,
    }, options);

    const maxDelay = +(<number> options.delay);

    let shardCount: number = options.shardCount || this.shardCount || 0;
    if (!options.url || !shardCount) {
      const data = await this.rest.fetchGatewayBot();
      shardCount = shardCount || data.shards;
      options.url = options.url || data.url;
    }
    if (!shardCount) {
      throw new Error('Shard Count cannot be 0, pass in one via the options or the constructor.');
    }
    this.setShardCount(shardCount);
    if (this.shardEnd === -1) {
      this.setShardEnd(shardCount - 1);
    }

    await this.models.connect(dbUrl, options.dbOptions);

    for (let shardId = this.shardStart; shardId <= this.shardEnd; shardId++) {
      const now = Date.now();
      const shardOptions = Object.assign({}, this.shardOptions);
      shardOptions.gateway = Object.assign({}, shardOptions.gateway, {shardCount, shardId});

      const shard = new ShardProxy(this.token, shardOptions);
      this.shards.set(shardId, shard);
      await shard.run(dbUrl, options);

      const took = Date.now() - now;
      if (shardId < this.shardEnd) {
        const delay = Math.min(maxDelay, Math.max(maxDelay - took, 0));
        if (delay) {
          await Timers.sleep(delay);
        }
      }
    }
    Object.defineProperty(this, 'ran', {value: true});
    this.emit('ready');
    return this;
  }

  on(event: string, listener: Function): this;
  on(event: 'killed', listener: () => any): this;
  on(event: 'ready', listener: () => any): this;
  on(event: string, listener: Function): this {
    super.on(event, listener);
    return this;
  }
}
