export namespace ClusterIPCTypes {
  export interface IPCMessage {
    op: number,
    data: any,
    request: boolean,
    shard?: number,
  }
}
