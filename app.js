// ManualBulkScrobbler
// app.js

import fs from 'fs';
import path from 'path';
import LastfmAPI from 'lastfmapi';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'url';
import passwords from "./passwords.json" assert { type: "json" };
import { parseExcludeTracks } from "./edit-helper.js";
import { authenticateSession, scrobble } from "./lastfm-helper.js";


/*
Start script checking input file,
expecting audio track list in the form:

`[artist] --- [track] --- [datetime]`
`[artist] --- [track]`

Datetime parameter is optional for all lines but the first one. All of subsequent tracks will be assumed to be the length of 4 minutes if other is not set.

Will scrobble new updates to Last.fm with api data from passwords.json:
{
	"lastfm_user": "...",
	"lastfm_password": "...",
    "lastfm_api_key" : "...",
    "lastfm_secret" : "..."
}
*/

let lastfmAPI = new LastfmAPI({
    'api_key': passwords.lastfm_api_key,
    'secret': passwords.lastfm_secret
});

// start script with file from command `node app.js [/path/to/audio.txt]`

const minuteInMs = 60000;
const stdMinuteGap = 4;
let trackList = [];

function addToDateTime(date, minutes) {
    return new Date(date.getTime() + minutes * minuteInMs);
}

function getTrackListString() {
    let list = trackList.map((x, i) => `${i + 1} - ${x.artist} - ${x.track} - ${x.datetime.toISOString()}`);
    return list.join('\n');
}

async function trackListEditScrobbleMenu(rl) {
    let list = getTrackListString();
    console.log(list, '\n\n');

    const answer = await rl.question(`Y/n - scrobble, e - edit, q - quit :  `);
    if (answer === '' || answer.toLowerCase() === 'y') {
        console.log(`About to scrobble ${trackList.length} track(-s)`);
        scrobbleTrackList();
    }

    if (answer.toLowerCase() === 'e') {
        const excludeTracksAnswer = await rl.question(`Tracks to exclude: (e.g.: "1 2 3", "1-3"):  `);
        let excludeTrackNumbers = parseExcludeTracks(excludeTracksAnswer, list.length); // '1-3 5 7' ; '2-9 3 7'

        for (let i = excludeTrackNumbers.length - 1; i >= 0; i--) {
            let delCnt = excludeTrackNumbers[i].end - excludeTrackNumbers[i].start + 1;
            trackList.splice(excludeTrackNumbers[i].start, delCnt);
        }

        await trackListEditScrobbleMenu(rl);
    }
}

function scrobbleTrackList() {
    if (trackList && trackList.length > 0) {
        authenticateSession(lastfmAPI, () => {
            trackList.forEach(x => scrobble(lastfmAPI, x.artist, x.track, x.datetime));
            console.log(new Date().toLocaleString(), `scrobbled : ${trackList.length} tracks`);
        });
    }
}

async function processQueue() {
    const rl = readline.createInterface({ input, output });
    let file = process.argv[2];

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    let audioDataPath = path.resolve(__dirname, file);
    const audioData = fs.readFileSync(audioDataPath, { encoding: 'utf8', flag: 'r' });

    if (audioData) {
        let trackData = audioData.split('\n').map(x => x.trim()).filter(x => x.length > 0);

        let savedDatetime = undefined;

        for (let i = 0; i < trackData.length; i++) {
            let delimIndex1 = trackData[i].indexOf('---');
            let delimIndex2 = trackData[i].lastIndexOf('---');

            if (delimIndex1 > -1 && delimIndex2 > -1) {
                let artist = trackData[i].substring(0, delimIndex1);
                let track = '';
                let datetime = null;

                if (delimIndex1 === delimIndex2) {
                    track = trackData[i].substring(delimIndex1 + 3);
                }
                else {
                    track = trackData[i].substring(delimIndex1 + 3, delimIndex2);
                    datetime = new Date(trackData[i].substring(delimIndex2 + 3));
                }

                if (artist && track) {
                    artist = artist.trim();
                    track = track.trim();

                    if (!datetime) {
                        if (!savedDatetime) {
                            throw new Error('Date time should be set for the first track in the queue.');
                        }

                        datetime = addToDateTime(savedDatetime, stdMinuteGap);
                    }

                    savedDatetime = datetime;

                    if (artist && track && datetime) {
                        trackList.push({ artist, track, datetime });
                    }
                }
            }
        }

        await trackListEditScrobbleMenu(rl);
    }

    rl.close();
}

await processQueue();
