// ManualBulkScrobbler
// app.js

import fs from "fs";
import path from "path";
import LastfmAPI from "lastfmapi";

/*
Start script checking input file,
expecting audio track list in the form:

`[artist] --- [track] --- [datetime]`

Datetime parameter is non-required. If there is no datetime stamps in the file, the script will ask it.
All of subsequent tracks will be assumed to be the length of 4 minutes.

Will scrobble new updates to Last.fm with api data from passwords.json:
{
	"lastfm_user": "...",
	"lastfm_password": "...",
    "lastfm_api_key" : "...",
    "lastfm_secret" : "..."
}
*/

import passwords from "./passwords.json";

let lfm = new LastfmAPI({
	'api_key' : passwords.lastfm_api_key,
	'secret' : passwords.lastfm_secret
});

let lastTimestamp = null;
let storePath = path.resolve(__dirname, "store.json");
let scrobbleHistoryLocation = path.resolve(__dirname, "scrobbleHistory.txt");




/*
Set up: write persistent store file if it doesn't exist 
*/
if (!fs.existsSync(storePath)) {
	console.log("writing empty store...");
	fs.writeFile(storePath, "{}", 'utf8');
}

// start script with file from command `node app.js [/path/to/audio.txt]`
// read audio file every 5 seconds, scrobble if updated
let file = process.argv[2];
setInterval(function() {
	console.log("checking for new audio data...");

	let audioDataPath = path.resolve(__dirname, file);
	fs.readFile(audioDataPath, 'utf8', (err, audioData) => {
		if (err) {
			console.log(err);
		} else if (audioData) {
			fs.readFile(storePath, 'utf8', function(err, storeData) {
				if (err) {
					console.log(err);
				} else {
					let store = JSON.parse(storeData);

					// read live audio data and scrobble if it's new
					let pattern = /([^\n]*)---([^\n]*)/g;
					let match = pattern.exec(audioData);
					if (match) {
						let artist = match[1];
						let track = match[2];
						if (artist && track) {
							artist = artist.trim();
							track = track.trim();
							if (artist && track && (store.artist !== artist || store.track !== track)) {
								// new track -> scrobble & save!
								authenticateSession(function() {
									console.log(new Date().toLocaleString(), 'found a new track to scrobble:', artist, '---', track);
									scrobble(artist, track, Math.floor(Date.now() / 1000));

									let json = JSON.stringify({
										artist: artist,
										track: track
									});
									fs.writeFile(storePath, json, 'utf8');
								});
							}
						}
					}
				}
			});
		}
	});
}, 5000);

