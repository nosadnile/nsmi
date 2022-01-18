const remoteMain = require('@electron/remote/main')
const {
    app,
    BrowserWindow,
    ipcMain
} = require("electron");
const path = require("path");
const url = require("url");
const fs = require("fs");
const {
    exec,
    execSync
} = require("child_process");
const {
    default: axios
} = require("axios");
const uuid = require("uuid");
const express = require("express");
const bp = require("body-parser");
const request = require('request');
const progress = require('request-progress');
const readline = require('readline');
const _cliProgress = require('cli-progress');
const yauzl = require("yauzl");
const AdmZip = require("adm-zip");
const fabricInstall = require("./assets/js/installers/fabric");

window.install = function (mpath, force, to) {
    var mp = fs.readFileSync(mpath, "utf8");
    downloadFiles(mp, force, to);
};

const downloadProgress = (url, filename, callback) => {
    const progressBar = new _cliProgress.SingleBar({
        format: '{bar} {percentage}% | ETA: {eta}s'
    }, _cliProgress.Presets.shades_classic);

    var totalBytes;
    const file = fs.createWriteStream(filename);
    let receivedBytes = 0;
    request.get(url).on('response', (response) => {
        if (response.statusCode !== 200) {
            return callback('Response status was ' + response.statusCode);
        }
        totalBytes = response.headers['content-length'];
        document.getElementById("ip2").max = totalBytes;
        var value = (document.getElementById("ip2").value - document.getElementById("ip2").min) / (document.getElementById("ip2").max - document.getElementById("ip2").min) * 100;
        document.getElementById("ip2").style.background = 'linear-gradient(to right, #24d17a 0%, #24d17a ' + value + '%, #fff ' + value + '%, white 100%)';
        document.getElementById("io").innerHTML = `Installed overrides: 0%`;
        progressBar.start(totalBytes, 0);
    }).on('data', (chunk) => {
        receivedBytes += chunk.length;
        document.getElementById("ip2").value = receivedBytes;
        var value = (document.getElementById("ip2").value - document.getElementById("ip2").min) / (document.getElementById("ip2").max - document.getElementById("ip2").min) * 100;
        document.getElementById("ip2").style.background = 'linear-gradient(to right, #24d17a 0%, #24d17a ' + value + '%, #fff ' + value + '%, white 100%)';
        document.getElementById("io").innerHTML = `Installed overrides: ${Math.ceil((100 * receivedBytes) / totalBytes)}%`;
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

const downloadOverrides = (url, callback) => {
    downloadProgress(url, "overrides.zip", () => {
        console.log("Downloaded overrides.");
        callback();
    });
}

function toUnfriendly(str) {
    return str.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
}

function isRunning(win, mac, linux) {
    const plat = process.platform
    const cmd = plat == 'win32' ? 'tasklist' : (plat == 'darwin' ? 'ps -ax | grep ' + mac : (plat == 'linux' ? 'ps -A' : ''))
    const proc = plat == 'win32' ? win : (plat == 'darwin' ? mac : (plat == 'linux' ? linux : ''))
    if (cmd === '' || proc === '') {
        return false;
    }
    var out = execSync(cmd);
    return out.toString().toLowerCase().indexOf(proc.toLowerCase()) > -1;
}

function downloadFiles(data, force, to) {
    var tempdir = path.join(process.env.temp, "nosadnile-modpack-installer");
    if (!fs.existsSync(tempdir)) {
        fs.mkdirSync(tempdir);
    }
    var modpack = JSON.parse(data);
    document.getElementById("ip").max = modpack.mods.length;
    var value = (document.getElementById("ip").value - document.getElementById("ip").min) / (document.getElementById("ip").max - document.getElementById("ip").min) * 100;
    document.getElementById("ip").style.background = 'linear-gradient(to right, #24d17a 0%, #24d17a ' + value + '%, #fff ' + value + '%, white 100%)';
    document.getElementById("im").innerHTML = `Installed mods: 0/${modpack.mods.length}`;
    if (isRunning("java.exe", "java", "java")) {
        if (process.platform == "win32") {
            console.log("Please exit java.exe before running.");
        } else {
            console.log("Please exit java before running.");
        }
        document.getElementById("status").innerHTML = "Please exit java or java.exe before running.";
        return;
    }
    if (isRunning("javaw.exe", "java", "java")) {
        if (process.platform == "win32") {
            console.log("Please exit javaw.exe before running.");
        } else {
            console.log("Please exit javaw before running.");
        }
        document.getElementById("status").innerHTML = "Please exit javaw or javaw.exe before running.";
        return;
    }
    if (modpack.minecraft.loader == "fabric") {
        fabricInstall(modpack, tempdir, force, to);
    } else if (modpack.minecraft.loader == "forge") {
        var forgeInstaller = `https://files.minecraftforge.net/maven/net/minecraftforge/forge/${modpack.minecraft.version}-${modpack.minecraft.loaderVersion}/forge-${modpack.minecraft.version}-${modpack.minecraft.loaderVersion}-installer.jar`;
        var forgeInstallerPath = path.join(tempdir, `forge-${modpack.minecraft.version}-${modpack.minecraft.loaderVersion}-installer.jar`);
        var download = require("download");
        download(forgeInstaller, forgeInstallerPath).then(() => {
            var exec = require("child_process").exec;
            var packid = toUnfriendly(modpack.info.name);
            var basePath = "~/nsmp_instances";
            if (process.platform == "darwin") {
                basePath = "~/nsmp_instances";
            } else if (process.platform == "win32") {
                basePath = process.env.AppData + "\\.nsmp_instances";
            }
            var mcDefaultPath = "~/.minecraft";
            if (process.platform == "darwin") {
                mcDefaultPath = "~/Library/Application Support/minecraft";
            } else if (process.platform == "win32") {
                mcDefaultPath = process.env.AppData + "\\.minecraft";
            }
            var minecraftPath = path.join(basePath, packid);
            if (!fs.existsSync(basePath)) {
                fs.mkdirSync(basePath);
            } else {
                if (fs.existsSync(path.join(basePath, packid))) {
                    if (fs.existsSync(path.join(basePath, packid, "modpack.nsmp"))) {
                        console.log("Modpack already exists!");
                        return;
                    } else {
                        fs.rmSync(minecraftPath, {
                            recursive: true
                        });
                        fs.mkdirSync(minecraftPath);
                    }
                } else {
                    fs.mkdirSync(minecraftPath);
                }
            }
            console.log("Please follow the on-screen instructions for the Minecraft Forge installer. The Minecraft path is " + minecraftPath + ".");
            var cmd = "java -jar " + forgeInstallerPath + "/" + `forge-${modpack.minecraft.version}-${modpack.minecraft.loaderVersion}-installer.jar` + " client -dir " + minecraftPath + " -noprofile -mcversion" + modpack.minecraft.version + " -loader " + modpack.minecraft.loaderVersion;
            if (process.platform == "win32") {
                cmd = "java -jar " + forgeInstallerPath + "\\" + `forge-${modpack.minecraft.version}-${modpack.minecraft.loaderVersion}-installer.jar` + " client -dir " + minecraftPath + " -noprofile -mcversion" + modpack.minecraft.version + " -loader " + modpack.minecraft.loaderVersion;
            }
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    console.log(error.message);
                    return;
                }
                if (stderr) {
                    console.log(stderr);
                    return;
                }
                console.log(stdout);
                var modsPath = minecraftPath + "/mods";
                if (process.platform == "win32") {
                    modsPath = minecraftPath + "\\mods";
                }
                fs.mkdirSync(modsPath);
                var installedMods = 0;
                for (var i = 0; i < modpack.mods.length; i++) {
                    var mod = modpack.mods[i];
                    axios.get(`https://addons-ecs.forgesvc.net/api/v2/addon/${mod.projectID}/file/${mod.fileID}/download-url`, {
                        method: "GET",
                        responseType: "text"
                    }).then((resp) => {
                        download(resp.data, modsPath).then(() => {
                            installedMods += 1;
                            console.log("Installed mod: " + "[" + (installedMods < 10 ? (modpack.mods.length >= 10 ? "0" + installedMods : installedMods) : (modpack.mods.length >= 100 ? "00" + installedMods : installedMods)) + "/" + modpack.mods.length + "] " + resp.data.split("/")[resp.data.split("/").length - 1]);
                            if (installedMods == modpack.mods.length) {
                                console.log("Completed modpack installation.");
                                return;
                            }
                        }).catch(err => {
                            console.error(err);
                        });
                    });
                }
            });
        }).catch(err => {
            console.error(err);
        });
    }
}