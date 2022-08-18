/*

*/
import passwords from "./passwords.json";

/***
 * Creates a Last.fm session and executes callback within that session
 * @param lfmApi last.fm API object
 * @param callback function to execute
 */
function authenticateSession(lfmApi, callback) {
    lfmApi.auth.getMobileSession(passwords.lastfm_user, passwords.lastfm_password, function(err, session) {
        if (err) {
            console.log(err);
        }
        lfmApi.setSessionCredentials(session.username, session.key);
        callback();
    });
}

/***
 * Scrobble a track on Last.fm
 * Should be executed within a valid session
 * @param lfmApi last.fm API object
 * @param artist artist name
 * @param track track name
 * @param dateTime scrobble date time as a Date time string
 */
function scrobble(lfmApi, artist, track, dateTime) {
    let timestamp = Math.floor(new Date(dateTime) / 1000);
    let scrobbleParams = { artist, track, timestamp };

    lfmApi.track.scrobble(scrobbleParams, (err, scrobbles) => {
        if (err) {
            return console.error(`Failed to scrobble! '${artist} - ${track}' :`, err);
        }
        console.log('Scrobbled:', scrobbles);
    });
}
