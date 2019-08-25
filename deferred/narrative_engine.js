/* globals RiText, Hammer, RiTa, stories, pairs */
// deferred, by John Cayley
// adapted from subliteral
// configuration
var VERSION = "0.4.1"; // tweaked for pairs always opposed
var IVORY_ON_BLACK = true, DBUG = false, INFO = true;
var BLACK = [0, 0, 0, 255];
var IVORY = [255, 255, 240, 255];
var FILL;
var BACKGROUND;
var FLOATING = 0, SURFACING = 1, SINKING = 2;
var BUOYANCY_STRINGS = ["floating","surfacing","sinking"];
var SHOW_TITLES = false;
var TITLES_FX_SECS = .05, SUFLOSI_FX_SECS = 1.25;
var fxSeconds = TITLES_FX_SECS;
// var NO_SPACES = false, NO_APOSTROPHE = false;
var SPC = " ", SPC_NUM = 0;
var ABC = " abcdefghijklmnopqrstuvwxyz";
var DEFAULT_LANGUAGE = "en";
var WIDTH = 1080, HEIGHT = 1920;
// var L_MARGIN = 140, T_MARGIN = 100;
// var R_MARGIN = 960;
// var STORY_X = 220, STORY_Y = 160;
var T_MARGIN = 100;
// var L_MARGIN = 180, R_MARGIN = 1020;
var STORY_X = 50, STORY_Y = 72; // X: 320 / 32
//
var TITLES_FONT_SIZE = 28;
var STORY_FONT_SIZE = 70;
var fontSize, fontWidth, leading; // font size, font (one char) width, leading;
// fontSize = TITLES_FONT_SIZE;
// leading = setLeading(fontSize);
var xPos = STORY_X, yPos = STORY_Y;
var story;
var tokens = [], tokens_sublit = [];
var rts = [];
var rtTitle = [], titleY = T_MARGIN;
var italicSize = 30;
var temp;

var monoFont,titleFont,serifFont,storyFont;
// NEW STUFF
var promises = [], captions = [];
var standingOrder = "continue";
var phase = {value: 0, max: 1, subphase: [{value: 0, max: 0}, {value: 0, max: 1}]};
var keyLock = false, showStatusUntil = 0;
var titles = [];
var titlePassage;
var literalAlts;
// gestures
var gestures, canvas;


// ----- P5 FUNCTIONS -----
function preload() {
  titleFont = loadFont("fonts/TrajanPro-Regular.otf");
  // mono possible: DejaVuSansMono, Consolas, AndaleMono, PrestigeEliteStd-Bd.otf
  monoFont = loadFont("fonts/AndaleMono.ttf");
  // serif possible: iowansrm, Constantia, DejaVuSerif, Cambria, Perpetua
  serifFont = loadFont("fonts/iowaosrm.ttf");
  storyFont = monoFont;
  literalAlts = loadStrings("literalalts.json");
//  arsFont = loadFont('../fonts/Perpetua.ttf');
//  arsItalic = loadFont('../fonts/PerpetuaItalic.ttf');
}

