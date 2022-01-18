const request = require('request'), 
    fs = require('fs'), 
    _cliProgress = require('cli-progress');

const downloadProgress = (url, filename, callback) => {
    const progressBar = new _cliProgress.SingleBar({
        format: '{bar} {percentage}% | ETA: {eta}s'
    }, _cliProgress.Presets.shades_classic);

    const file = fs.createWriteStream(filename);
    let receivedBytes = 0;
    request.get(url).on('response', (response) => {
        if(response.statusCode !== 200) {
            return callback('Response status was ' + response.statusCode);
        }
        const totalBytes = response.headers['content-length'];
        progressBar.start(totalBytes, 0);
    }).on('data', (chunk) => {
        receivedBytes += chunk.length;
        progressBar.update(receivedBytes);
    }).pipe(file).on('error', (err) => {
        fs.unlink(filename);
        progressBar.stop();
        return callback(err.message);
    });
    file.on('finish', () => {
        progressBar.stop();
        file.close(callback);
    });
    file.on('error', (err) => {
        fs.unlink(filename); 
        progressBar.stop();
        return callback(err.message);
    });
}


const fileUrl = `https://cdn.nosadnile.net/mp/outperform/1.0/overrides.zip`;
downloadProgress(fileUrl, 'overrides.zip', () => {});

const downloadOverrides = (url, callback) => {
    console.log(">> External function call: downloadOverrides");
    downloadProgress(url, "overrides.zip", () => {
        console.log("Downloaded overrides.");
        callback();
    });
}

module.exports = { downloadProgress, downloadOverrides };