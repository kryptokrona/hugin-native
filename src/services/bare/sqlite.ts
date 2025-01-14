import {
  ResultSet,
  SQLiteDatabase,
  enablePromise,
  openDatabase,
} from 'react-native-sqlite-storage';

import { FileInfo, Message } from '@/types';
import { containsOnlyEmojis } from '@/utils';

import { Files } from './globals';

enablePromise(true);

let db: SQLiteDatabase;
export const getDBConnection = async () => {
  return openDatabase({ location: 'default', name: 'hugin.db' });
};

let create = false;

export const initDB = async () => {
  console.log('Initializing database..2');
  try {
    if (create) {
      return;
    }
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

    query = `ALTER TABLE roomsmessages ADD tip TEXT`;
    try {
      await db.executeSql(query);
    } catch (err) {

    }

    const acc = `CREATE TABLE IF NOT EXISTS account ( 
    publicKey TEXT,
    secretKey TEXT
  )`;
    await db.executeSql(acc);

    const files = `CREATE TABLE IF NOT EXISTS files ( 
      fileName TEXT,
      hash TEXT,
      timestamp INT,
      sent BOOLEAN,
      path TEXT,
      image BOOLEAN,
      UNIQUE (hash)
    )`;
    await db.executeSql(files);

    const xkrwallet = `CREATE TABLE IF NOT EXISTS wallet (
      id INTEGER PRIMARY KEY,
      json TEXT
     )`;
    await db.executeSql(xkrwallet);

    create = true;
  } catch (err) {
    console.log(err);
  }

  //Add some init test funcs during dev here:
  getRooms(); //Lists all our room in the console.
};

function chunkString(string: string, size: number) {
  const numChunks = Math.ceil(string.length / size);
  const chunks = new Array(numChunks);

  for (let i = 0, o = 0; i < numChunks; i++, o += size) {
    chunks[i] = string.substr(o, size);
  }

  return chunks;
}

const databaseRowLimit = 1024 * 512; // 512 KB per chunk

export async function saveWallet(wallet: any) {
  // Serialize wallet into a JSON string
  const walletString = JSON.stringify(wallet);

  // Split the JSON string into manageable chunks
  const chunks = chunkString(walletString, databaseRowLimit);

  // Clear the wallet table
  await db.executeSql('DELETE FROM wallet');

  // Insert each chunk into the database
  for (let i = 0; i < chunks.length; i++) {
    await db.executeSql(
      'INSERT INTO wallet (id, json) VALUES (?, ?)',
      [i, chunks[i]], // Use parameterized query to safely insert data
    );
  }
}

export async function loadWallet() {
  console.log('Loading wallet from db..');
  try {
    let [data] = await db.executeSql(
      `SELECT
            LENGTH(json) AS jsonLength
        FROM
            wallet`,
    );

    if (data && data.rows && data.rows.length === 1) {
      const len = data.rows.item(0).jsonLength;
      let result = '';

      if (len > databaseRowLimit) {
        for (let i = 1; i <= len; i += databaseRowLimit) {
          const [chunk] = await db.executeSql(
            `SELECT
                        SUBSTR(json, ${i}, ${databaseRowLimit}) AS data
                    FROM
                        wallet`,
          );

          if (chunk && chunk.rows && chunk.rows.length === 1) {
            result += chunk.rows.item(0).data;
          }
        }

        return [result, false];
      }
    }

    [data] = await db.executeSql(
      `SELECT
            json
        FROM
            wallet
        ORDER BY
            id ASC`,
    );

    if (data && data.rows && data.rows.length >= 1) {
      const len = data.rows.length;

      let result = '';

      for (let i = 0; i < len; i++) {
        result += data.rows.item(i).json;
      }

      return [result, false];
    }
  } catch (err) {
    return [undefined, true];
  }

  return [undefined, true];
}

export async function saveAccount(pk: string, sk: string) {
  console.log('Saving Account ', pk);
  try {
    const result = await db.executeSql(
      'REPLACE INTO account (publicKey, secretKey) VALUES (?, ?)',
      [pk, sk],
    );
    console.log(result);
  } catch (err) {
    console.log(err);
  }
}

export async function loadAccount() {
  const results = await db.executeSql('SELECT * FROM account');
  return results[0].rows.item(0);
}

export async function saveFileInfo(file: FileInfo) {
  console.log('Saving room ', file);
  try {
    await db.executeSql(
      'REPLACE INTO files (fileName, hash, timestamp, sent, path, image)  VALUES (?, ?, ?, ?, ?, ?)',
      [
        file.fileName,
        file.hash,
        file.timestamp,
        file.sent,
        file.path,
        file.image,
      ],
    );
  } catch (err) {
    console.log(err);
  }

  Files.new(file);
}

export async function loadSavedFiles() {
  const results = await db.executeSql('SELECT * FROM files');
  const files: Array<FileInfo> = [];

  for (const result of results) {
    for (let index = 0; index < result.rows.length; index++) {
      files.push(result.rows.item(index));
    }
  }
  return files;
}

export async function saveRoomToDatabase(
  name: string,
  key: string,
  seed?: string,
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
  return true;
}

export async function getRooms() {
  const results = await db.executeSql('SELECT * FROM rooms');
  const rooms: Array<any> = [];
  //const rooms: Room[] = [];

  for (const result of results) {
    for (let index = 0; index < result.rows.length; index++) {
      rooms.push(result.rows.item(index));
    }
  }

  return rooms;
}

