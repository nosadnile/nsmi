const fabricInstall = (modpack, tempdir, force, to) => {
    var ip = document.getElementById("ip");
    var fabricInstaller = "https://maven.fabricmc.net/net/fabricmc/fabric-installer/0.9.0/fabric-installer-0.9.0.jar";
    var fabricInstallerPath = path.join(tempdir, "fabric-installer-0.9.0.jar");
    var download = require("download");
    download(fabricInstaller, fabricInstallerPath).then(() => {
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
                    if (JSON.parse(fs.readFileSync(path.join(basePath, packid, "modpack.nsmp"))).info.version == modpack.info.version) {
                        if (!force) {
                            console.log("Modpack already exists!");
                            document.getElementById("status").innerHTML = "Modpack already exists!";
                            return;
                        }
                    }
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
        var cmd = "java -jar " + fabricInstallerPath + "/fabric-installer-0.9.0.jar client -dir " + mcDefaultPath + " -noprofile -mcversion" + modpack.minecraft.version + " -loader " + modpack.minecraft.loaderVersion;
        if (process.platform == "win32") {
            cmd = "java -jar " + fabricInstallerPath + "\\fabric-installer-0.9.0.jar client -dir " + mcDefaultPath + " -noprofile -mcversion" + modpack.minecraft.version + " -loader " + modpack.minecraft.loaderVersion;
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
            if (!fs.existsSync(modsPath)) {
                fs.mkdirSync(modsPath);
            }
            var installedMods = 0;
            for (var i = 0; i < modpack.mods.length; i++) {
                var mod = modpack.mods[i];
                axios.get(`https://addons-ecs.forgesvc.net/api/v2/addon/${mod.projectID}/file/${mod.fileID}/download-url`, {
                    method: "GET",
                    responseType: "text"
                }).then((resp) => {
                    download(resp.data, modsPath).then(() => {
                        installedMods += 1;
                        ip.value = installedMods;
                        var value = (ip.value - ip.min) / (ip.max - ip.min) * 100;
                        ip.style.background = 'linear-gradient(to right, #24d17a 0%, #24d17a ' + value + '%, #fff ' + value + '%, white 100%)';
                        document.getElementById("im").innerHTML = `Installed mods: ${installedMods}/${modpack.mods.length} [${resp.data.split("/")[resp.data.split("/").length - 1]}]`;
                        console.log("Installed mod: " + "[" + (installedMods < 10 ? (modpack.mods.length >= 10 ? "0" + installedMods : (modpack.mods.length >= 100 ? "00" + installedMods : installedMods)) : installedMods) + "/" + modpack.mods.length + "] " + resp.data.split("/")[resp.data.split("/").length - 1]);
                        if (installedMods == modpack.mods.length) {
                            console.log("Installed mods.");
                            console.log("Downloading overrides...");
                            downloadOverrides(modpack.overrides, () => {
                                console.log("Extracting overrides...");
                                var zip = new AdmZip("./overrides.zip");
                                zip.extractAllTo(minecraftPath, true);
                                console.log("Extracted overrides.");
                                console.log("Cleaning up...");
                                fs.rmSync("./overrides.zip", {
                                    recursive: true
                                });
                                console.log("Cleaned up.");
                                console.log("Finishing up...");
                                if(to == "official") {
                                    var fp = `${mcDefaultPath}/launcher_profiles.json`;
                                    var fp2 = `${mcDefaultPath}/launcher_profiles_microsoft_store.json`;
                                    if (fs.existsSync(fp)) {
                                        var profile = JSON.parse(fs.readFileSync(fp));
                                        if (!profile.profiles[packid]) {
                                            profile.profiles[packid] = {
                                                created: new Date().toISOString(),
                                                icon: "Gold_Block",
                                                lastUsed: new Date().toISOString(),
                                                lastVersionId: `fabric-loader-${modpack.minecraft.loaderVersion}-${modpack.minecraft.version}`,
                                                name: modpack.info.name,
                                                type: "custom",
                                                gameDir: minecraftPath
                                            };
                                        }
                                        fs.writeFileSync(fp, JSON.stringify(profile, null, 4));
                                    }
                                    if (fs.existsSync(fp2)) {
                                        var profile2 = JSON.parse(fs.readFileSync(fp2));
                                        if (!profile2.profiles[packid]) {
                                            profile2.profiles[packid] = {
                                                created: new Date().toISOString(),
                                                icon: "Gold_Block",
                                                lastUsed: new Date().toISOString(),
                                                lastVersionId: `fabric-loader-${modpack.minecraft.loaderVersion}-${modpack.minecraft.version}`,
                                                name: modpack.info.name,
                                                type: "custom",
                                                gameDir: minecraftPath
                                            };
                                        }
                                        fs.writeFileSync(fp2, JSON.stringify(profile2, null, 4));
                                    }
                                } else if(to == "overwolf") {
                                    
                                }
                                fs.writeFileSync(path.join(minecraftPath, "modpack.nsmp"), JSON.stringify(modpack, null, 4));
                                console.log("Completed modpack installation.");
                                document.getElementById("status").innerHTML = "Completed modpack installation.";
                                return;
                            });
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
};

module.exports = fabricInstall;