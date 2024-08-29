import { enablePromise, openDatabase } from 'react-native-sqlite-storage';

enablePromise(true);

let db;

export const getDBConnection = async () => {
  return openDatabase({ location: 'default', name: 'hugin.db' });
};

export const initDB = async () => {
  console.log('Initializing database..2');
  try {
    db = await getDBConnection();
    console.log('Got db connection');
    const query = `CREATE TABLE IF NOT EXISTS rooms ( 
        name TEXT,
        key TEXT,
        seed TEXT default null,
        latestmessage INT default 0,
        UNIQUE (key)
    )`;
    console.log('quey quertinh');
    const result = await db.executeSql(query);
    console.log(result);
  } catch (err) {
    console.log(err);
  }

  await saveRoomToDatabase('test', '1234567890');
  console.log('saved room');
  getRooms(db);
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

export async function getRooms(db: SQLiteDatabase) {
  const results = await db.executeSql('SELECT * FROM rooms');

  //const rooms: Room[] = [];

  results.forEach((result) => {
    for (let index = 0; index < result.rows.length; index++) {
      console.log(result.rows.item(index));
      //todoItems.push(result.rows.item(index));
    }
  });
}
