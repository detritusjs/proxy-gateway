const { ProxyCluster } = require('../lib');

// we dont have to pass in a token anymore since it'll get it from the env variables from the fork
const cluster = new ProxyCluster('', {
  shardOptions: {
    gateway: {loadAllMembers: true}, // should only be set for small bots, this uses a ton of cpu if in a lot of guilds
  },
});

(async () => {
  process.title = `C: ${cluster.manager.clusterId}, S:(${cluster.shardStart}-${cluster.shardEnd})`;
  await cluster.run('mongodb://127.0.0.1:27017');
})();
