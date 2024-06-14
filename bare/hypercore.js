// const path = require('bare-path');
const RAM = require('random-access-memory');
// const fs = require('bare-fs');
let beeList = [];

const hyperBee = async () => {
  const Hyperbee = require('hyperbee');

  const Hypercore = require('hypercore');
  //   const storage = new RAM();

  //   const hash = 'topichash';
  //   const myPath = path.join(__dirname, `./topichash`);
  //   console.log({ myPath });
  //   if (!fs.existsSync(path)) {
  //     fs.mkdirSync(path);
  //   }
  const core = new Hypercore(RAM);
  const db = new Hyperbee(core, {
    keyEncoding: 'utf-8',
    valueEncoding: 'json',
  });
  // beeList.push(db)

  // If you own the core
  await db.put('hashofmessage', { key: 'tjena', key2: 'bongo', key3: 123 });

  await db.put('hashofmessage2', { key: 'tjena2', key2: 'bongo2', key3: 1234 });
  // If you want to insert/delete batched values
  // const batch = db.batch()

  // await batch.put('key3', 'value3')
  // await batch.del('key2')
  // await batch.flush() // Execute the batch

  // Query the core
  const entry = await db.get('hashofmessage'); // => null or { key, value }

  console.log('This entry hash?', entry);

  // Read all entries
  for await (const entry of db.createReadStream()) {
    console.log('Entry', entry);
    // ..
  }

  // Read a range
  for await (const entry of db.createReadStream({ gte: 'a', lt: 'd' })) {
    // Anything >=a and <d
  }

  // Get the last written entry
  for await (const entry of db.createHistoryStream({
    reverse: true,
    limit: 1,
  })) {
    console.log('Entry history', entry);
    // ..
  }
};

module.exports = {
  hyperBee,
};