async function setup() {

  info("deferred subliterals version " + VERSION);
  createCanvas(WIDTH, HEIGHT);
  noCursor();

  literalAlts = JSON.parse(literalAlts.join(""));
  literalAlts = literalAlts[DEFAULT_LANGUAGE];
  FILL  = (IVORY_ON_BLACK ? IVORY : BLACK);
  BACKGROUND = (IVORY_ON_BLACK ? BLACK : IVORY);
  RiText.defaultFill(FILL);

  //
  // if (DBUG) dbug("fontWidth: " + fontWidth + " fill: ");
  // if (DBUG) dbug(RiText.defaultFill());

  // EDIT THIS LINE FOR ONE STORY
  // OR COMMENT OUT FOR ALL:
  // stories = { "ars": stories["ars"] };
  // ---- set up Gestures ----
  gestures = new Hammer.Manager(canvas);
  // gestures.set({ domEvents: true});
  // gestures.get("pinch").set({ enable: true });

  gestures.add(new Hammer.Swipe({ direction: Hammer.DIRECTION_ALL, domEvents: true }));
  gestures.add(new Hammer.Swipe({ event: "doubleswipe", pointers: 2 }) );
  gestures.add(new Hammer.Press());
  gestures.add(new Hammer.Press({ event: "doublepress", pointers: 2 }) );

  gestures.on("swipeleft", function() {
    if (keyLock) return false;
    standingOrder = "next";
    // info("swipeleft: " + standingOrder);
  });

  gestures.on("swiperight", function() {
    if (keyLock) return false;
    standingOrder = "previous";
    // info("swiperight: " + standingOrder);
  });

  gestures.on("doubleswipe", function() {
    if (keyLock) return false;
    standingOrder = "quit";
    // info("swipedown: " + standingOrder);
  });

  gestures.on("press", function() {
    if (keyLock) return false;
    standingOrder = "pressing";
    // info("press: " + standingOrder);
  });

  gestures.on("pressup", function() {
    if (keyLock) return false;
    standingOrder = "continue";
    // info("pressup: " + standingOrder);
  });

  gestures.on("doublepress", function() {
    if (keyLock) return false;
    standingOrder = "continue";
    toggleAudio(paused);
    // info("swipeup: audio " + (withAudio ? "on" : "off"));
  });

  // ---- Titles ----
  fontSize = setFont(storyFont, TITLES_FONT_SIZE);
  //
  titles.push("s u b l i t e r a l   p o e t i c s");
  titles.push("deferred lest meaning hoard solidity");
  titles.push("John Cayley, 2019");
  titles.push("ambient version for Poesis, Kassel");
  titles.push(" –> or mobile swipe-left to move on");
  titles.push("<– or mobile swipe-right to go back");
  titles.push("Q or mobile two-finger swipe-left to quit abruptly");
  titles.push(VERSION + " with thanks to Daniel C. Howe’s RiTa");
  titles.push("programmatology.shadoof.net/?deferred ");

  titlePassage = new Passage();
  titlePassage.model = titles;

  lineY = 140;
  titlePassage.display = [titles.length];
  for (i = 0; i < titles.length; i++) {
    titlePassage.display[i] = new RiText(titles[i]);
    titlePassage.display[i].position(WIDTH/2 - titlePassage.display[i].textWidth()/2, lineY);
    // we're opening with all spaces, so replace letters with spaces
    // replace(/[a-z]/g," "));
    titlePassage.display[i].text(titles[i].replace(/./g," "));
    // adding a copy to the rt for crossFades
    titlePassage.display[i].fadeFrom = titlePassage.display[i].copy();
    titlePassage.display[i].fadeFrom.alpha(0);
    switch (i) {
    case 0: lineY += leading * .5; break;
    case 1: lineY += leading; break;
    case 2: lineY += leading * .5; break;
    case 3: lineY += leading * .5; break;
    case 6: lineY += leading * .5; break;
    }
    lineY += leading;
  }

  // MAIN:
  narrate();
  // try{
  //   await titlePassage.drift(SURFACING,0);
  // } catch (err) {
  //   standingOrder = handleInterruption(err.message);
  // }
  // try{
  // await narrativeShowTitles (millis() + 30 * 1000);
  // } catch (err) {
  //   standingOrder = handleInterruption(err.message);
  // }
  // try{
  // await titlePassage.drift(SINKING,0);
  // } catch (err) {
  //   standingOrder = handleInterruption(err.message);
  // }
  // 30 iterations means one story will display for a maximum of 10 mins
  // DEPRECATED loop:
  // for (var i = 0; i < 12; i++) {
  // await spellTheStories(stories, "SEQUENTIAL_FADES", fadeSeconds = 3, iterations = 30);
  // }

}

function draw() {
  background(BACKGROUND);
  RiText.drawAll();
}

// ----- MANIFESTATION -----
async function narrate() {
  var narrativePhases = [];
  narrativePhases.push(narrativeTitles); // narrativeTitles
  narrativePhases.push(narrativeStories);
  //
  do {
    info("trying phase: " + phase.value);
    try {
      await narrativePhases[phase.value]();
      info("came back resolved in main do loop");
    } catch (err) {
      //
      info("caught " + err.message + " in main do loop");
      standingOrder = handleInterruption(err.message);
    }
  }
  while (standingOrder == "continue");
  //
}

