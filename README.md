## Anilist-to-MAL-Sync
_Export / Sync your Anilist to MAL._

### Features
- Export Anilist anime/manga lists to MAL compatible XML format.
- Sync Anilist updates to MAL automatically.

### Prerequisites
- Node.js 12 or above.
- NPM.

### Installation
1. Clone / Download this repository.
```bash
$ git clone https://github.com/ipmanlk/anilist-to-mal-sync.git
```
2. Install dependencies.
```bash
$ cd anilist-to-mal-sync
$ npm install
```

### Usage
1. Rename ``config.sample.json`` file inside ``config`` directory to ``config.json``.
2. Fill your details in ``config.json`` file. Instructions on getting a client id and secret can be found here: [Authorization flow for the new MAL API using OAuth 2.0](https://myanimelist.net/blog.php?eid=835707). ``syncDelay`` option is the delay in minutes when checking for updates.
3. Build the project.
```bash
$ npm run build
```
4. View help by running,
```bash
$ npm start --help
```

### Examples
- Update local Anilist cache.
```bash
$ node dist/app.js --update
```
- Export anime & manga lists. _Exported XML can be found in ``exports`` directory_.

```bash
$ node dist/app.js --export
```
- Login to MAL **(Required for Sync feature)**.
```bash
$ node dist/app.js --login
```
- Sync changes.
```bash
$ node dist/app.js --sync
```
- Monitor and Sync changes.
```bash
$ node dist/app.js --watch
```


