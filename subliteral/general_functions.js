// ---- GENERAL PURPOSE FUNCTIONS -----
function info(msg) {
  console.log("[INFO] " + msg);
}

function dbug(msg) {
  console.log("[DBUG] " + msg);
}

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function heads() {
  return getRndInteger(0,1) === 0;
}

// utility for overboard only, returns int: 0-27; ABC is global
function letterNumAt(p,l,x) {
  return ABC.indexOf(charAt(p,l,x));
}

function charAt(p,l,x) {
  return passages[p].display[l].charAt(x);
}

function charAtWas(p,l,x) {
  return passages[p].model[l].charAt(x);
}

function charIsInflected(p,l,x) {
  return (passages[p].display[l].charAt(x) !== charAtWas(p,l,x));
}

function fillWithSpaces(rt) {
  rt.text(rt.text().replace(/[a-z]/gi,SPC));
}

function rndIndex(a) {
  let ints = [];
  for (var i = 0; i < a.length; i++) {
    ints.push(i);
  }
  return ints.shuffle();
}

Array.prototype.shuffle = function() {
  // var input = this;
  for (var i = this.length-1; i >=0; i--) {
    let randomIndex = Math.floor(Math.random()*(i+1));
    let itemAtIndex = this[randomIndex];
    this[randomIndex] = this[i];
    this[i] = itemAtIndex;
  }
  return this;
};

function doze(s, resolution = .5) {
  // let p = new Promise(resolve => setTimeout(resolve, s * 1000));
  let p = new Promise(async function(resolve, reject) {
    setTimeout(() => resolve(millis()), s * 1000);
    while (standingOrder == "continue") {
      await sleep(resolution);
    }
    reject(new Error(standingOrder));
  });
  return p;
}

function sleep(s) {
  return new Promise(resolve => setTimeout(resolve, s * 1000));
}
