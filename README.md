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
$ npm install -g ani2mal
```

### Usage
#### Basic Setup
1. Run ```ani2mal --help``` in your terminal or cmd to see help.
2. Set basic information as below. This is required to export your anilists.  
```bash
$ ani2mal --set-user

# After setting your usernames run below command to make sure everything is working.

$ ani2mal --update
```

#### Sync Setup **(Optional)**
1. To sync your Anilist updates to MAL, you need to create a MAL Client. Follow this guide for instructions: [Authorization flow for the new MAL API using OAuth 2.0](https://myanimelist.net/blog.php?eid=835707).
2. After creating a client, set your client id and secret as below.
```
$ ani2mal --set-client
```
5. Then, authorize your client.
```bash
$ ani2mal --login
```
6. That's it. Now you can sync your Anilist updates to MAL easily.

### Examples
- Export anime & manga lists.

```bash
$ ani2mal --export
```
- Login to MAL **(Required for Sync feature)**.
```bash
$ ani2mal --login
```
- Sync changes.
```bash
$ ani2mal --sync
```
- Monitor and Sync changes.
```bash
$ ani2mal --watch
```