async function narrativeTitles() {
  RiText.dispose(rts);
  // await cleanUp();
  // make titles are visible and full of spaces
  for (let rt of titlePassage.display) {
    rt.text(rt.text().replace(/./g," "));
    rt.alpha(255);
  }
  // make sure the story titles and stories are cleared
  // TODO:
  // for (let passage of passages) {
  //   var j = 0;
  //   for (let rt of passage.display) {
  //     fillWithSpaces(rt);
  //     for (let fxImage of passage.imgs[j++]) {
  //       replacePixels(fxImage.display,waveImages[0]);
  //     }
  //   }
  // }

  try {
    await titlePassage.drift(SURFACING,0);
  } catch (err) {
    if (err.message == "previous" || err.message == "quit") {
      // info("caught previous in narrativeTitles");
      return Promise.reject(new Error(err.message));
    }
    standingOrder = handleInterruption(err.message);
  }

  resetPhase(0);

  try {
    await narrativeShowTitles (millis() + 30 * 1000);
  } catch (err) {
    if (err.message == "previous" || err.message == "quit") {
      return Promise.reject(new Error(err.message));
    }
    standingOrder = handleInterruption(err.message);
  }

  resetPhase(0);

  try {
    await titlePassage.drift(SINKING,0);
  } catch (err) {
    if (err.message == "previous" || err.message == "quit") {
      // info("caught previous in narrativeTitles");
      return Promise.reject(new Error(err.message));
    }
    standingOrder = handleInterruption(err.message);
  }

  resetPhase(1);
  fontSize = setFont(storyFont, 70, 1.75);
  // TODO: RiText.defaultFontSize(FONT_SIZE);
  standingOrder = "continue";
}

async function narrativeShowTitles (titlesRead) {
  var i = 0;
  for (let rt of titlePassage.display) {
    rt.text(titlePassage.model[i++]);
  }
  do {
    await sleep(1);
    if (standingOrder != "continue" && standingOrder != "pressing") {
      return Promise.reject(new Error(standingOrder));
    }
  }
  while ((standingOrder == "continue" || standingOrder == "pressing") && millis() < titlesRead);
}

async function narrativeStories() {
  for (let rt of titlePassage.display) {
    rt.text(rt.text().replace(/./g," "));
  }
  try {
    await spellTheStories(stories, "SHUFFLED_FADES", fadeSeconds = 3, iterations = 30);
  } catch (err) {
    return Promise.reject(new Error(err.message));
  }
  // one round complete, keep spelling them
  resetPhase(1);
}

