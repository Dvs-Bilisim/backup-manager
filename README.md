# backup-manager

It's a simple library to manage backups for various services

## Install

```bash
npm i --save backup-manager
```

You can also clone this repository and make use of it yourself.

```bash
git clone https://github.com/Dvs-Bilisim/backup-manager.git
cd backup-manager
npm i
npm test
```

## Configuration

- **debug       :** Debug mode. It's disabled by default.
- **filename    :** Name of backup file.
- **min         :** Minimum number of backup files should be kept.
- **overwrite   :** Flag for overwriting an existing backup file.
- **path        :** Backup folder.
- **size        :** Maximum amount of total back up files. If we reach that value, an old backup will be removed.

## Backup Example for MongoDB

```js
const MongoDB = require('backup-manager').MongoDBPlugin;

// path should be created before creating an instance
const mongo = new MongoDB({ debug: true, path: '/tmp/backup' });
mongo.backup({ host: 'localhost', db: 'test', gzip: true }, error => console.log(error));
```

## Restore Example for MongoDB

```js
const MongoDB = require('backup-manager').MongoDBPlugin;

// path should exist and contain backup files
const mongo = new MongoDB({ debug: true, path: '/tmp/backup' });
mongo.restore({ host: 'localhost', db: 'test', gzip: true }, error => console.log(error));
```

## Backup Example for MySQL

```js
const MySQL = require('backup-manager').MySQLPlugin;

// path should be created before creating an instance
const mysql = new MySQL({ debug: true, path: '/tmp/backup' });
mysql.backup({ '-h': false, localhost: false, '-uroot': false, databases: 'backup_test' }, error => console.log(error));
```

## TODO

- Backup and restore for folders
- Backup and restore for MySQL
- Backup and restore for PostgreSQL
