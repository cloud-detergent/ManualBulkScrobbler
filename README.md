# ManualBulkScrobbler
Based on `RivendellScrobbler` in terms of working with Last.fm API. 

Last.fm scrobbler script targeting track list file. 

Starts script checking input file,
expecting live audio data from of the form:

```
[artist] --- [track] --- [datetime]
[artist] --- [track]
```

Datetime parameter is optional for all lines but the first one. All of subsequent tracks will be assumed to be the length of 4 minutes if other is not set.

Will scrobble new updates to Last.fm with api data from `passwords.json`:

```
{
    "lastfm_user": "...",
    "lastfm_password": "...",
    "lastfm_api_key" : "...",
    "lastfm_secret" : "..."
}
```

The script will not look for any updates done to a file. At the moment edit menu allows to select a portion of a track list to be scrobbled. 

```
$ node app.js audio.txt 
1 - АВИА - Праздник - 2022-09-21T10:24:40.000Z 


Y/n - scrobble, e - edit, q - quit :  
About to scrobble 1 track(-s)
21/09/2022, 14:27:41 scrobbled : 5 tracks
Scrobbled: {
  scrobble: {
    artist: { corrected: '0', '#text': 'АВИА' },
    album: { corrected: '0' },
    track: { corrected: '0', '#text': 'Праздник' },
    ignoredMessage: { code: '0', '#text': '' },
    albumArtist: { corrected: '0', '#text': '' },
    timestamp: '1663755880'
  },
  '@attr': { ignored: 0, accepted: 1 }
}
```
