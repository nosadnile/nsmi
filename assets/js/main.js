var f = document.getElementById("f");
var fl = document.getElementById("file");
var cf = document.getElementById("cf");
var ins = document.getElementById("install");
var fc = document.getElementById("fc");
var iQ = document.getElementsByClassName("icon-q")[0];
var ip = document.getElementById("ip");
var ip2 = document.getElementById("ip2");
var force = document.getElementById("force");

cf.addEventListener("click", () => {
  fl.click();
});

fl.addEventListener("change", () => {
    fc.innerHTML = "No file chosen";
    if(fl.files[0].name.split(".")[fl.files[0].name.split(".").length - 1] == "nsmp" && JSON.parse(fs.readFileSync(fl.files[0].path)) && JSON.parse(fs.readFileSync(fl.files[0].path)).info && JSON.parse(fs.readFileSync(fl.files[0].path)).info.name) {
        fc.innerHTML = JSON.parse(fs.readFileSync(fl.files[0].path)).info.name + (JSON.parse(fs.readFileSync(fl.files[0].path)).info.version ? " v" + JSON.parse(fs.readFileSync(fl.files[0].path)).info.version : "");
    } else {
        if(fl.files[0] && fl.files[0].path) {
            document.getElementById("status").innerHTML = "Invalid modpack selected!";
        } else {
            document.getElementById("status").innerHTML = "Modpack not selected!";
        }
    }
});

ins.addEventListener("change", () => {
  console.log(ins.value);
  if (ins.value == "MultiMC") {
    document.getElementsByClassName("mmc-i-d")[0].style.display = "block";
    iQ.style.marginTop = "27.25vh";
  } else {
    document.getElementsByClassName("mmc-i-d")[0].style.display = "none";
    iQ.style.marginTop = "36.25vh";
  }
});

f.addEventListener("click", (e) => {
  console.log(`Force? ${force.checked}`);
  if(fl.files[0] == undefined) {
    document.getElementById("status").innerHTML = "Modpack not selected!";
  } else {
    console.log(`Installing modpack: ${fl.files[0].path}.`);
    install(fl.files[0].path, force.checked, ins.value);
  }
});

ip.value = 0;
var value = ((ip.value - ip.min) / (ip.max - ip.min)) * 100;
ip.style.background =
  "linear-gradient(to right, #24d17a 0%, #24d17a " +
  value +
  "%, #fff " +
  value +
  "%, white 100%)";

ip.addEventListener("input", () => {
  var value = ((this.value - this.min) / (this.max - this.min)) * 100;
  this.style.background =
    "linear-gradient(to right, #24d17a 0%, #24d17a " +
    value +
    "%, #fff " +
    value +
    "%, white 100%)";
});

ip2.value = 0;
var value = ((ip2.value - ip2.min) / (ip2.max - ip2.min)) * 100;
ip2.style.background =
  "linear-gradient(to right, #24d17a 0%, #24d17a " +
  value +
  "%, #fff " +
  value +
  "%, white 100%)";

ip2.addEventListener("input", () => {
  var value = ((this.value - this.min) / (this.max - this.min)) * 100;
  this.style.background =
    "linear-gradient(to right, #24d17a 0%, #24d17a " +
    value +
    "%, #fff " +
    value +
    "%, white 100%)";
});
