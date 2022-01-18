if(process.platform === "win32") {
    console.log("Please run `npm run dist:win`.");
} else if(process.platform == "darwin") {
    console.log("Please run `npm run dist:mac`.");
} else if(process.platform == "linux") {
    console.log("Please run `npm run dist:linux`.");
} else {
    console.log("Unsupported build platform.");
}