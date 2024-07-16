const pg = require('pg');
const { env } = require('process');
require('dotenv').config();

async function Partitioning() {
  const dbClientConnections = new pg.Client({
    user: 'postgres',
    host: 'localhost',
    database: env.DB,
    password: env.DB_PASSWORD,
    port: env.DB_PORT,
  });

  dbClientConnections.connect();
  await dbClientConnections.query('drop database if exists customers');
  await dbClientConnections.query('create database  customers');

  await dbClientConnections.end();

  const dbCustomerClientConnections = new pg.Client({
    user: 'postgres',
    host: 'localhost',
    database: 'customers',
    password: env.DB_PASSWORD,
    port: env.DB_PORT,
  });
  await dbCustomerClientConnections.connect();

  return new Promise(async (resolve, reject) => {
    await dbCustomerClientConnections.query(
      'create table customers (id  serial, name varchar(255)) partition by range (id);'
    );
    for (let index = 0; index < 25; index++) {
      const partitionName = ` customers_Partitioning_${index * 100000}_${
        (index + 1) * 100000
      } `;
      const createPartitionQuery = `create table ${partitionName} (like customers including indexes)`;
      await dbCustomerClientConnections.query(createPartitionQuery);

      const connectPartitionsQuery = `alter table customers attach partition ${partitionName} for values from (${
        index * 100000
      }) to (${(index + 1) * 100000});`;
      await dbCustomerClientConnections.query(connectPartitionsQuery);
      console.log('Created Partition ', partitionName);
    }
    resolve(await dbCustomerClientConnections.end());
    reject(await dbCustomerClientConnections.end());
  }).then(() => 'Done 〽️〽️〽️〽️〽️');
}

Partitioning()
  .then(console.log)
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
