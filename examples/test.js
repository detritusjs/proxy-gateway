const { MockGateway } = require('../lib');


const token = '';
const mock = new MockGateway(token);

(async () => {
  await mock.run('wss://gateway.discord.gg', 'mongodb://127.0.0.1:27017');
  setTimeout(async () => {
    console.log(await mock.models.Channel.find({}));
  }, 2000);
})();
