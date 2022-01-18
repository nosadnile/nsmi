/*

    NoSadNile Modpack Installer v0.1.2.0
    Created by the NoSadNile Network in 2021
    for use with NoSadNile Modpacks.

    https://git.nosadnile.net/RedstoneWizard08/nosadnile-modpack-installer/

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
    
    The NoSadNile Network is not associated with Mojang AB.

    To create a modpack, see the NoSadNile Modpack Creator (Coming soon).

    The libraries used in this program's licenses apply. You can find
    them on their respective GitHub pages and/or websites (Not listed here).

*/

const remoteMain = require('@electron/remote/main')
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const url = require("url");
const ejse = require("ejs-electron");
const fs = require("fs");
const { exec, execSync } = require("child_process");
const { default: axios } = require("axios");
const uuid = require("uuid");
const express = require("express");
const bp = require("body-parser");
const request = require('request');
const progress = require('request-progress');
const readline = require('readline');
const _cliProgress = require('cli-progress');
const { downloadProgress, downloadOverrides } = require("./download.js");
const yauzl = require("yauzl");
const AdmZip = require("adm-zip");

remoteMain.initialize();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

app.disableHardwareAcceleration();

var win;
var isInstalling = false;
function createWindow() {
    win = new BrowserWindow({
        width: 600,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, "preload.js")
        },
        autoHideMenuBar: true,
        title: "NoSadNile Modpack Installer",
        icon: getPlatformIcon("icon-256x256"),
        resizable: false
    });
    remoteMain.enable(win.webContents);
    if(isInstalling) {
        ejse.data("install_modpack", true);
    } else {
        ejse.data("install_modpack", false);
    }
    win.loadURL(url.format({
        pathname: path.join(__dirname, "index.ejs"),
        protocol: "file:",
        slashes: true
    }));
    win.on("close", () => {
        win = null;
    });
    win.on("closed", () => {
        win = null;
    });
    const is = express();
    is.use(bp.json());
    is.use(bp.urlencoded({ extended: true }));
    is.post("/of", (req, res) => {
        var cmd = "start cmd /C \"" + req.body.path + "\"";
        console.log("Executing: " + cmd);
        exec(cmd, (err, stdout, stderr) => {
            if(err) {
                console.log(err.message);
                return;
            }
            if(stderr) {
                console.log(stderr);
                return;
            }
            console.log(stdout);
            res.send("Installed");
        });
    });
    is.listen(39999, () => {
        console.log("Internal server listening on port 39999.");
    });
}

function getPlatformIcon(filename){
    let ext
    switch(process.platform) {
        case 'win32':
            ext = 'ico'
            break
        case 'darwin':
        case 'linux':
        default:
            ext = 'png'
            break
    }

    return path.join(__dirname, 'assets', `${filename}.${ext}`)
}

app.on("ready", () => {
    createWindow();
});

app.on("activate", () => {
    if(win === null) {
        createWindow();
    }
});

app.on("window-all-closed", () => {
    if(process.platform !== "darwin") {
        app.quit();
    }
});