export async function getLatestRoomMessages() {
  const roomsList: Array<any> = [];
  const rooms = await getRooms();
  for (const room of rooms) {
    //Loop through list and get one message from each room
    const results = await db.executeSql(
      'SELECT * FROM roomsmessages WHERE room = ? AND message IS NOT "" ORDER BY timestamp DESC LIMIT 1',
      [room.key],
    );

    for (const result of results) {
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
    }
  }

  return roomsList;
}

export async function getRoomMessages(
  room: string,
  page: number,
  history = false,
) {
  const limit: number = 55;
  let offset: number = 0;
  if (page !== 0) {
    offset = page * limit;
  }
  const results: [ResultSet] = await db.executeSql(
    `SELECT * FROM roomsmessages WHERE room = ? ORDER BY timestamp DESC LIMIT ${offset}, ${limit}`,
    [room],
  );

  if (history) {
    const messages = [];
    for (const result of results) {
      for (let index = 0; index < result.rows.length; index++) {
        const res = result.rows.item(index);
        const r: Message = toMessage(res);
        messages.push(r);
      }
    }

    return messages;
  }

  return await setReplies(results);
}

async function setReplies(results: [ResultSet]) {
  const messages: Message[] = [];
  const files = Files.all();
  for (const result of results) {
    for (let index = 0; index < result.rows.length; index++) {
      const res = result.rows.item(index);
      if (res === undefined) {
        continue;
      }
      //The original message this one is replying to
      res.replyto = await getRoomReplyMessage(res.reply);
      const file = files.find((a) => a.hash === res.hash);

      if (file) {
        res.file = file;
      }
      //This message is already displayed as a reaction on someone elses message
      if (
        res.replyto.length &&
        containsOnlyEmojis(res.message) &&
        res.message.length < 9
      ) {
        continue;
      }

      const replies = await getRoomRepliesToMessage(res.hash);
      //If we want all replies to one message
      const reactions = addEmoji(replies);
      res.replies = [];
      res.reactions = reactions;
      const r: Message = toMessage(res);
      messages.push(r);
    }
  }
  return messages.reverse();
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

export async function getRoomReplyMessage(hash: string, history = false) {
  const reply: Message[] = [];
  const files = Files.all();
  const results = await db.executeSql(
    'SELECT * FROM roomsmessages WHERE hash = ? ORDER BY timestamp ASC',
    [hash],
  );
  for (const result of results) {
    const r = result.rows.item(0);
    if (r === undefined) {
      return false;
    }
    const file = files.find((a: FileInfo) => a.hash === r.hash);
    if (history && file) {
      continue;
    }
    if (!history) {
      if (file) {
        r.file = file;
      }
    }
    const res: Message = toMessage(r);

    reply.push(res);
  }
  return reply;
}

export async function getLatestRoomHashes(room: string) {
  const hashes: Array<string> = [];
  const results = await db.executeSql(
    'SELECT * FROM roomsmessages WHERE room = ? ORDER BY timestamp DESC LIMIT 0, 25',
    [room],
  );

  for (const result of results) {
    for (let index = 0; index < result.rows.length; index++) {
      const r = result.rows.item(index);
      if (r === undefined) {
        continue;
      }
      hashes.push(r.hash);
    }
  }

  return hashes;
}

export async function getRoomRepliesToMessage(hash: string) {
  const replies: Message[] = [];
  const results = await db.executeSql(
    'SELECT * FROM roomsmessages WHERE reply = ? ORDER BY timestamp ASC',
    [hash],
  );
  for (const result of results) {
    for (let index = 0; index < result.rows.length; index++) {
      const r = result.rows.item(index);
      if (r === undefined) {
        continue;
      }
      const res: Message = toMessage(r);
      replies.push(res);
    }
  }
  return replies;
}

export async function roomMessageExists(hash: string) {
  const groupMessageExists = `SELECT *
  FROM roomsmessages
  WHERE hash = '${hash}'
  `;

  const results: [ResultSet] = await db.executeSql(groupMessageExists);
  const res = results[0].rows.item(0);
  if (res === undefined) {
    return false;
  }
  return true;
}
export async function saveRoomMessage(
  address: string,
  message: string,
  room: string,
  reply: string,
  timestamp: number,
  nickname: string,
  hash: string,
  sent: boolean,
  tip: JSON | false
) {
  console.log('Saving message: ', message);
  if ((!message || message?.length === 0) && !tip) {
    return false;
  }
  try {
    await db.executeSql(
      'REPLACE INTO roomsmessages (address, message, room, reply, timestamp, nickname, hash, sent, tip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [address, message, room, reply, timestamp, nickname, hash, sent ? 1 : 0, JSON.stringify(tip)],
    );

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
      tip
    };
    return newMessage;
  } catch (err) {
    return false;
  }
}

const deleteAllData = async () => {
  try {
    const results = await db.executeSql('DELETE FROM rooms');
    console.log(results);
  } catch (err) {
    console.log(err);
  }
};

const toMessage = (res: any) => {
  const message: Message = {
    address: res.address,

    file: res.file,

    //Hash identifier of the message
    hash: res.hash,

    //Message
    message: res.message,

    //Nickname
    nickname: res.nickname,

    // Emoji's on this message
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

    tip: res.tip
  };

  return message;
};
