import {enablePromise, openDatabase} from 'react-native-sqlite-storage';
import { err } from 'react-native-svg';

enablePromise(true);

let db;

export const getDBConnection = async () => {
  return openDatabase({name: 'hugin.db', location: 'default'});
};

export const initDB = async () => {

    console.log('Initializing database..2');

    db = await getDBConnection();

    const query = `CREATE TABLE IF NOT EXISTS rooms (
        name TEXT,
        key TEXT,
        latestmessage INT default 0,
        UNIQUE (key)
    )`;

    const result = await db.executeSql(query);
    console.log(result)
    await saveRoomToDatabase(db, 'test', '1234567890');
    console.log('saved room')
    getRooms(db)



}

export async function saveRoomToDatabase(db: SQLiteDatabase, name: String, key: String) {

    console.log('Saving room ', name);

    try {
        const result = await db.executeSql(
            `REPLACE INTO rooms (name, key, latestmessage) VALUES (?, ?, ?)`,
            [name, key, Date.now()]
        );
          console.log(result);
    } catch (err) {
        console.log(err);
    }
       
        

  }

  export async function getRooms(db: SQLiteDatabase) {

    const results = await db.executeSql(
       `SELECT * FROM rooms`
     );

     //const rooms: Room[] = [];

     results.forEach(result => {
        for (let index = 0; index < result.rows.length; index++) {
            console.log(result.rows.item(index));
          //todoItems.push(result.rows.item(index));
        }
      });

}