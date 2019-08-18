const { ProxyCluster } = require('../lib');


const token = '';
const cluster = new ProxyCluster(token, {
  shardCount: 144,
  shards: [0, 5], // load up shards 0, 1, 2, 3, 4, 5 on this cluster
});


(async () => {
  await cluster.run('mongodb://127.0.0.1:27017');
  setTimeout(async () => {
    const channels = await cluster.models.Channels.find({});
    console.log(`${channels.length} channels stored after 2 seconds`);
  }, 2000);
})();
