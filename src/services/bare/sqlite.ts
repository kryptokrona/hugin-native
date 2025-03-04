import {
  ResultSet,
  SQLiteDatabase,
  enablePromise,
  openDatabase,
} from 'react-native-sqlite-storage';

import { FileInfo, Message, TipType, User } from '@/types';
import { containsOnlyEmojis } from '@/utils';

import { Files } from './globals';

import { useUserStore } from '../zustand';

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

    // export interface Contact {
    //   name: string;
    //   address: string;
    //   messagekey: string;
    //   unreads?: number;
    // }

    // query = "DROP TABLE contacts";
    // await db.executeSql(query);

    // query = "DROP TABLE messages";
    // await db.executeSql(query);

    query = `CREATE TABLE IF NOT EXISTS contacts (
      name TEXT,
      address TEXT NOT NULL,
      messagekey TEXT NOT NULL,
      latestmessage INT DEFAULT 0,
      UNIQUE (address, messagekey)
  )`;

    await db.executeSql(query);

    // address: peer.address,
    // name: peer.name,
    // room: peer.key,
    // avatar: peer.avatar,

    query = `CREATE TABLE IF NOT EXISTS groupusers (
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      room TEXT NOT NULL,
      avatar TEXT,
      lastseen INT DEFAULT 0,
      PRIMARY KEY (address, room)
  )`;

    await db.executeSql(query);

    query = `CREATE TABLE IF NOT EXISTS messages ( 
      conversation TEXT,
      message TEXT,
      reply TEXT,
      timestamp INT,
      hash TEXT,
      sent BOOLEAN,
      tip TEXT,
      UNIQUE (hash)
  )`;
    await db.executeSql(query);

    query = 'ALTER TABLE roomsmessages ADD tip TEXT';
    try {
      await db.executeSql(query);
    } catch (err) {}

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

    query = 'ALTER TABLE files ADD topic TEXT default null';
    try {
      await db.executeSql(query);
    } catch (err) {}

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
  console.log('Saving file ', file);
  Files.new(file);
  try {
    await db.executeSql(
      'REPLACE INTO files (fileName, hash, timestamp, sent, path, image, topic)  VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        file.fileName,
        file.hash,
        file.timestamp,
        file.sent,
        file.path,
        file.image,
        file.topic,
      ],
    );
  } catch (err) {
    console.log(err);
  }

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

export async function saveRoomUser(
  name: string,
  address: string,
  room: string,
  avatar?: string,
) {
  console.log('Saving group user ', name);

  try {
    if (avatar === '') {
      const existingUser = await db.executeSql(
        'SELECT avatar FROM groupusers WHERE address = ? AND room = ?',
        [address, room]
      );

      const currentAvatar = existingUser[0]?.rows?.length > 0 ? existingUser[0].rows.item(0).avatar : null;

      if (currentAvatar) {
        console.log('Avatar already exists and is not empty, skipping update');
        return;
      }
    }

    const result = await db.executeSql(
      'REPLACE INTO groupusers (name, address, room, avatar, lastseen) VALUES (?, ?, ?, ?, ?)',
      [name, address, room, avatar, Date.now()]
    );
    console.log(result);
  } catch (err) {
    console.log(err);
  }
}


