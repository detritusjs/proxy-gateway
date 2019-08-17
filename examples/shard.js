const { MockGateway } = require('../lib');


const token = '';
const shard = new MockGateway(token);

(async () => {
  await shard.run('mongodb://127.0.0.1:27017');
  setTimeout(async () => {
    const channels = await shard.models.Channels.find({});
    console.log(`${channels.length} channels stored after 2 seconds`);
  }, 2000);
})();
