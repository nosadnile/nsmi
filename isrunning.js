const { exec, execSync } = require('child_process');

function isRunning(win, mac, linux) {
    const plat = process.platform
    const cmd = plat == 'win32' ? 'tasklist' : (plat == 'darwin' ? 'ps -ax | grep ' + mac : (plat == 'linux' ? 'ps -A' : ''))
    const proc = plat == 'win32' ? win : (plat == 'darwin' ? mac : (plat == 'linux' ? linux : ''))
    if(cmd === '' || proc === ''){
        return false;
    }
    var out = execSync(cmd);
    return out.toString().toLowerCase().indexOf(proc.toLowerCase()) > -1;
}
console.log(isRunning("java.exe", "java", "java"));
console.log(isRunning("javaw.exe", "javaw", "javaw"));