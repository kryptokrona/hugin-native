import {
  enablePromise,
  openDatabase,
  SQLiteDatabase,
} from 'react-native-sqlite-storage';

enablePromise(true);

let db: SQLiteDatabase;

//Todo**
//fix some Array<any> types
//set result types?

export const getDBConnection = async () => {
  return openDatabase({ location: 'default', name: 'hugin.db' });
};

export const initDB = async () => {
  console.log('Initializing database..2');
  try {
    db = await getDBConnection();
    console.log('Got db connection');
    let query = `CREATE TABLE IF NOT EXISTS rooms ( 
        name TEXT,
        key TEXT,
        seed TEXT default null,
        latestmessage INT default 0,
        UNIQUE (key)
    )`;
    await db.executeSql(query);
    query = `CREATE TABLE IF NOT EXISTS roomsmessages ( 
      address TEXT,
      message TEXT,
      room TEXT,
      reply TEXT,
      timestamp INT,
      nickname TEXT,
      hash TEXT,
      sent BOOLEAN,
      UNIQUE (hash)
  )`;
    await db.executeSql(query);
  } catch (err) {
    console.log(err);
  }

  //Add some init test funcs during dev here:
  getRooms(); //Lists all our room in the console.
};

export async function saveRoomToDatabase(
  name: string,
  key: string,
  seed: string,
) {
  console.log('Saving room ', name);

  try {
    const result = await db.executeSql(
      'REPLACE INTO rooms (name, key, seed, latestmessage) VALUES (?, ?, ?, ?)',
      [name, key, seed, Date.now()],
    );
    console.log(result);
  } catch (err) {
    console.log(err);
  }
}

export async function removeRoomFromDatabase(key: string) {
  try {
    const results = await db.executeSql('DELETE FROM rooms WHERE key = ?', [
      key,
    ]);
    //TODO also remove all messages from room here?
    //We also need to call getLatestRoomMessages to update the list in frontend after this func
    console.log(results);
  } catch (err) {
    console.log('Error removing room', err);
    return false;
  }
  return true;
}

export async function getRooms() {
  const results = await db.executeSql('SELECT * FROM rooms');
  const rooms: Array<any> = [];
  //const rooms: Room[] = [];

  results.forEach((result) => {
    for (let index = 0; index < result.rows.length; index++) {
      console.log('Group:', result.rows.item(index).name);
      console.log('key:', result.rows.item(index).key);
      //todoItems.push(result.rows.item(index));
      rooms.push(result.rows.item(index));
    }
  });

  return rooms;
}

export async function getLatestRoomMessages() {
  const messages: Array<any> = [];
  const list = await getRooms();
  for (const room of list) {
    //Loop through list and get one message from each room
    const results = await db.executeSql(
      'SELECT * FROM roomsmessages WHERE room = ? ORDER BY timestamp DESC LIMIT 1',
      [room.key],
    );

    results.forEach((result) => {
      const res = result.rows.item(0);
      if (res === undefined) {
        return;
      }
      messages.push(res);
    });
  }
  console.log('Return one message from each room', messages);
  return messages;
}

export async function getRoomMessages(room: string, page: number) {
  const limit: number = 50;
  let offset: number = 0;
  if (page !== 0) {
    offset = page * limit;
  }
  const messages = [];
  const results = await db.executeSql(
    `SELECT * FROM roomsmessages WHERE room = ? ORDER BY timestamp DESC LIMIT ${offset}, ${limit}`,
    [room],
  );
  results.forEach(async (result) => {
    for (let index = 0; index < result.rows.length; index++) {
      const res = result.rows.item(index);
      if (res === undefined) {
        return;
      }
      res.replyto = await getRoomReplyMessage(res.reply);
      res.replies = await getRoomRepliesToMessage(res.hash);
      console.log('We reply to a message in the database:', res.replyto);
      console.log('All replies to this message, sort by emojis?:', res.replies);
      messages.push(res);
    }
  });
}

export async function getRoomReplyMessage(hash: string) {
  const reply: Array<any> = [];
  const results = await db.executeSql(
    'SELECT * FROM roomsmessages WHERE hash = ? ORDER BY time ASC',
    [hash],
  );
  results.forEach((result) => {
    const r = result.rows.item(0);
    reply.push(r);
  });
  return reply;
}

export async function getRoomRepliesToMessage(hash: string) {
  const replies: Array<any> = [];
  const results = await db.executeSql(
    'SELECT * FROM roomsmessages WHERE reply = ? ORDER BY time ASC',
    [hash],
  );
  results.forEach((result) => {
    for (let index = 0; index < result.rows.length; index++) {
      const r = result.rows.item(index);
      replies.push(r);
    }
  });
  return replies;
}

export async function saveRoomsMessageToDatabase(
  address: string,
  message: string,
  room: string,
  reply: string,
  timestamp: number,
  nickname: string,
  hash: string,
  sent: boolean,
) {
  console.log('Saving message: ', message);

  try {
    const result = await db.executeSql(
      'INSERT INTO roomsmessages (address, message, room, reply, timestamp, nickname, hash, sent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [address, message, room, reply, timestamp, nickname, hash, sent ? 1 : 0],
    );
    console.log(result);
  } catch (err) {
    console.log(err);
  }
}