async function spellTheStories(stories, mode, fadeSeconds = 3, iterations = 1) {
  for (var key in stories) {
    story = stories[key];
    if (INFO) info("story is: " + key);
    if (SHOW_TITLES && story.title && story.title.length > 0) {
      // display the title; special treatment for "ars":
      // if (DBUG) dbug("key: " + key + " " + (key == "ars"));
      titleY = T_MARGIN;
      for (var i = 0; i < story.title.length; i++) {
        // titles can have different margin (L_MARGIN)
        rtTitle[i] = new RiText(story.title[i], L_MARGIN, titleY, titleFont);
        rtTitle[i].fill(BACKGROUND);
        rtTitle[i].colorTo(FILL, 3);
        titleY += (leading + fontSize);
      }
      if (DBUG) dbug("tseconds: " + story.tseconds);
      for (var i = 0; i < story.tseconds; i++) {
        await sleep(1);
        if (standingOrder == "next") {
          standingOrder = "continue";
          break;
        } else if (standingOrder != "continue" && standingOrder != "pressing") {
          for (let rt of rtTitle) {
            RiText.dispose(rt);
          }
          return Promise.reject(new Error(standingOrder));
        }
      }
      for (i = 0; i < story.title.length; i++) {
        rtTitle[i].colorTo(BACKGROUND,3);
      }
      await sleep(3.1);
      for (i = 0; i < story.title.length; i++) {
        RiText.dispose(rtTitle[i]);
      }
    }
    // now, the story itself
    tokens = buildTokens(story, false);
    // honestly not sure why this snippet was written ...
    // tokens_sublit = [];
    // for (var i = 0; i < tokens.length; i++) {
    //   if (pairs[tokens[i]]) {
    //     tokens[i] = heads() ? tokens[i] : pairs[tokens[i]][0];
    //     tokens_sublit.push(pairs[tokens[i]][0]);
    //   } else {
    //     tokens_sublit.push(tokens[i]);
    //   }
    // }
    // ... to replace this:
    tokens_sublit = buildTokens(story, true);
    rts = await(layoutStory(story.text));
    await fadeIn(rts);
    try {
      await spellStory(mode, story.seconds, fadeSeconds, iterations);
    } catch (err) {
      standingOrder = handleInterruption(err.message);
      if (standingOrder != "continue")
        return Promise.reject(new Error(standingOrder));
    }
    if (DBUG) dbug("waited to cleanUp ...");
    await cleanUp();
    await sleep(3);
  } // for stories loop
  return new Promise(resolve => resolve(INFO ? info("a round of stories COMPLETED ..") : "one round of stories"));
}

function spellStory(mode, storySeconds, fadeSeconds, iterations) {
  if (DBUG) dbug("mode: " + mode);
  let f;
  switch (mode) {
    case "SHUFFLED_FADES":
      if (INFO) info("Shuffled token fades");
      f = shuffledFades(storySeconds, fadeSeconds, iterations);
      break;
    case "SEQUENTIAL_FADES":
      if (INFO) info("Sequential token fades");
      f = sequentialFades(storySeconds, fadeSeconds, iterations);
      break;
    case "SL_PAIRS_SEQ_FADE":
      if (INFO) info("SL pairs only sequential fades");
      f = pairsOnlySequentialFades(5, iterations);
      break;
    case "TOGGLE_RETOGGLE":
    default:
      if (INFO) info("Toggle cut toggle, repeat");
      f = toggleCutToggle(5);
  }
  return new Promise(resolve => resolve(f));
}

async function shuffledFades(storySeconds, fadeSeconds, iterations) {
  var sublit = true;
  while (standingOrder == "continue") { // keyIsPressed !== true // for (var i = 0; i < iterations; i++) { //
    if (keyIsDown(RIGHT_ARROW) !== true) await sleep(fxSeconds * 1.5); //storySeconds / 3);
    let rndTokenIndex = rndIndex(tokens);
    for (var t = 0; t < tokens.length; t++) {
      var j = rndTokenIndex[t];
      var testAgainst = (sublit ? tokens_sublit[j] : tokens[j]);
      // if (DBUG)
      //   dbug(rts[j].text().valueOf() + " " + testAgainst + " " + (rts[j].text().valueOf() != testAgainst));
      // wd = RiTa.trimPunctuation(rts[j].text());
      // to only change a differing word three out of four times, add:
      //  && (getRndInteger(0,3) > 0)
      if (rts[j].text() != testAgainst) {
        if (DBUG) dbug(rts[j].text() + "@" + j + " --> " + testAgainst);
        textTo(rts[j], testAgainst, fadeSeconds);
        // first literary tweak - opposite numbers always different:
        let middle = tokens.length / 2;
        let oppositeNumber = j < middle ? tokens.length - j - 1 : middle - (j - middle) - 1 ;
        if (testAgainst == rts[oppositeNumber].text()) {
          textTo(rts[oppositeNumber], (sublit ? tokens[j] : tokens_sublit[j]), fadeSeconds);
        }
        // second literary tweak no longer necessary after 0.4.1
        // because "read" is used in both main and 'sublit' text:
        // let tweakedIndex = -1, tweakTo;
        // switch (testAgainst) {
        //   case "road":
        //     tweakedIndex = (rts[j+1].text() == "it") ? (j+1) : tweakedIndex;
        //     tweakedIndex = (rts[j-1].text() == "it") ? (j-1) : tweakedIndex;
        //     tweakTo = "if";
        //     break;
        //   case "it":
        //     tweakedIndex = (rts[j+1].text() == "road") ? (j+1) : tweakedIndex;
        //     tweakedIndex = (rts[j-1].text() == "road") ? (j-1) : tweakedIndex;
        //     tweakTo = "read";
        //     break;
        // }
        // if (tweakedIndex > 0) {
        //   textTo(rts[tweakedIndex], tweakTo, fadeSeconds);
        // }
        // END literary tweaks
        if (keyIsDown(RIGHT_ARROW) !== true) await sleep(storySeconds / tokens.length * 1.5);
      } else {
        if (DBUG) dbug("keeping " + rts[j].text() + "@" + j);
        continue;
      }
      if (DBUG) dbug("at " + t + " of " + tokens.length);
      if (standingOrder != "continue" && standingOrder != "pressing") {
        // make sure concurrent Promises resolve
        keyLock = true;
        await sleep(fadeSeconds * 1.5);
        keyLock = false;
        return Promise.reject(new Error(standingOrder));
      }
      // if (keyIsDown(RIGHT_ARROW))
      //   break;
      // the following is the pause before the next token is shifted:
      await sleep(fadeSeconds * 1.5);
    }
    // if (keyIsDown(RIGHT_ARROW))
    //   break;
    await sleep(fadeSeconds * 1.5); // storySeconds / 5);
    if (INFO) info("iteration COMPLETED");
    sublit = !sublit;
  }
  bumpPhase(1);
  if (INFO) info("shuffledFades COMPLETED");
}

