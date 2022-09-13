function parseExcludeTracks(excludeTracksAnswer, max) {
    let excludeTracksInfo = excludeTracksAnswer.split(' ');
    let excludeTrackNumbers = [];
    excludeTracksInfo.forEach(x => {
        let index;
        if ((index = x.indexOf('-')) > 0) {
            let start = Number(x.substring(0, index));
            let end = Number(x.substring(index + 1));

            if (start > 0 && start < max && end > 0) {
                end = Math.min(end, max);
                excludeTrackNumbers.push({ start, end });
            }
        }
        else {
            let start = Number(x);
            excludeTrackNumbers.push({ start, end: start });
        }
    });

    const hasRange = (arr, x) => x && arr.some(d => d.start <= x.start && d.end >= x.end);
    return excludeTrackNumbers
        .reduce((acc, x) => {
            if (!hasRange(acc, x)) {
                acc.push(x);
            }

            return acc;
        }, [])
        .map(x => ({ start: x.start - 1, end: x.end - 1 }))
        .sort((x, y) => x.start - y.start);
}

export { parseExcludeTracks };
