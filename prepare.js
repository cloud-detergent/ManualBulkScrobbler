// ManualBulkScrobbler
// app.js

import fs from 'fs';
import path from 'path';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'url';
import { parseExcludeTracks } from "./edit-helper.js";


/*
Start script checking input file,
expecting audio track list in the form:

`[artist]
[datetime]
[track] [timestamp]
[timestamp] [track]`

Datetime parameter is optional for all lines but the first one. All of subsequent tracks will be assumed to be the length of 4 minutes if other is not set.

*/

// start script with file from command `node app.js [/path/to/audio.txt]`

const minuteInMs = 60000;
const hourInMinutes = 60;
const stdMinuteGap = 4;
let trackList = [];

function addToDateTime(date, hours, minutes=0, seconds=0) {
    return new Date(date.getTime() + hours * hourInMinutes * minuteInMs + minutes * minuteInMs + seconds);
}

async function processQueue() {
    let file = process.argv[2];

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    let audioDataPath = path.resolve(__dirname, file);
    const audioData = fs.readFileSync(audioDataPath, { encoding: 'utf8', flag: 'r' });

    if (audioData) {
        let dataList = audioData.split('\n').map(x => x.trim()).filter(x => x.length > 0);
        if (dataList <= 2) {
            return;
        }
        
        let artist = dataList[0]?.trim();
        let savedDatetime = new Date(dataList[1]);
        if (isNaN(savedDatetime.getTime())) {
            throw new Error(`'${dataList[1]}' is considered to be an invalid string`);
        }
        
        for (let i = 2; i < dataList.length; i++) {
            let delimIndex1 = dataList[i].indexOf(' ');
            let delimIndex2 = dataList[i].lastIndexOf(' ');

            let track = '';
            let datetime;

            if (dataList[i].length > 0) {
                let hours = 0;
                let minutes = stdMinuteGap;
                let seconds = 0;
               
                if (delimIndex1 > -1 && delimIndex2 > -1) {
                    let sub1 = dataList[i].substring(0, delimIndex1);
                    let sub2 = dataList[i].substring(delimIndex2);
                    let timeStr = undefined;
                    
                    if (sub1.includes(':')) {
                        timeStr = sub1;
                    }
                    else if (sub2.includes(':')) {
                        timeStr = sub2;
                    }
                    if (!!timeStr) {
                        let index = timeStr.indexOf(':');
                        let lastIndex = timeStr.lastIndexOf(':');
                        if (index === lastIndex) {
                            minutes = Number(timeStr.substring(0, index));
                            seconds = Number(timeStr.substring(index + 1));
                        }
                        else {
                            hours = Number(timeStr.substring(0, index));
                            minutes = Number(timeStr.substring(index + 1, lastIndex));
                            seconds = Number(timeStr.substring(lastIndex + 1));
                        }
                        
                        track = dataList[i].replace(timeStr, '');
                    }
                }
                
                if (!track) {
                    track = dataList[i];
                }
                
                if (track) {
                    track = track.trim();

                    if (!datetime) {
                        if (!savedDatetime) {
                            throw new Error('Date time should be set for the first track in the queue.');
                        }

                        datetime = addToDateTime(savedDatetime, hours, minutes, seconds);
                    }

                    //savedDatetime = datetime;
                    //trackList.push({ artist, track, datetime });
                    console.log(`${artist} --- ${track} --- ${datetime.toISOString()}`);
                }
            }
        }

    }
}

await processQueue();