async function sequentialFades(storySeconds, fadeSeconds, iterations) {
  var sublit = true;
  for (var i = 0; i < iterations; i++) { // while (keyIsPressed !== true) {
    if (keyIsDown(RIGHT_ARROW) !== true) await sleep(storySeconds / 3);
    for (var j = 0; j < tokens.length; j++) {
      var testAgainst = (sublit ? tokens_sublit[j].valueOf() : tokens[j].valueOf());
      // if (DBUG)
      //   dbug(rts[j].text().valueOf() + " " + testAgainst + " " + (rts[j].text().valueOf() != testAgainst));
      // wd = RiTa.trimPunctuation(rts[j].text());
      if (rts[j].text().valueOf() != testAgainst) {
        textTo(rts[j], (sublit ? tokens_sublit[j] : tokens[j]) , fadeSeconds);
        if (keyIsDown(RIGHT_ARROW) !== true) await sleep(storySeconds / tokens.length * 1.5);
      }
      if (standingOrder != "continue" && standingOrder != "pressing") {
        // make sure concurrent Promises resolve
        keyLock = true;
        await sleep(fxSeconds * 1.5);
        keyLock = false;
        return Promise.reject(new Error(standingOrder));
      }
      // if (keyIsDown(RIGHT_ARROW))
      //   break;
    }
    // if (keyIsDown(RIGHT_ARROW))
    //   break;
    await sleep(storySeconds / 5);
    sublit = !sublit;
  }
  bumpPhase(1);
  if (INFO) info("sequentialFades COMPLETED");
}

async function pairsOnlySequentialFades(seconds, iterations) {
  for (var i = 0; i < iterations; i++) {
    await sleep(seconds);
    for (var j = 0; j < tokens.length; j++) {
      let wd = RiTa.trimPunctuation(rts[j].text());
      if (pairs[wd]) {
        textTo(rts[j],tokens_sublit[j],3);
      }
    }
  }
}

async function toggleCutToggle(seconds, iterations) {
  for (var j = 0; j < iterations || 1000; j++) {
    for (var i = 0; i < tokens.length; i++) {
      rts[i].text(tokens_sublit[i]);
    }
    await sleep(seconds);
    for (i = 0; i < tokens.length; i++) {
      rts[i].text(tokens[i]);
    }
    await sleep(seconds);
  }
}

