// Copyright (C) 2018-2019, Zpalmtree
//
// Please see the included LICENSE file for more information.

import AsyncStorage from '@react-native-async-storage/async-storage';
import SQLite from 'react-native-sqlite-storage';

import { config, globals } from '@/config';
import { Group, Payee, Preferences, UnreadMessages } from '@/types';

/* Use promise based API instead of callback based */
SQLite.enablePromise(true);

let database: any;

const databaseRowLimit = 1024 * 512;

export async function deleteDB() {
  try {
    await setHaveWallet(false);

    await SQLite.deleteDatabase({
      location: 'default',
      name: 'data.DB',
    });
  } catch (err) {
    globals.logger.addLogMessage(err);
  }
}

/* https://stackoverflow.com/a/29202760/8737306 */
function chunkString(string: string, size: number) {
  const numChunks = Math.ceil(string.length / size);
  const chunks = new Array(numChunks);

  for (let i = 0, o = 0; i < numChunks; i++, o += size) {
    chunks[i] = string.substr(o, size);
  }

  return chunks;
}

async function saveWallet(wallet: any) {
  /* Split into chunks of 512kb */
  const chunks = chunkString(wallet, databaseRowLimit);

  await database.transaction(
    (tx: { executeSql: (arg0: string, arg1?: any[] | undefined) => void }) => {
      tx.executeSql('DELETE FROM wallet');

      for (let i = 0; i < chunks.length; i++) {
        tx.executeSql(
          `INSERT INTO wallet
                    (id, json)
                VALUES
                    (?, ?)`,
          [i, chunks[i]],
        );
      }
    },
  );
}

export async function loadWallet() {
  try {
    let [data] = await database.executeSql(
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
          const [chunk] = await database.executeSql(
            `SELECT
                            SUBSTR(json, ?, ?) AS data
                        FROM
                            wallet`,
            [i, databaseRowLimit],
          );

          if (chunk && chunk.rows && chunk.rows.length === 1) {
            result += chunk.rows.item(0).data;
          }
        }

        return [result, undefined];
      }
    }

    [data] = await database.executeSql(
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

      return [result, undefined];
    }
  } catch (err) {
    return [undefined, err];
  }

  return [undefined, 'Wallet not found in database!'];
}

