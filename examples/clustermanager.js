const { ProxyClusterManager } = require('../lib');

const token = '';
const manager = new ProxyClusterManager('./clustermanager-child.js', token, {
  shardCount: 192,
  shardsPerCluster: 6,
});

(async () => {
  await manager.run();
  console.log(`now running ${manager.process.length} clusters with ${manger.shardsPerCluster} shards on each one`);
})();