export async function getRoomUsers(
  room: string
): Promise<User[]> {
  console.log('Get room users for room ', room);

  try {
    const results = await db.executeSql(
      'SELECT * FROM groupusers WHERE room = ?',
      [room],
    );
    console.log(results);

    const users: User[] = [];
    for (const result of results) {
      for (let index = 0; index < result.rows.length; index++) {
        const row = result.rows.item(index);
        console.log('Got user: ', row.name)
        const user: User = {
          address: row.address,
          avatar: row.avatar,
          name: row.name,
          online: false,
          lastseen: row.lastseen
        };
        users.push(user);
      }
    }
    return users;
  } catch (err) {
    console.log(err);
    return [];
  }
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

export async function deleteContact(address: string) {
  try {
    let results = await db.executeSql(
      'DELETE FROM contacts WHERE address = ?',
      [address],
    );
    //We also need to call getLatestRoomMessages to update the list in frontend after this func
    console.log(results);

    results = await db.executeSql(
      'DELETE FROM messages WHERE conversation = ?',
      [address],
    );
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

export async function addContact(
  name: string,
  address: string,
  messagekey: string,
  add: boolean = false,
) {
  try {
    const contactExists = await getContact(address);

    if (contactExists) {
      return false;
    }

    const result = await db.executeSql(
      'INSERT INTO contacts (name, address, messagekey, latestmessage) VALUES (?, ?, ?, ?)',
      [name, address, messagekey, Date.now()],
    );
    console.log('Added contact: ', address, messagekey, name);

    if (add) {
      await saveMessage(
        address,
        'Conversation started',
        '',
        Date.now(),
        Date.now().toString(),
        true,
        'me',
        false,
        'Me',
      );
    }

    return { address, messagekey, name };
  } catch (err) {
    console.log('Failed to add contact: ', err);
  }
}

export async function updateContact(name: string, address: string) {
  try {
    const result = await db.executeSql(
      'UPDATE contacts SET name = ? WHERE address = ?',
      [name, address],
    );
    console.log('Updated contact: ', name, address);

    return name;
  } catch (err) {
    console.log('Failed to add contact: ', err);
  }
}

export async function getContacts() {
  const results = await db.executeSql('SELECT * FROM contacts');
  const contacts: Array<any> = [];
  //const rooms: Room[] = [];

  for (const result of results) {
    for (let index = 0; index < result.rows.length; index++) {
      contacts.push(result.rows.item(index));
    }
  }

  return contacts;
}

export async function getContact(address: string) {
  const results = await db.executeSql(
    'SELECT * FROM contacts WHERE address = ?',
    [address],
  );
  const contacts: Array<any> = [];
  //const rooms: Room[] = [];

  for (const result of results) {
    for (let index = 0; index < result.rows.length; index++) {
      return result.rows.item(0);
    }
  }

  return false;
}

export async function getLatestMessages() {
  const contactsList: Array<any> = [];
  const contacts = await getContacts();
  for (const contact of contacts) {
    //Loop through list and get one message from each room
    const results = await db.executeSql(
      'SELECT * FROM messages WHERE conversation = ? AND message IS NOT "" ORDER BY timestamp DESC LIMIT 1',
      [contact.address],
    );

    for (const result of results) {
      let latestmessagedb = result.rows.item(0);
      console.log('Got result,', latestmessagedb);
      if (latestmessagedb === undefined) {
        latestmessagedb = {
          message: 'Conversation started',
          timestamp: Date.now(),
        };
      }
      contactsList.unshift({
        address: contact.address,
        message: latestmessagedb.message,
        messagekey: contact.messagekey,
        name: contact.name,
        timestamp: latestmessagedb.timestamp,
      });
    }
  }

  return contactsList;
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
        address: latestmessagedb.address,
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
  page: number
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

  return await setReplies(results);
}

export async function getMessages(
  conversation: string,
  page: number,
  history = true,
) {
  const limit: number = 55;
  let offset: number = 0;
  if (page !== 0) {
    offset = page * limit;
  }
  const { name, address } = useUserStore.getState().user;

  const results: [ResultSet] = await db.executeSql(
    `SELECT * FROM messages WHERE conversation = ? ORDER BY timestamp DESC LIMIT ${offset}, ${limit}`,
    [conversation],
  );

  if (history) {
    const messages = [];
    for (const result of results) {
      for (let index = 0; index < result.rows.length; index++) {
        const res = result.rows.item(index);
        res.room = res.conversation;
        res.address = res.sent ? address : res.conversation;
        const contact = await getContact(res.address);
        res.nickname = res.sent ? name : contact.name;
        const r: Message = toMessage(res);
        messages.push(r);
      }
    }

    return messages.reverse();
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

export async function messageExists(hash: string) {
  const messageExist = `SELECT *
  FROM messages
  WHERE hash = '${hash}'
  `;

  const results: [ResultSet] = await db.executeSql(messageExist);
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
  tip: TipType | false = false,
) {
  if ((!message || message?.length === 0) && !tip) {
    return false;
  }
  try {
    await db.executeSql(
      'REPLACE INTO roomsmessages (address, message, room, reply, timestamp, nickname, hash, sent, tip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        address,
        message,
        room,
        reply,
        timestamp,
        nickname,
        hash,
        sent ? 1 : 0,
        JSON.stringify(tip),
      ],
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
      tip,
    };
    console.log('Saved message: ', newMessage);
    return newMessage;
  } catch (err) {
    return false;
  }
}

export async function saveMessage(
  conversation: string,
  message: string,
  reply: string,
  timestamp: number,
  hash: string,
  sent: boolean,
  myaddress: string,
  tip: TipType | false = false,
  nickname: string | undefined,
) {
  console.log('Saving message: ', message);
  if ((!message || message?.length === 0) && !tip) {
    return false;
  }
  try {
    await db.executeSql(
      'REPLACE INTO messages (conversation, message, reply, timestamp, hash, sent, tip) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        conversation,
        message,
        reply,
        timestamp,
        hash,
        sent ? 1 : 0,
        JSON.stringify(tip),
      ],
    );

    if (!sent) {
      const contact = await getContact(conversation);
      nickname = contact.name;
    }

    const newMessage: Message = {
      address: sent ? myaddress : conversation,
      hash: hash,
      message: message,
      nickname: nickname || 'Anon',
      reactions: [],
      reply: reply,
      room: conversation,
      sent: sent,
      timestamp: timestamp,
      tip,
    };
    return newMessage;
  } catch (err) {
    console.log('savemsgerror:', err);
    return false;
  }
}

// TODO if remove acc maybe remove delete storage stuff ?
// const deleteAllData = async () => {
//   try {
//     const results = await db.executeSql('DELETE FROM rooms');
//     console.log(results);
//   } catch (err) {
//     console.log(err);
//   }
// };

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

    tip: res.tip,
  };

  return message;
};
