const { ProxyClusterManager } = require('../lib');

const token = '';
const manager = new ProxyClusterManager('./clustermanager-child.js', token, {
  shardCount: 192,
  shards: [0, 15], // shards 0 to 15 (16 total)
  shardsPerCluster: 8,
});

(async () => {
  await manager.run();
  console.log(`now running ${manager.processes.length} clusters with ${manager.shardsPerCluster} shards on each one with a shard count of ${manager.shardCount}`);
})();
