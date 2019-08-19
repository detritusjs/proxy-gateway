import * as path from 'path';

import { Client as DetritusRestClient } from 'detritus-client-rest';
import { BaseCollection, EventEmitter, Timers } from 'detritus-utils';

import { ProxyClusterProcess } from './cluster/process';
import { AuthTypes } from './constants';


export interface ProxyClusterManagerOptions {
  isAbsolute?: boolean,
  respawn?: boolean,
  shardCount?: number,
  shards?: [number, number],
  shardsPerCluster?: number,
}

export interface ProxyClusterManagerRunOptions {
  delay?: number,
  shardCount?: number,
  url?: string,
}

export class ProxyClusterManager {
  readonly file: string;
  readonly processes = new BaseCollection<number, ProxyClusterProcess>();
  readonly rest: DetritusRestClient;
  readonly token: string;

  ran: boolean = false;
  respawn: boolean = true;
  shardCount: number = 0;
  shardEnd: number = -1;
  shardStart: number = 0;
  shardsPerCluster: number = 6;

  constructor(
    file: string,
    token: string,
    options: ProxyClusterManagerOptions = {},
  ) {
    this.file = file;
    if (!options.isAbsolute) {
      if (require.main) {
        this.file = path.join(path.dirname(require.main.filename), this.file);
      }
    }
    if (!token) {
      throw new Error('Token is required for this library to work.');
    }
    this.token = token;

    this.respawn = (options.respawn || options.respawn === undefined);
    this.rest = new DetritusRestClient(token, {authType: AuthTypes.BOT});

    this.shardCount = +(options.shardCount || this.shardCount);
    if (Array.isArray(options.shards)) {
      if (options.shards.length !== 2) {
        throw new Error('Shards need to be in the format of [shardStart, shardEnd]');
      }
      const [shardStart, shardEnd] = options.shards;
      this.shardEnd = +shardEnd;
      this.shardStart = +shardStart;
    }
    this.shardsPerCluster = +(options.shardsPerCluster || this.shardsPerCluster);

    Object.defineProperties(this, {
      ran: {configurable: true, writable: false},
      rest: {enumerable: false, writable: false},
      token: {enumerable: false, writable: false},
    });

    process.env.CLUSTER_MANAGER = String(true);
    process.env.CLUSTER_TOKEN = this.token;
  }

  async run(
    options: ProxyClusterManagerRunOptions = {},
  ): Promise<ProxyClusterManager> {
    if (this.ran) {
      return this;
    }
    options = Object.assign({
      delay: 5000,
    }, options);

    const _delay = +(<number> options.delay);

    let shardCount: number = +(options.shardCount || this.shardCount || 0);
    let url: string = options.url || '';
    if (!url || !shardCount) {
      const data = await this.rest.fetchGatewayBot();
      shardCount = shardCount || data.shards;
      url = url || data.url;
    }
    if (!shardCount) {
      throw new Error('Shard Count cannot be 0, pass in one via the options or the constructor.');
    }
    this.shardCount = shardCount;
    if (this.shardEnd === -1) {
      this.shardEnd = shardCount - 1;
    }

    let clusterId = 0;
    for (let shardStart = this.shardStart; shardStart <= this.shardEnd; shardStart += this.shardsPerCluster) {
      const now = Date.now();

      shardStart = Math.min(shardStart, this.shardEnd);
      const shardEnd = Math.min(shardStart + this.shardsPerCluster - 1, this.shardEnd);

      const clusterProcess = new ProxyClusterProcess(this, {
        clusterId,
        env: {GATEWAY_URL: url},
        shardCount,
        shardEnd,
        shardStart,
      });
      this.processes.set(clusterId, clusterProcess);
      await clusterProcess.run();

      const took = Date.now() - now;
      if (shardEnd < this.shardEnd) {
        const maxDelay = (_delay * (shardEnd - shardStart));
        // const delay = Math.min(maxDelay, Math.max(maxDelay - took, 0));
        const delay = maxDelay;
        if (delay) {
          await Timers.sleep(delay);
        }
      }

      clusterId++;
    }
    Object.defineProperty(this, 'ran', {value: true});
    return this;
  }

  async broadcast(message: any): Promise<Array<any>> {
    const promises = this.processes.map((clusterProcess) => {
      return clusterProcess.send(message);
    });
    return Promise.all(promises);
  }
}
