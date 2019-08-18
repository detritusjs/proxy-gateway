import { EventEmitter } from 'detritus-utils';

import { ProxyCluster } from '../proxycluster';
import { ClusterIPCOpCodes } from '../constants';

import { ClusterIPCTypes } from './ipctypes';


export class ProxyClusterProcessChild extends EventEmitter {
  readonly cluster: ProxyCluster;
  readonly clusterId: number = -1;

  constructor(cluster: ProxyCluster) {
    super();
    this.cluster = cluster;
    this.clusterId = +((<string> process.env.CLUSTER_ID) || this.clusterId);

    process.on('message', this.onMessage.bind(this));
    process.on('message', this.emit.bind(this, 'ipc'));
    this.cluster.on('ready', () => this.sendIPC(ClusterIPCOpCodes.READY));

    Object.defineProperties(this, {
      cluster: {enumerable: false, writable: false},
      clusterId: {writable: false},
    });
  }

  async onMessage(message: ClusterIPCTypes.IPCMessage | any): Promise<void> {
    if (!message || typeof(message) !== 'object') {
      return;
    }
    try {
      switch (message.op) {
        default: {

        };
      }
    } catch(error) {
      this.cluster.emit('warn', error);
    }
  }

  async send(message: ClusterIPCTypes.IPCMessage | any): Promise<void> {
    const parent = <any> process;
    return new Promise((resolve, reject) => {
      parent.send(message, (error: any) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async sendIPC(
    op: number,
    data: any = null,
    request: boolean = false,
    shard?: number,
  ): Promise<void> {
    return this.send({op, data, request, shard});
  }
}