/* Create the tables if we haven't made them already */
async function createTables(DB: {
  executeSql: (arg0: string) => PromiseLike<[any]> | [any];
  transaction: (arg0: (tx: any) => void) => any;
}) {
  const [dbVersionData] = await DB.executeSql('PRAGMA user_version');

  let dbVersion = 0;

  if (dbVersionData && dbVersionData.rows && dbVersionData.rows.length >= 1) {
    dbVersion = dbVersionData.rows.item(0).user_version;
  }

  await DB.transaction(
    (tx: {
      executeSql: (arg0: string, arg1?: string[] | undefined) => void;
    }) => {
      /* We get JSON out from our wallet backend, and load JSON in from our
       wallet backend - it's a little ugly, but it's faster to just read/write
       json to the DB rather than structuring it. */
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS wallet (
                id INTEGER PRIMARY KEY,
                json TEXT
            )`,
      );

      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS preferences (
                id INTEGER PRIMARY KEY,
                currency TEXT,
                notificationsenabled BOOLEAN,
                scancoinbasetransactions BOOLEAN,
                limitdata BOOLEAN,
                theme TEXT,
                pinconfirmation BOOLEAN,
                language TEXT,
                nickname TEXT,
                cache TEXT,
                cacheenabled TEXT default "true",
                autopickcache TEXT default "true",
                websocketenabled TEXT default "true"
            )`,
      );

      /* Add new columns */
      if (dbVersion === 0) {
        tx.executeSql(
          `ALTER TABLE
                    preferences
                ADD
                    autooptimize BOOLEAN`,
        );

        tx.executeSql(
          `ALTER TABLE
                    preferences
                ADD
                    authmethod TEXT`,
        );
      }

      if (dbVersion === 0 || dbVersion === 1) {
        tx.executeSql(
          `ALTER TABLE
                    preferences
                ADD
                    node TEXT`,
          [],
        );
      }

      if (dbVersion === 2) {
        tx.executeSql(
          `ALTER TABLE
                  message_db
              ADD
                  read BOOLEAN default 1`,
          [],
        );
      }

      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS payees (
                nickname TEXT,
                address TEXT,
                paymentid TEXT
            )`,
        [],
      );

      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS message_db (
                conversation TEXT,
                type TEXT,
                message TEXT,
                timestamp TEXT,
                read BOOLEAN default 1,
                UNIQUE (timestamp)
            )`,
        [],
      );

      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS privateboards (
                name TEXT,
                key TEXT,
                latestmessage INT default 0,
                UNIQUE (key)
            )`,
        [],
      );

      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS privateboards_messages_db (
                board TEXT,
                nickname TEXT,
                address TEXT,
                type TEXT,
                message TEXT,
                timestamp TEXT,
                read BOOLEAN default 1,
                hash TEXT,
                reply TEXT,
                replies INT default 0,
                UNIQUE (timestamp)
            )`,
        [],
      );

      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS boards_message_db (
                 address TEXT,
                 message TEXT,
                 signature TEXT,
                 board TEXT,
                 timestamp TEXT,
                 nickname TEXT,
                 reply TEXT,
                 hash TEXT UNIQUE,
                 sent BOOLEAN,
                 read BOOLEAN default 1
            )`,
        [],
      );

      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS misc (
                 lastSyncGroup TEXT
                 lastSyncDM TEXT
            )`,
        [],
      );

      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS boards_subscriptions (
                 board TEXT,
                 key TEXT,
                 latest_message INT default 0
            )`,
        [],
      );

      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS knownTXs (
               hash TEXT,
               timestamp TEXT,
               UNIQUE (hash)
          )`,
        [],
      );

      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS transactiondetails (
                hash TEXT,
                memo TEXT,
                address TEXT,
                payee TEXT
            )`,
        [],
      );

      /* Enter initial wallet value that we're going to overwrite later via
       primary key, provided it doesn't already exist */
      tx.executeSql(
        `INSERT OR IGNORE INTO wallet
                (id, json)
            VALUES
                (0, '')`,
      );

      if (dbVersion === 3) {
        tx.executeSql(
          `ALTER TABLE
                  preferences
              ADD
                  nickname TEXT default 'Anonymous'`,
          [],
        );
      }

      if (dbVersion === 4) {
        tx.executeSql(
          `ALTER TABLE
                boards_subscriptions
             ADD
                latest_message INT default 0`,
          [],
        );
      }
      console.log('dbVersion', dbVersion);
      if (dbVersion === 6) {
        tx.executeSql(
          `ALTER TABLE
                    privateboards_messages_db
                ADD
                    reply TEXT default ''`,
          [],
        );

        tx.executeSql(
          `ALTER TABLE
                        privateboards_messages_db
                    ADD
                        hash TEXT default ''`,
          [],
        );
      }

      if (dbVersion === 7) {
        tx.executeSql(
          `ALTER TABLE
                  preferences
              ADD
                  cache TEXT default '${config.defaultCache}'`,
          [],
        );
        tx.executeSql(
          `ALTER TABLE
                    preferences
                ADD
                    cacheenabled text default "true"`,
          [],
        );

        tx.executeSql(
          `ALTER TABLE
                    preferences
                ADD
                    autopickcache text default "true"`,
          [],
        );

        tx.executeSql(
          `ALTER TABLE
                    preferences
                ADD
                    websocketenabled text default "true"`,
          [],
        );

        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS privateboards_messages_db2 (
                    board TEXT,
                    nickname TEXT,
                    address TEXT,
                    type TEXT,
                    message TEXT,
                    timestamp TEXT,
                    read BOOLEAN default 1,
                    hash TEXT,
                    reply TEXT,
                    UNIQUE (timestamp)
                )`,
          [],
        );

        tx.executeSql(
          'REPLACE INTO privateboards_messages_db2 SELECT * FROM privateboards_messages_db',
          [],
        );

        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS privateboards_messages_db (
                board TEXT,
                nickname TEXT,
                address TEXT,
                type TEXT,
                message TEXT,
                timestamp TEXT,
                read BOOLEAN default 1,
                hash TEXT,
                reply TEXT,
                UNIQUE (timestamp)
            )`,
          [],
        );

        tx.executeSql(
          'REPLACE INTO privateboards_messages_db SELECT * FROM privateboards_messages_db2',
          [],
        );

        tx.executeSql('DROP TABLE privateboards_messages_db2', []);
      }

      if (dbVersion === 8) {
        tx.executeSql(
          `ALTER TABLE
              privateboards_messages_db
              ADD
                  replies INT default 0`,
          [],
        );
      }

      /* Setup default preference values */
      tx.executeSql(
        `INSERT OR IGNORE INTO preferences (
                id,
                currency,
                notificationsenabled,
                scancoinbasetransactions,
                limitdata,
                theme,
                pinconfirmation,
                autooptimize,
                authmethod,
                node,
                nickname
            )
            VALUES (
                0,
                'usd',
                1,
                0,
                0,
                'darkMode',
                0,
                1,
                'hardware-auth',
                ?,
                'Anonymous'
            )`,
        [config.defaultDaemon.getConnectionString()],
      );

      /* Set new auto optimize column if not assigned yet */
      if (dbVersion === 0) {
        tx.executeSql(
          `UPDATE
                    preferences
                SET
                    autooptimize = 1,
                    authmethod = 'hardware-auth',
                    node = ?
                WHERE
                    id = 0`,
          [config.defaultDaemon.getConnectionString()],
        );
      } else if (dbVersion === 1) {
        tx.executeSql(
          `UPDATE
                    preferences
                SET
                    node = ?
                WHERE
                    id = 0`,
          [config.defaultDaemon.getConnectionString()],
        );
      }
      // Remove old messages
      tx.executeSql(
        `
        DELETE FROM privateboards_messages_db
        WHERE rowid IN (
            SELECT rowid
            FROM privateboards_messages_db AS p1
            WHERE (
                SELECT COUNT(*)
                FROM privateboards_messages_db AS p2
                WHERE p1.board = p2.board AND p2.timestamp > p1.timestamp
            ) >= 1000
        )
        `,
        [],
      );

      tx.executeSql('PRAGMA user_version = 9', []);
    },
  );
}

export async function openDB() {
  try {
    database = await SQLite.openDatabase({
      location: 'default',
      name: 'data.DB',
    });

    await createTables(database);
  } catch (err) {
    globals.logger.addLogMessage('Failed to open DB: ' + err);
  }
}

export async function savePreferencesToDatabase(preferences: Preferences) {
  await database.transaction(
    (tx: { executeSql: (arg0: string, arg1: any[]) => void }) => {
      tx.executeSql(
        `UPDATE
                preferences
            SET
                currency = ?,
                notificationsenabled = ?,
                scancoinbasetransactions = ?,
                limitdata = ?,
                theme = ?,
                pinconfirmation = ?,
                autooptimize = ?,
                authmethod = ?,
                node = ?,
                language = ?,
                nickname = ?,
                cache = ?,
                cacheenabled = ?,
                autopickcache = ?,
                websocketenabled = ?
            WHERE
                id = 0`,
        [
          preferences.currency,
          preferences.notificationsEnabled ? 1 : 0,
          preferences.scanCoinbaseTransactions ? 1 : 0,
          preferences.limitData ? 1 : 0,
          preferences.theme,
          preferences.authConfirmation ? 1 : 0,
          preferences.autoOptimize ? 1 : 0,
          preferences.authenticationMethod,
          preferences.node,
          preferences.language,
          preferences.nickname,
          preferences.cache,
          preferences.cacheEnabled,
          preferences.autoPickCache,
          preferences.websocketEnabled,
        ],
      );
    },
  );
}

export async function loadPreferencesFromDatabase() {
  const [data] = await database.executeSql(
    `SELECT
            currency,
            notificationsenabled,
            scancoinbasetransactions,
            limitdata,
            theme,
            pinconfirmation,
            autooptimize,
            authmethod,
            node,
            language,
            nickname,
            cache,
            cacheenabled,
            autopickcache,
            websocketenabled
        FROM
            preferences
        WHERE
            id = 0`,
  );

  if (data && data.rows && data.rows.length >= 1) {
    const item = data.rows.item(0);

    return {
      authConfirmation: item.pinconfirmation === 1,
      authenticationMethod: item.authmethod,
      autoOptimize: item.autooptimize === 1,
      autoPickCache: item.autopickcache,
      cache: item.cache,
      cacheEnabled: item.cacheenabled,
      currency: item.currency,
      language: item.language,
      limitData: item.limitdata === 1,
      nickname: item.nickname,
      node: item.node,
      notificationsEnabled: item.notificationsenabled === 1,
      scanCoinbaseTransactions: item.scancoinbasetransactions === 1,
      theme: item.theme,
      websocketEnabled: item.websocketenabled,
    };
  }

  return undefined;
}

export async function saveMessage(
  conversation: any,
  type: string,
  message: string,
  timestamp: any,
  read = 0,
) {
  console.log('Saving message', conversation, type, message, timestamp, read);

  await database.transaction(
    (tx: { executeSql: (arg0: string, arg1: any[]) => void }) => {
      tx.executeSql(
        `REPLACE INTO message_db
              (conversation, type, message, timestamp, read)
          VALUES
              (?, ?, ?, ?, ?)`,
        [conversation, type, message, timestamp, read],
      );
    },
  );

  globals.updateMessages();
}

export async function updateMessage(temp_timestamp: any, type: string) {
  console.log('Updating message', temp_timestamp, type);

  await database.transaction(
    (tx: { executeSql: (arg0: string, arg1: any[]) => void }) => {
      tx.executeSql(
        `UPDATE message_db
            SET type = ?
            WHERE timestamp = ?`,
        [type, temp_timestamp],
      );
    },
  );

  globals.updateMessages();
}

export async function updateGroupMessage(
  temp_timestamp: any,
  type: string,
  hash: any,
) {
  console.log('Updating group message', temp_timestamp, type, hash);

  await database.transaction(
    (tx: { executeSql: (arg0: string, arg1: any[]) => void }) => {
      tx.executeSql(
        `UPDATE privateboards_messages_db
            SET type = ?, hash = ?
            WHERE timestamp = ?`,
        [type, hash, temp_timestamp],
      );
    },
  );

  globals.updateGroups();
}

export async function saveKnownTransaction(txhash: any) {
  console.log('Saving known pool tx ', txhash);

  const timestamp = Date.now();

  await database.transaction(
    (tx: { executeSql: (arg0: string, arg1: any[]) => void }) => {
      tx.executeSql(
        `REPLACE INTO knownTXs
              (hash, timestamp)
          VALUES
              (?, ?)`,
        [txhash, timestamp],
      );
    },
  );
}

export function emptyKnownTXs() {
  database.transaction((tx: { executeSql: (arg0: string) => void }) => {
    tx.executeSql('DELETE FROM knownTXs');
  });
}

export async function getKnownTransactions() {
  console.log('Getting known pool txs..');

  const [data] = await database.executeSql('SELECT * FROM knownTXs');

  if (data && data.rows && data.rows.length) {
    const knownTXs = [];

    for (let i = 0; i < data.rows.length; i++) {
      knownTXs.push(data.rows.item(i).hash);
    }
    return knownTXs;
  } else {
    return [];
  }
}

export async function deleteKnownTransaction(txhash: any) {
  console.log('Deleting known pool tx ', txhash);

  const oldest_timestamp_allowed = Date.now() - 60 * 60 * 24 * 1000;

  await database.transaction(
    (tx: { executeSql: (arg0: string, arg1: any[]) => void }) => {
      tx.executeSql(
        `DELETE FROM
          knownTXs
      WHERE
          hash = ?
      OR
          timestamp < ?
      `,
        [txhash, oldest_timestamp_allowed],
      );
    },
  );
}

export async function saveGroupMessage(
  group: string | undefined,
  type: string,
  message: any,
  timestamp: any,
  nickname: any,
  address: any,
  reply: any,
  hash: any,
) {
  const read =
    address == globals?.wallet.getPrimaryAddress() ||
    globals?.activeGroup == group
      ? 1
      : 0;

  console.log(
    'Saving group message',
    group,
    type,
    message,
    timestamp,
    nickname,
    address,
    read,
  );

  await database.transaction(
    (tx: { executeSql: (arg0: string, arg1: any[]) => void }) => {
      tx.executeSql(
        `REPLACE INTO privateboards_messages_db
              (board, type, message, timestamp, nickname, address, read, reply, hash)
          VALUES
              (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [group, type, message, timestamp, nickname, address, read, reply, hash],
      );
    },
  );

  if (reply) {
    await database.transaction(
      (tx: { executeSql: (arg0: string, arg1: any[]) => void }) => {
        tx.executeSql(
          `UPDATE privateboards_messages_db
            SET replies = replies + ?
            WHERE hash = ?`,
          [1, reply],
        );
      },
    );
  }

  globals.updateGroups();
}