function handleInterruption(interruption, feedback) {
  // info(interruption + " at beginning of handleInterruption");
  var feedback = feedback || false;
  var newStandingOrder = interruption || "continue";
  switch (interruption) {
  case "continue":
    break;
  case "quit":
    noLoop();
    break;
  case "next":
    bumpPhase(1);
    newStandingOrder = "continue";
    break;
  case "previous":
    if (phase.value == 0) resetPhase(0);
    else bumpPhase(-1);
    newStandingOrder = "continue";
    break;
  default:
    throw new Error(interruption);
  }
  // if (feedback) showStatusUntil = millis() + 3000;
  return newStandingOrder;
}

function keyPressed() {
  info("---- key press ----");
  switch (keyCode) {
  // case 32: // space
  //   standingOrder = handleInterruption("continue", true);
  //   toggleAudio(paused);
  //   break;
  case 37: // left arrow
    if (keyLock) return false;
    standingOrder = "previous";
    // info("standingOrder: " + standingOrder);
    break;
  case 39: // right arrow
    if (keyLock) return false;
    standingOrder = "next";
    // info("standingOrder: " + standingOrder);
    break;
  case 84: // t
    info("t pressed");
    if (keyLock) return false;
    standingOrder = "continue";
    resetPhase(0);
    break;
  case 81: // q
    if (keyLock) return false;
    standingOrder = "quit";
    break;
  }
}

function setFont(fn, fs, ldFactor = 1.3) {
  RiText.defaultFont(fn,fs);
  RiText.defaultFontSize(fs);
  // these two are global:
  fontWidth = fn._textWidth(" ",fs);
  leading = Math.ceil(fs * ldFactor);
  return fs;
  // RiText.defaultFont(storyFont,TITLES_FONT_SIZE);
  // RiText.defaultFontSize(TITLES_FONT_SIZE);
  // fontWidth = storyFont._textWidth(" ",FONT_SIZE);
  // leading = FONT_SIZE / 2;
}

function setLeading(fs) {
  return fs + Math.ceil(fs / 3);
}

function bumpPhase(direction) {
  info("bump " + direction)
  phase.subphase[phase.value].value += direction;
  if (phase.subphase[phase.value].value > phase.subphase[phase.value].max) {
    phase.subphase[phase.value].value = 0;
    phase.value += direction;
  } else if (phase.subphase[phase.value].value < 0) {
    phase.subphase[phase.value].value = phase.subphase[phase.value].max;
    phase.value += direction;
  }
  if (phase.value > phase.max) {
    phase.value = 0;
  } else if (phase.value < 0) {
    phase.value = phase.max;
  }
}

function resetPhase(p) {
  phase.value = p;
  for (i = 0; i < phase.subphase.length; i++) {
    phase.subphase[i].value = 0;
  }
}

function textTo(rt, newWord, seconds, fullOn) {
  fullOn = fullOn || true;
  if (rt.text() === newWord) return;
  // let temp = rt.copy();
  if (!rt.fadeFrom) rt.fadeFrom = rt.copy();
  rt.fadeFrom.text(rt.text());
  var originalAlpha = rt.alpha();
  // ensures that fade-in goes to 255
  if (fullOn) originalAlpha = 255;
  rt.fadeFrom.alpha(originalAlpha);
  // make original invisible leaving copy
  rt.alpha(0);
  // put new text into the invisible original
  rt.text(newWord);
  // fade out the copy
  rt.fadeFrom.colorTo([rt._color.r, rt._color.g, rt._color.b, 0], seconds);
  // fade in the orginal with new text
  rt.colorTo([rt._color.r, rt._color.g, rt._color.b, originalAlpha], seconds * .3);
}

// function textTo(rt,newWord,seconds) {
//   temp = rt.copy();
//   var originalAlpha = rt.alpha();
//   // make original invisible leaving copy
//   rt.alpha(0);
//   // put new text into the invisible original
//   rt.text(newWord);
//   // fade out the copy
//   temp.colorTo([rt._color.r, rt._color.g, rt._color.b, 0],
//     seconds);
//   // fade in the orginal with new text
//   rt.colorTo([rt._color.r, rt._color.g, rt._color.b, originalAlpha],
//     seconds * .3);
// }

