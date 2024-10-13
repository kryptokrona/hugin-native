import {
  enablePromise,
  openDatabase,
  ResultSet,
  SQLiteDatabase,
} from 'react-native-sqlite-storage';

import { Message } from 'types/p2p';

import { getRoomUsers, updateMessages } from '@/services';
import { containsOnlyEmojis } from '@/utils';

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
  //Update active room list
  getRoomUsers();
  return true;
}

export async function getRooms() {
  const results = await db.executeSql('SELECT * FROM rooms');
  const rooms: Array<any> = [];
  //const rooms: Room[] = [];

  results.forEach((result) => {
    for (let index = 0; index < result.rows.length; index++) {
      //console.log('Group:', result.rows.item(index).name);
      //console.log('key:', result.rows.item(index).key);
      //todoItems.push(result.rows.item(index));
      rooms.push(result.rows.item(index));
    }
  });

  return rooms;
}

export async function getLatestRoomMessages() {
  const roomsList: Array<any> = [];
  const rooms = await getRooms();
  for (const room of rooms) {
    //Loop through list and get one message from each room
    const results = await db.executeSql(
      'SELECT * FROM roomsmessages WHERE room = ? ORDER BY timestamp DESC LIMIT 1',
      [room.key],
    );

    results.forEach((result) => {
      const latestmessagedb = result.rows.item(0);
      if (latestmessagedb === undefined) {
        return;
      }
      roomsList.unshift({
        message: latestmessagedb.message,
        name: room.name,
        roomKey: room.key,
        timestamp: latestmessagedb.timestamp,
      });
    });
  }

  return roomsList;
}

export async function getRoomMessages(room: string, page: number) {
  const limit: number = 50;
  let offset: number = 0;
  if (page !== 0) {
    offset = page * limit;
  }
  const results: [ResultSet] = await db.executeSql(
    `SELECT * FROM roomsmessages WHERE room = ? ORDER BY timestamp ASC LIMIT ${offset}, ${limit}`,
    [room],
  );

  return await setReplies(results);
}

async function setReplies(results: [ResultSet]) {
  const messages: Message[] = [];
  for (const result of results) {
    for (let index = 0; index < result.rows.length; index++) {
      const res = result.rows.item(index);
      if (res === undefined) {
        continue;
      }
      // TODO ** add replies and replyto, sort emojis?
      //The original message this one is replying to
      res.replyto = await getRoomReplyMessage(res.reply);
      //await getRoomRepliesToMessage(res.hash);
      const replies = await getRoomRepliesToMessage(res.hash);
      //If we want all replies to one message
      const reactions = addEmoji(replies);
      res.replies = [];
      res.reactions = reactions;
      const r: Message = toMessage(res);
      messages.push(r);
    }
  }
  return messages;
}

function addEmoji(replies: Message[]) {
  const reactions = [];
  for (const m of replies) {
    if (containsOnlyEmojis(m.message) && m.message.length < 9) {
      reactions.push(m.message);
    }
  }
  return reactions;
}

export async function getRoomReplyMessage(hash: string) {
  const reply: Message[] = [];
  const results = await db.executeSql(
    'SELECT * FROM roomsmessages WHERE hash = ? ORDER BY timestamp ASC',
    [hash],
  );
  results.forEach((result) => {
    const r = result.rows.item(0);
    if (r === undefined) {
      return;
    }
    const res: Message = toMessage(r);
    reply.push(res);
  });
  return reply;
}

export async function getRoomRepliesToMessage(hash: string) {
  const replies: Message[] = [];
  const results = await db.executeSql(
    'SELECT * FROM roomsmessages WHERE reply = ? ORDER BY timestamp ASC',
    [hash],
  );
  results.forEach((result) => {
    for (let index = 0; index < result.rows.length; index++) {
      const r = result.rows.item(index);
      if (r === undefined) {
        continue;
      }
      const res: Message = toMessage(r);
      replies.push(res);
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
    console.log('Epic win', result);
    getRoomUsers();

    const newMessage: Message = {
      address: address,
      hash: hash,
      message: message,
      nickname: nickname,
      reactions: [],
      reply: reply,
      room: room,
      sent: sent,
      timestamp: timestamp,
    };

    updateMessages(newMessage);
  } catch (err) {
    console.log(err);
  }
}

const toMessage = (res: any) => {
  const message: Message = {
    address: res.address,
    //Hash identifier of the message
    hash: res.hash,
    //Message
    message: res.message,
    //Nickname
    nickname: res.nickname,

    reactions: res.reactions ? res.reactions : [],

    //All the replies to this message
    replies: res?.replies,

    //The reply hash of the message
    reply: res.reply,

    //The original message this is a reply to
    replyto: res?.replyto,

    //The room the message is in
    room: res.room,

    //If sent or not
    sent: res.sent,

    //Timestmap
    timestamp: res.timestamp,
  };

  return message;
};