export async function saveBoardsMessage(
  message: any,
  address: any,
  signature: any,
  board: any,
  timestamp: any,
  nickname: any,
  reply: any,
  hash: any,
  sent: any,
  silent = false,
) {
  const fromMyself = address == globals.wallet.getPrimaryAddress();

  await database.transaction(
    (tx: { executeSql: (arg0: string, arg1: any[]) => void }) => {
      tx.executeSql(
        `REPLACE INTO boards_message_db
              (message, address, signature, board, timestamp, nickname, reply, hash, sent, read)
          VALUES
              (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          message,
          address,
          signature,
          board,
          timestamp,
          nickname,
          reply,
          hash,
          sent,
          fromMyself ? 1 : 0,
        ],
      );
    },
  );
  console.log(silent);

  await database.transaction(
    (tx: { executeSql: (arg0: string, arg1: any[]) => void }) => {
      tx.executeSql(
        `    UPDATE
                  boards_subscriptions
              SET
                  latest_message = ?
              WHERE
                  board = ?`,
        [timestamp, board],
      );
    },
  );

  if (!silent) {
    globals.updateBoardsMessages();
  }
}

export async function removeMessage(timestamp: any) {
  console.log('Removing message ', timestamp);

  await database.transaction(
    (tx: { executeSql: (arg0: string, arg1: any[]) => void }) => {
      tx.executeSql(
        `DELETE FROM
              message_db
          WHERE
              timestamp = ?`,
        [timestamp],
      );
    },
  );

  globals.updateMessages();
}

export async function removeGroupMessage(timestamp: any) {
  console.log('Removing message ', timestamp);

  await database.transaction(
    (tx: { executeSql: (arg0: string, arg1: any[]) => void }) => {
      tx.executeSql(
        `DELETE FROM
                privateboards_messages_db
            WHERE
                timestamp = ?`,
        [timestamp],
      );
    },
  );

  globals.updateMessages();
}

export async function saveOutgoingMessage(message: {
  to: any;
  msg: any;
  t: any;
}) {
  await database.transaction(
    (tx: { executeSql: (arg0: string, arg1: any[]) => void }) => {
      tx.executeSql(
        `INSERT INTO message_db
              (conversation, type, message, timestamp, read)
          VALUES
              (?, ?, ?, ?, ?)`,
        [message.to, 'sent', message.msg, message.t, true],
      );
    },
  );
}

export async function markConversationAsRead(conversation: any) {
  await database.transaction(
    (tx: { executeSql: (arg0: string, arg1: any[]) => void }) => {
      tx.executeSql(
        `UPDATE
          message_db
      SET
          read = 1
      WHERE
          conversation = ?`,
        [conversation],
      );
    },
  );

  globals.unreadMessages = await getUnreadMessages();
  globals.updateMessages();
}

export async function markGroupConversationAsRead(group: any) {
  await database.transaction(
    (tx: { executeSql: (arg0: string, arg1: any[]) => void }) => {
      tx.executeSql(
        `UPDATE
          privateboards_messages_db
      SET
          read = 1
      WHERE
          board = ?`,
        [group],
      );
    },
  );

  globals.unreadMessages = await getUnreadMessages();
  globals.updateGroups();
}

export async function markBoardsMessageAsRead(hash: string) {
  console.log('Marking ' + hash + ' as read.');

  await database.transaction(
    (tx: { executeSql: (arg0: string, arg1: any[]) => void }) => {
      tx.executeSql(
        `UPDATE
          boards_message_db
      SET
          read = 1
      WHERE
          hash = ?`,
        [hash],
      );
    },
  );

  globals.unreadMessages = await getUnreadMessages();
}

export async function savePayeeToDatabase(payee: Payee) {
  await database.transaction(
    (tx: { executeSql: (arg0: string, arg1: any[]) => void }) => {
      tx.executeSql(
        `INSERT INTO payees
                (nickname, address, paymentid)
            VALUES
                (?, ?, ?)`,
        [payee.nickname, payee.address, payee.paymentID],
      );
    },
  );
}

export async function removePayeeFromDatabase(
  nickname: string,
  removeMessages: boolean,
) {
  await database.transaction(
    (tx: { executeSql: (arg0: string, arg1: string[]) => void }) => {
      tx.executeSql(
        `DELETE FROM
                payees
            WHERE
                nickname = ?`,
        [nickname],
      );
    },
  );
  if (removeMessages) {
    //console.log('Removing messages for', address);
    await database.transaction((tx: { executeSql: (arg0: string) => void }) => {
      tx.executeSql(
        `DELETE FROM
                message_db
            WHERE
                conversation = ?`,
        // [address], // Temp
      );
    });
  }
}

export async function saveGroupToDatabase(group: Group) {
  await database.transaction(
    (tx: { executeSql: (arg0: string, arg1: any[]) => void }) => {
      tx.executeSql(
        `INSERT INTO privateboards
              (name, key, latestmessage)
            VALUES
                (?, ?, ?)`,
        [group.group, group.key, Date.now()],
      );
    },
  );
}

export async function removeGroupFromDatabase(
  key: string,
  removeMessages: boolean,
) {
  await database.transaction(
    (tx: { executeSql: (arg0: string, arg1: any[]) => void }) => {
      tx.executeSql(
        `DELETE FROM
                privateboards
            WHERE
                key = ?`,
        [key],
      );
    },
  );
  if (removeMessages) {
    //console.log('Removing messages for', address);
    await database.transaction(
      (tx: { executeSql: (arg0: string, arg1: any[]) => void }) => {
        tx.executeSql(
          `DELETE FROM
                privateboards_messages_db
            WHERE
                board = ?`,
          [key],
        );
      },
    );
  }
}

export async function removeMessages() {
  await database.transaction((tx: { executeSql: (arg0: string) => void }) => {
    tx.executeSql('DELETE FROM message_db');
  });
  await database.transaction((tx: { executeSql: (arg0: string) => void }) => {
    tx.executeSql('DELETE FROM payees');
  });
  await database.transaction((tx: { executeSql: (arg0: string) => void }) => {
    tx.executeSql('DELETE FROM boards_message_db');
  });
  await database.transaction((tx: { executeSql: (arg0: string) => void }) => {
    tx.executeSql('DELETE FROM boards_subscriptions');
  });
  await database.transaction((tx: { executeSql: (arg0: string) => void }) => {
    tx.executeSql('DELETE FROM privateboards_message_db');
  });
  await database.transaction((tx: { executeSql: (arg0: string) => void }) => {
    tx.executeSql('DELETE FROM privateboards');
  });
}

export async function getGroupKey(group: any) {
  const [data] = await database.executeSql(
    `SELECT
            key
        FROM
            privateboards
        WHERE
            name = ${group}`,
  );

  if (data && data.rows && data.rows.length) {
    // const res = [];
    // const payees = data.rows.raw();

    for (let i = 0; i < data.rows.length; i++) {
      const item = data.rows.item(i);

      if (item.key) {
        return item.key;
      } else {
        return false;
      }
    }
  } else {
    return false;
  }
}

export async function getGroupName(key: string | undefined) {
  const [data] = await database.executeSql(
    `SELECT
            *
        FROM
            privateboards
        WHERE
            key = "${key}"`,
  );

  if (data && data.rows && data.rows.length) {
    // const res = [];

    for (let i = 0; i < data.rows.length; i++) {
      const item = data.rows.item(i);
      console.log(item);
      if (item.name) {
        return item.name;
      } else {
        return false;
      }
    }
  } else {
    return false;
  }
}

export async function loadGroupsDataFromDatabase() {
  const [data] = await database.executeSql(
    `SELECT
            name,
            key,
            latestmessage
        FROM
            privateboards`,
  );

  if (data && data.rows && data.rows.length) {
    const res = [];
    // const groups = data.rows.raw();

    const latestMessages = await getLatestGroupMessages();
    const unreads = await getUnreadsPerGroup();

    for (let i = 0; i < data.rows.length; i++) {
      const item = data.rows.item(i);
      const latestMessage = latestMessages.filter((m) => m.group == item.key);
      res.push({
        group: item.name,
        key: item.key,
        lastMessage: latestMessage.length ? latestMessage[0].message : false,
        lastMessageNickname: latestMessage.length
          ? latestMessage[0].nickname
          : false,
        lastMessageTimestamp: latestMessage.length
          ? latestMessage[0].timestamp
          : 0,
        read: latestMessage.length ? latestMessage[0].read : true,
        unreads: unreads[item.key],
      });
    }

    return res.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
  }

  return [];
}

export async function loadPayeeDataFromDatabase() {
  const [data] = await database.executeSql(
    `SELECT
            nickname,
            address,
            paymentid
        FROM
            payees`,
  );

  if (data && data.rows && data.rows.length) {
    const res = [];
    // const payees = data.rows.raw();

    const latestMessages = await getLatestMessages();
    const unreads = await getUnreadsPerRecipient();

    for (let i = 0; i < data.rows.length; i++) {
      const item = data.rows.item(i);
      const latestMessage = latestMessages.filter(
        (m) => m.conversation == item.address,
      );

      res.push({
        address: item.address,
        lastMessage:
          latestMessage.length && item.paymentid
            ? latestMessage[0].message
            : false,
        lastMessageTimestamp:
          latestMessage.length && item.paymentid
            ? latestMessage[0].timestamp
            : 0,
        nickname: item.nickname,
        paymentID: item.paymentid,
        read:
          latestMessage.length && item.paymentid ? latestMessage[0].read : true,
        unreads: unreads[item.address],
      });
    }

    return res.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
  }

  return undefined;
}

export async function getLatestGroupMessages() {
  const [data] = await database.executeSql(
    `
        SELECT *
        FROM privateboards_messages_db D
        WHERE timestamp = (SELECT MAX(timestamp) FROM privateboards_messages_db WHERE board = D.board AND reply = '')
        ORDER BY
            timestamp
        ASC
        `,
  );

  if (data && data.rows && data.rows.length) {
    const res = [];

    for (let i = 0; i < data.rows.length; i++) {
      const item = data.rows.item(i);
      res.push({
        group: item.board,
        hash: item.hash,
        message: item.message,
        nickname: item.nickname,
        read: item.read,
        reply: item.reply,
        timestamp: item.timestamp,
      });
    }
    console.log(res);
    return res;
  }

  return [];
}

export async function getLatestMessages() {
  const [data] = await database.executeSql(
    `
        SELECT *
        FROM message_db D
        WHERE timestamp = (SELECT MAX(timestamp) FROM message_db WHERE conversation = D.conversation)
        ORDER BY
            timestamp
        ASC
        `,
  );

  if (data && data.rows && data.rows.length) {
    const res = [];

    for (let i = 0; i < data.rows.length; i++) {
      const item = data.rows.item(i);
      res.push({
        conversation: item.conversation,
        message: item.message,
        read: item.read,
        timestamp: item.timestamp,
        type: item.type,
      });
    }

    return res;
  }

  return [];
}

export async function getMessages(conversation = false, limit = 25) {
  const [data] = await database.executeSql(
    `SELECT
            conversation,
            type,
            message,
            timestamp
        FROM
            message_db
        ${conversation ? 'WHERE conversation = "' + conversation + '"' : ''}
        ORDER BY
            timestamp
        DESC
        LIMIT ${limit}`,
  );

  const [count] = await database.executeSql(
    `
        SELECT COUNT(*) FROM message_db ${
          conversation ? 'WHERE conversation = "' + conversation + '"' : ''
        }
        `,
  );

  let count_raw = 0;

  if (count && count.rows && count.rows.length) {
    console.log(count);
    // const res = [];

    for (let i = 0; i < count.rows.length; i++) {
      const item = count.rows.item(i);

      count_raw = item['COUNT(*)'];
    }
  }

  if (data && data.rows && data.rows.length) {
    const res = [];

    for (let i = 0; i < data.rows.length; i++) {
      const item = data.rows.item(i);
      res.push({
        conversation: item.conversation,
        count: count_raw,
        message: item.message,
        timestamp: item.timestamp,
        type: item.type,
      });
    }

    return res.reverse();
  }

  return undefined;
}

export async function getGroupMessages(group = false, limit = 25) {
  // const { stack } = new Error();
  // const callerInfo = stack.split('\n');

  if (limit < 25) {
    limit = 25;
  }

  // const starttime = Date.now();

  const [data] = await database.executeSql(
    `
        SELECT
            *
        FROM
            privateboards_messages_db
        ${group ? 'WHERE board = "' + group + '"' : ''}
        ORDER BY
            timestamp DESC
        LIMIT ${limit}`,
  );

  const [count] = await database.executeSql(
    `
        SELECT COUNT(*) FROM privateboards_messages_db ${
          group ? ' WHERE board = "' + group + '"' : ''
        }
        `,
  );

  let count_raw = 0;

  if (count && count.rows && count.rows.length) {
    // const res = [];

    for (let i = 0; i < count.rows.length; i++) {
      const item = count.rows.item(i);

      count_raw = item['COUNT(*)'];
    }
  }

  if (data && data.rows && data.rows.length) {
    const res = [];

    for (let i = 0; i < data.rows.length; i++) {
      const item = data.rows.item(i);

      const thisMessage = {
        address: item.address,
        count: count_raw,
        group: item.board,
        hash: item.hash,
        message: item.message,
        nickname: item.nickname,
        replies: item.replies,
        reply: item.reply,
        replyMessage: '',
        replyNickname: '',
        timestamp: item.timestamp,
        type: item.type,
      };

      if (thisMessage.reply !== '') {
        const thisOP = await getGroupsMessage(thisMessage.reply);
        if (thisOP) {
          thisMessage.replyNickname = thisOP.nickname;
          thisMessage.replyMessage = thisOP.message;
        }
      }

      res.push(thisMessage);
    }
    console.log(res);
    return res.reverse();
  } else {
    console.log('No message le found!');
  }

  return [];
}

export async function getHistory(conversation: any) {
  const [data] = await database.executeSql(
    `SELECT
            conversation,
            type,
            message,
            timestamp
        FROM
            message_db
        WHERE conversation = "${conversation}"
        AND type = "received"
        ORDER BY
            timestamp
        DESC
        LIMIT
        1`,
  );

  if (data && data.rows && data.rows.length) {
    if (Date.now() - data.rows.item(0).timestamp > 24 * 60 * 60 * 1000) {
      return false; // Return false if latest message is more than 24h old, because we want to renew contactability
    }
    return true;
  } else {
    return false;
  }
}

export async function getReplies(post: string) {
  console.log(post);

  if (post == '') {
    return [];
  }

  const [data] = await database.executeSql(
    `SELECT *
        FROM
            privateboards_messages_db WHERE reply = "${post}"
        ORDER BY
            timestamp
        ASC
        LIMIT
        20`,
  );

  console.log('Got ' + data.rows.length + ' board messages');
  if (data && data.rows && data.rows.length) {
    const res = [];

    for (let i = 0; i < data.rows.length; i++) {
      const item = data.rows.item(i);
      console.log(item);
      res.push({
        address: item.address,
        board: item.board,
        message: item.message,
        nickname: item.nickname,
        read: item.read,
        reply: item.reply,
        timestamp: item.timestamp,
        type: item.type,
      });
      const [reply_data] = await database.executeSql(
        `SELECT *
                FROM
                    privateboards_messages_db WHERE reply = "${item.hash}"
                ORDER BY
                    timestamp
                ASC
                LIMIT
                20`,
      );

      // Secondary replies ("replies on replies")
      if (reply_data && reply_data.rows && reply_data.rows.length) {
        const res = [];

        for (let i = 0; i < reply_data.rows.length; i++) {
          const item = reply_data.rows.item(i);
          res.push({
            address: item.address,
            board: item.board,
            message: item.message,
            nickname: item.nickname,
            read: item.read,
            reply: item.reply,
            timestamp: item.timestamp,
            type: item.type,
          });
        }
      }
    }

    return res;
  }

  return [];
}

export async function getBoardsMessages(board = 'Home') {
  const [data] = await database.executeSql(
    `SELECT
            message,
            address,
            signature,
            board,
            timestamp,
            nickname,
            reply,
            hash,
            sent,
            read
        FROM
            boards_message_db ${
              board == 'Home' ? '' : 'WHERE board = "' + board + '"'
            }
        ORDER BY
            timestamp
        DESC
        LIMIT
        20`,
  );
  console.log('Got ' + data.rows.length + ' board messages');
  if (data && data.rows && data.rows.length) {
    const res = [];

    for (let i = 0; i < data.rows.length; i++) {
      const item = data.rows.item(i);
      console.log(item);

      const json = {
        address: item.address,
        board: item.board,
        hash: item.hash,
        message: item.message,
        nickname: item.nickname,
        read: item.read,
        reply: item.reply,
        sent: item.sent,
        signature: item.signature,
        timestamp: item.timestamp,
      };

      if (item.reply && item.reply != '0') {
        // const reply = await getBoardsMessage(item.reply);
        // if (reply.length != 0) {
        //   json.op = reply[0];
        // } else {
        //   json.op = { nickname: 'Unknown' };
        // }
      }

      res.push(json);
    }

    return res;
  }

  return [];
}

export async function getGroupsMessage(hash: any) {
  const [data] = await database.executeSql(
    `SELECT
            *
        FROM
            privateboards_messages_db WHERE hash = '${hash}'`,
  );

  if (data && data.rows && data.rows.length) {
    // const res = [];

    for (let i = 0; i < data.rows.length; i++) {
      const item = data.rows.item(i);
      return item;
    }
  }

  return false;
}

export async function getBoardRecommendations() {
  const [data] = await database.executeSql(
    `
      SELECT board, COUNT(*) as count
      FROM boards_message_db
      WHERE board is not null AND board is not 'Home' AND board is not '' AND board not in (select board from boards_subscriptions)
      GROUP BY board
      ORDER BY
          count
      DESC
      LIMIT
      20
      `,
  );

  console.log('Got ' + data.rows.length + ' board messages');
  if (data && data.rows && data.rows.length) {
    const res = [];

    for (let i = 0; i < data.rows.length; i++) {
      const item = data.rows.item(i);
      console.log(item);
      res.push({
        board: item.board,
        count: item.count,
      });
    }

    return res;
  }

  return [];
}

async function getUnreadBoardMessages(board: any) {
  const [data] = await database.executeSql(
    `
      SELECT COUNT(*)
      FROM boards_message_db
      WHERE
      board = "${board}" AND read = "0"
      `,
  );

  if (data && data.rows && data.rows.length) {
    return data.rows.item(0)['COUNT(*)'];
  }
}

export async function getUnreadMessages() {
  console.log('Getting unreads..');

  const unread_messages: UnreadMessages = {
    boards: 0,
    groups: 0,
    pms: 0,
  }; // Temp fix

  const [data_groups] = await database.executeSql(
    `
      SELECT COUNT(*)
      FROM privateboards_messages_db
      WHERE
      read != "1"
      `,
  );

  if (data_groups && data_groups.rows && data_groups.rows.length) {
    unread_messages.groups = data_groups.rows.item(0)['COUNT(*)'];
  }

  const [data_pms] = await database.executeSql(
    `
      SELECT COUNT(*)
      FROM message_db
      WHERE
      read != "1"
      `,
  );

  if (data_pms && data_pms.rows && data_pms.rows.length) {
    unread_messages.pms = data_pms.rows.item(0)['COUNT(*)'];
  }

  return unread_messages;
}

export async function getUnreadsPerGroup() {
  console.log('Getting unreads grouped..');

  // const unread_messages = {};

  const [data_groups] = await database.executeSql(
    `
            SELECT board, COUNT(*)
            FROM privateboards_messages_db
            WHERE read != "1"
            GROUP BY board;
            `,
  );

  console.log(data_groups);

  const unreads: any = {};

  if (data_groups && data_groups.rows && data_groups.rows.length) {
    for (let i = 0; i < data_groups.rows.length; i++) {
      const item = data_groups.rows.item(i);
      console.log(item);
      unreads[item.board] = item['COUNT(*)'];
    }
  }

  return unreads;
}

export async function getUnreadsPerRecipient() {
  console.log('Getting unreads for recipients..');

  // const unread_messages = {};

  const [data_unreads] = await database.executeSql(
    `
            SELECT conversation, COUNT(*)
            FROM message_db
            WHERE read != "1"
            GROUP BY conversation;
            `,
  );

  const unreads: any = {};

  if (data_unreads && data_unreads.rows && data_unreads.rows.length) {
    for (let i = 0; i < data_unreads.rows.length; i++) {
      const item = data_unreads.rows.item(i);
      console.log(item);
      unreads[item.conversation] = item['COUNT(*)'];
    }
  }

  return unreads;
}

export async function getBoardSubscriptions() {
  const [data] = await database.executeSql(
    `SELECT
            board,
            key,
            latest_message
        FROM
            boards_subscriptions
        ORDER BY
            latest_message
        DESC
        `,
  );
  console.log('Got ' + data.rows.length + ' board messages');
  if (data && data.rows && data.rows.length) {
    const res = [];

    for (let i = 0; i < data.rows.length; i++) {
      const item = data.rows.item(i);

      const unread_messages = await getUnreadBoardMessages(item.board);

      res.push({
        board: item.board,
        key: item.key,
        unread: unread_messages,
      });
    }
    console.log(res);
    return res;
  }

  return [];
}

export async function subscribeToBoard(board: any, key: any) {
  await database.transaction(
    (tx: { executeSql: (arg0: string, arg1: any[]) => void }) => {
      tx.executeSql(
        `REPLACE INTO boards_subscriptions
                (board, key)
            VALUES
                (?, ?)`,
        [board, key],
      );
    },
  );
}

export async function subscribeToGroup(group: any, key: any) {
  await database.transaction(
    (tx: { executeSql: (arg0: string, arg1: any[]) => void }) => {
      tx.executeSql(
        `REPLACE INTO privateboards
                (name, key)
            VALUES
                (?, ?)`,
        [group, key],
      );
    },
  );
}

export async function removeBoard(board: any) {
  await database.transaction(
    (tx: { executeSql: (arg0: string, arg1: any[]) => void }) => {
      tx.executeSql(
        `DELETE FROM
              boards_subscriptions
          WHERE
              board = ?`,
        [board],
      );
    },
  );
}

export async function getLatestGroupMessage() {
  const [data] = await database.executeSql(
    `SELECT
            timestamp
        FROM
            privateboards_messages_db
        ORDER BY
            timestamp
        DESC
        LIMIT
            1`,
  );

  const timestamp = 0;
  if (data && data.rows && data.rows.length) {
    for (let i = 0; i < data.rows.length; i++) {
      const item = data.rows.item(i);
      const { timestamp } = item;
      return timestamp;
    }
  }
  return timestamp;
}

export async function getLatestMessage() {
  const [data] = await database.executeSql(
    `SELECT
            timestamp
        FROM
            message_db
        ORDER BY
            timestamp
        DESC
        LIMIT
            1`,
  );

  const timestamp = 0;
  if (data && data.rows && data.rows.length) {
    for (let i = 0; i < data.rows.length; i++) {
      const item = data.rows.item(i);
      const { timestamp } = item;
      return timestamp;
    }
  }
  return timestamp;
}

export async function messageExists(timestamp: any) {
  const [data] = await database.executeSql(
    `SELECT
            conversation,
            type,
            message,
            timestamp
        FROM
            message_db
        WHERE
            timestamp = ${timestamp}
        `,
  );
  if (data && data.rows && data.rows.length) {
    return true;
  } else {
    return false;
  }
}

export async function groupMessageExists(timestamp: any) {
  const [data] = await database.executeSql(
    `SELECT
            board,
            type,
            message,
            timestamp
        FROM
            privateboards_messages_db
        WHERE
            timestamp = ${timestamp}
        `,
  );
  if (data && data.rows && data.rows.length) {
    return true;
  } else {
    return false;
  }
}

export async function boardsMessageExists(hash: any) {
  const [data] = await database.executeSql(
    `SELECT
            timestamp
        FROM
            boards_message_db
        WHERE
            hash = ?
        `,
    [hash],
  );
  if (data && data.rows && data.rows.length) {
    return true;
  } else {
    return false;
  }
}

export async function saveToDatabase(wallet: any) {
  try {
    await saveWallet(wallet.toJSONString());
    await setHaveWallet(true);
  } catch (err) {
    globals.logger.addLogMessage('Err saving wallet: ' + err);
  }
}

export async function haveWallet() {
  try {
    const value = await AsyncStorage.getItem(config.coinName + 'HaveWallet');

    if (value !== null) {
      return value === 'true';
    }

    return false;
  } catch (error) {
    globals.logger.addLogMessage('Error determining if we have data: ' + error);
    return false;
  }
}

export async function setHaveWallet(haveWallet: boolean) {
  try {
    await AsyncStorage.setItem(
      config.coinName + 'HaveWallet',
      haveWallet.toString(),
    );
  } catch (error) {
    globals.logger.addLogMessage('Failed to save have wallet status: ' + error);
  }
}

export async function saveTransactionDetailsToDatabase(txDetails: any) {
  await database.transaction((tx: any) => {
    tx.executeSql(
      `INSERT INTO transactiondetails
                (hash, memo, address, payee)
            VALUES
                (?, ?, ?, ?)`,
      [txDetails.hash, txDetails.memo, txDetails.address, txDetails.payee],
    );
  });
}

export async function loadTransactionDetailsFromDatabase() {
  const [data] = await database.executeSql(
    `SELECT
            hash,
            memo,
            address,
            payee
        FROM
            transactiondetails`,
  );

  if (data && data.rows && data.rows.length) {
    const res = [];

    for (let i = 0; i < data.rows.length; i++) {
      const item = data.rows.item(i);
      res.push({
        address: item.address,
        hash: item.hash,
        memo: item.memo,
        payee: item.payee,
      });
    }

    return res;
  }

  return undefined;
}