// ----- INITIALIZATION, DATA BUILDING -----
function buildTokens(story, sublit, normalized) {
  var text = sublit ? story.text_sublit : story.text;
  var tokens = [], tokens_i = 0;
  for (var i = 0; i < text.length; i++) {
    var s = text[i].split(" ");
    for (var j = 0; j < s.length; j++) {
      tokens[tokens_i++] = s[j];
    }
  }
  for (j = 0; j < tokens.length; j++) {
    tokens[j] = tokens[j].replace(/_/g," ");
  }
  if (normalized) {
    // if (DBUG) dbug(stories[i].tokens);
    for (j = 0; j < tokens.length; j++) {
      tokens[j] = RiTa.trimPunctuation(tokens[j]).toLowerCase();
    }
  }// if (DBUG) dbug(stories[0].tokens_normalized);
  return tokens;
}

async function layoutStory(text) {
  // TODO: no y-checking yet
  if (!tokens) {
    throw Error("Needs global tokens. Tokens are not yet built.");
    return null;
  }
  var rts = [];
  var tokens_i = 0;
  for (var i = 0; i < text.length; i++) {
    var wds = text[i].split(" ");
    for (var j = 0; j < wds.length; j++) {
      let wdWidth = storyFont._textWidth(wds[j],fontSize);
      // if (DBUG) dbug(wds[j] + "xPos: " + xPos + " width: " + wdWidth);
      // ignore R_MARGIN :
      // if ((xPos + wdWidth) > R_MARGIN) {
      //   xPos = STORY_X;
      //   yPos += (fontSize + leading);
      // }
      rts[tokens_i] = new RiText(tokens[tokens_i++], xPos, yPos);
      xPos += (wdWidth + fontWidth);
    }
    xPos = STORY_X;
    yPos += leading;
  }
  for (i = 0; i < rts.length; i++) {
    rts[i].fill(BACKGROUND);
  }
  await sleep(1);
  return rts;
}

async function fadeIn(rts) {
  for (var i = 0; i < rts.length; i++) {
    rts[i].colorTo(FILL, 3);
  }
  await sleep(3.5);
  return "faded in";
}

async function cleanUp() {
  for (var i = 0; i < rts.length; i++) {
    rts[i].colorTo(BACKGROUND, 3);
  }
  await sleep(4);
  RiText.dispose(rts);
  xPos = STORY_X;
  yPos = STORY_Y;
  return new Promise(resolve => resolve(INFO ? info("cleanUp DONE") : "cleanUp DONE"));
}

// UNUSED speccial multiFont titles (because fontSize not working)
// if (key.valueOf() == "ars") {
//   var t = 0;
//   rtTitle[t] = new RiText(story.title[t], L_MARGIN, titleY, arsItalic);
//   // rtTitle[t].fontSize(italicSize);
//   titleX = L_MARGIN + arsItalic._textWidth(story.title[t],italicSize);
//   rtTitle[t].fontSize(48);
//   rtTitle[t].fill(BACKGROUND);
//   rtTitle[t].colorTo(FILL, 3);
//   // if (DBUG) console.log("titleX: " + titleX);
//   for (var t = 1; t < story.title.length - 1; t++) {
//     rtTitle[t] = new RiText(story.title[t], (t == 1 ? titleX : L_MARGIN), titleY, arsFont);
//     rtTitle[t].fill(BACKGROUND);
//     rtTitle[t].colorTo(FILL, 3);
//     if (t == (story.title.length - 2)) {
//       titleX = L_MARGIN + titleFont._textWidth(story.title[t],italicSize) + fontWidth;
//     } else {
//       titleY += (leading + fontSize);
//     }
//   }
//   rtTitle[t] = new RiText(story.title[t], titleX, titleY, arsItalic);
//   rtTitle[t].fill(BACKGROUND);
//   rtTitle[t].colorTo(FILL, 3);
//   RiText.defaults.fontSize = FONT_SIZE;
// } else {
// from here: the normal treatment for titles:
