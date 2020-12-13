## Anilist-to-MAL-Sync
_Export / Sync your Anilist to MAL._

### Features
- Export Anilist anime/manga lists to MAL compatible XML format.
- Sync Anilist updates to MAL automatically.

### Prerequisites
- Node.js 12 or above.
- NPM.

### Installation
1. Install as a global module.
```
$ npm install -g anilist-to-mal-sync
```

### Usage
#### Basic Setup
1. Run ```malsync --help``` in your terminal or cmd to see help.
2. Set basic information as below. This is required to export your anilists.  
```bash
$ malsync --set-user

# After setting your usernames run below command to make sure everything is working.

$ malsync --update
```

#### Sync Setup **(Optional)**
1. To sync your Anilist updates to MAL, you need to create a MAL Client. Follow this guide for instructions: [Authorization flow for the new MAL API using OAuth 2.0](https://myanimelist.net/blog.php?eid=835707).
2. After creating a client, set your client id and secret as below.
```
$ malsync --set-client
```
5. Then, authorize your client.
```bash
$ malsync --login
```
6. That's it. Now you can sync your Anilist updates to MAL easily.

### Examples
- Update local Anilist cache.
```bash
$ malsync --update
```
- Export anime & manga lists.

```bash
$ malsync --export
```
- Login to MAL **(Required for Sync feature)**.
```bash
$ malsync --login
```
- Sync changes.
```bash
$ malsync --sync
```
- Monitor and Sync changes.
```bash
$ malsync --watch
```


