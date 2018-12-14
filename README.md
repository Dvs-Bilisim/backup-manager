# backup-manager (under development)

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

## TODO

- Backup and restore for folders
- Backup and restore for MySQL
- Backup and restore for PostgreSQL
