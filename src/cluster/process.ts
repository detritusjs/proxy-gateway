import { ChildProcess, fork } from 'child_process';

import { EventEmitter, Timers } from 'detritus-utils';

import { ProxyClusterManager } from '../proxyclustermanager';
import { ClusterIPCOpCodes } from '../constants';

import { ClusterIPCTypes } from './ipctypes';


export interface ProxyClusterProcessOptions {
  clusterId: number,
  env: {[key: string]: string | undefined},
  shardCount: number,
  shardEnd: number,
  shardStart: number,
}

export interface ProxyClusterProcessRunOptions {
  timeout?: number,
  wait?: boolean,
}

export class ProxyClusterProcess extends EventEmitter {
  readonly clusterId: number = -1;
  readonly env: {[key: string]: string | undefined} = {};
  readonly manager: ProxyClusterManager;

  process: ChildProcess | null = null;

  constructor(
    manager: ProxyClusterManager,
    options: ProxyClusterProcessOptions,
  ) {
    super();
    this.manager = manager;
    this.clusterId = options.clusterId;

    Object.assign(this.env, process.env, options.env, {
      CLUSTER_ID: String(this.clusterId),
      CLUSTER_SHARD_COUNT: String(options.shardCount),
      CLUSTER_SHARD_END: String(options.shardEnd),
      CLUSTER_SHARD_START: String(options.shardStart),
    });

    Object.defineProperties(this, {
      clusterId: {writable: false},
      manager: {enumerable: false, writable: false},
    });
  }

  get file(): string {
    return this.manager.file;
  }

  async onMessage(
    message: ClusterIPCTypes.IPCMessage | any,
  ): Promise<void> {
    // our child has sent us something
    if (message && typeof(message) === 'object') {
      try {
        switch (message.op) {
          case ClusterIPCOpCodes.READY: {
            this.emit('ready');
          }; return;
          case ClusterIPCOpCodes.DISCONNECT: {
            this.emit('disconnect');
          }; return;
          case ClusterIPCOpCodes.RECONNECTING: {
            this.emit('reconnecting');
          }; return;
          case ClusterIPCOpCodes.RESPAWN_ALL: {
            
          }; return;
        }
      } catch(error) {
        this.emit('warn', error);
      }
    }
    this.emit('message', message);
  }

  async onExit(code: number, signal: string): Promise<void> {
    this.emit('killed');
    Object.defineProperty(this, 'ran', {value: false});
    this.process = null;

    if (this.manager.respawn) {
      try {
        await this.spawn();
      } catch(error) {
        this.emit('warn', error);
      }
    }
  }

  async send(message: any): Promise<void> {
    if (this.process != null) {
      const child = this.process;
      await new Promise((resolve, reject) => {
        child.send(message, (error: any) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }
  }

  async sendIPC(
    op: number,
    data: any = null,
    request: boolean = false,
    shard?: number,
  ): Promise<void> {
    return this.send({op, data, request, shard});
  }

  async run(
    options: ProxyClusterProcessRunOptions = {},
  ): Promise<ChildProcess> {
    if (this.process) {
      return this.process;
    }
    const process = fork(this.file, [], {
      env: this.env,
    });
    this.process = process;
    this.process.on('message', this.onMessage.bind(this));
    this.process.on('exit', this.onExit.bind(this));

    if (options.wait || options.wait === undefined) {
      return new Promise((resolve, reject) => {
        const timeout = new Timers.Timeout();
        if (options.timeout) {
          timeout.start(options.timeout, () => {
            if (this.process === process) {
              this.process.kill();
              this.process = null;
            }
            reject(new Error('Cluster Child took too long to ready up'));
          });
        }
        this.once('ready', () => {
          timeout.stop();
          resolve(process);
        });
      });
    }
    return process;
  }
}
