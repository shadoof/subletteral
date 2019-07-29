/* global RiText, RiTa, stories, pairs */
var IVORY_ON_BLACK = true, DBUG = false, INFO = true;
var BLACK = [0, 0, 0, 255];
var IVORY = [255, 255, 240, 255];
var FILL;
var BACKGROUND;
var WIDTH = 1024, HEIGHT = 576;
var L_MARGIN = 140, T_MARGIN = 100;
var R_MARGIN = 960;
var STORY_X = 220, STORY_Y = 160;
var FONT_SIZE = 28;
//
var xPos = STORY_X, yPos = STORY_Y;
var fy = FONT_SIZE, fx, ld; // font size, font (one char) width, leading;
var story;
var tks = [], tks_sublit = [];
var rts = [];
var rtTitle = [], titleY = T_MARGIN;
var italicSize = 30;
var temp;

var monoFont,titleFont,serifFont,storyFont;

// ----- P5 FUNCTIONS -----
function preload() {
  titleFont = loadFont("../fonts/TrajanPro-Regular.otf");
  // mono possible: DejaVuSansMono, Consolas, AndaleMono, PrestigeEliteStd-Bd.otf
  monoFont = loadFont("../fonts/AndaleMono.ttf");
  // serif possible: iowansrm, Constantia, DejaVuSerif, Cambria, Perpetua
  serifFont = loadFont("../fonts/iowaosrm.ttf");
  storyFont = monoFont;
//  arsFont = loadFont('../fonts/Perpetua.ttf');
//  arsItalic = loadFont('../fonts/PerpetuaItalic.ttf');
}

async function setup() {

  createCanvas(WIDTH, HEIGHT);

  RiText.defaultFont(storyFont,FONT_SIZE);
  RiText.defaultFontSize(FONT_SIZE);
  fx = storyFont._textWidth(" ",FONT_SIZE);
  ld = FONT_SIZE / 2;
  FILL  = (IVORY_ON_BLACK ? IVORY : BLACK);
  BACKGROUND = (IVORY_ON_BLACK ? BLACK : IVORY);
  //
  RiText.defaultFill(IVORY);
  // if (DBUG) dbug("fx: " + fx + " fill: ");
  // if (DBUG) dbug(RiText.defaultFill());

  // EDIT THIS LINE FOR ONE STORY
  // OR COMMENT OUT FOR ALL:
  // stories = { "ars": stories["ars"] };

  // 30 iterations means one story will display for a maximum of 10 mins
  for (var i = 0; i < 12; i++) {
    await spellTheStories(stories, "SEQUENTIAL_FADES", fadeSeconds = 3, iterations = 30);
  }

}

function draw() {
  background(BACKGROUND);
  RiText.drawAll();
}

// ----- MANIFESTATION -----
async function spellTheStories(stories, mode, fadeSeconds = 3, iterations = 1) {
  for (var key in stories) {
    story = stories[key];
    // display the title; special treatment for "ars":
    if (INFO) info("story is: " + key);
    // if (DBUG) dbug("key: " + key + " " + (key == "ars"));
    titleY = T_MARGIN;
    for (var i = 0; i < story.title.length; i++) {
      rtTitle[i] = new RiText(story.title[i], L_MARGIN, titleY, titleFont);
      rtTitle[i].fill(BACKGROUND);
      rtTitle[i].colorTo(FILL, 3);
      titleY += (ld + fy);
    }
    if (DBUG) dbug("tseconds: " + story.tseconds);
    await sleep(story.tseconds);
    for (i = 0; i < story.title.length; i++) {
      rtTitle[i].colorTo(BACKGROUND,3);
    }
    await sleep(3.1);
    for (i = 0; i < story.title.length; i++) {
      RiText.dispose(rtTitle[i]);
    }
    // now, the story itself
    // RiText.defaultFont(monoFont, FONT_SIZE);
    // RiText.defaultFontSize(FONT_SIZE);
    tks = buildTokens(story, false);
    tks_sublit = buildTokens(story, true);
    rts = await(layoutStory(story.text));
    await fadeIn(rts);
    await spellStory(mode, story.seconds, fadeSeconds, iterations);
    if (DBUG) dbug("waited to cleanUp ...");
    await cleanUp();
    await sleep(3);
  }
  return new Promise(resolve => resolve(INFO ? info("a round of stories completed ..") : "one round of stories"));
}

function spellStory(mode, storySeconds, fadeSeconds, iterations) {
  if (DBUG) dbug("mode: " + mode);
  let f;
  switch (mode) {
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

async function sequentialFades(storySeconds, fadeSeconds, iterations) {
  var sublit = true;
  for (var i = 0; i < iterations; i++) { // while (keyIsPressed !== true) {
    if (keyIsDown(RIGHT_ARROW) !== true) await sleep(storySeconds / 3);
    for (var j = 0; j < tks.length; j++) {
      var testAgainst = (sublit ? tks_sublit[j].valueOf() : tks[j].valueOf());
      // if (DBUG)
      //   dbug(rts[j].text().valueOf() + " " + testAgainst + " " + (rts[j].text().valueOf() != testAgainst));
      // wd = RiTa.trimPunctuation(rts[j].text());
      if (rts[j].text().valueOf() != testAgainst) {
        textTo(rts[j], (sublit ? tks_sublit[j] : tks[j]) , fadeSeconds);
        if (keyIsDown(RIGHT_ARROW) !== true) await sleep(storySeconds / tks.length * 1.5);
      }
      if (keyIsDown(RIGHT_ARROW))
        break;
    }
    if (keyIsDown(RIGHT_ARROW))
      break;
    await sleep(storySeconds / 5);
    sublit = !sublit;
  }
  if (INFO) info("sequentialFades complete or interrupted");
}

async function pairsOnlySequentialFades(seconds, iterations) {
  for (var i = 0; i < iterations; i++) {
    await sleep(seconds);
    for (var j = 0; j < tks.length; j++) {
      let wd = RiTa.trimPunctuation(rts[j].text());
      if (pairs[wd]) {
        textTo(rts[j],tks_sublit[j],3);
      }
    }
  }
}

async function toggleCutToggle(seconds, iterations) {
  for (var j = 0; j < iterations || 1000; j++) {
    for (var i = 0; i < tks.length; i++) {
      rts[i].text(tks_sublit[i]);
    }
    await sleep(seconds);
    for (i = 0; i < tks.length; i++) {
      rts[i].text(tks[i]);
    }
    await sleep(seconds);
  }
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

// ----- INITIALIZATION, DATA BUILDING -----
function buildTokens(story, sublit, normalized) {
  var text = sublit ? story.text_sublit : story.text;
  var tks = [], tks_i = 0;
  for (var i = 0; i < text.length; i++) {
    var s = text[i].split(" ");
    for (var j = 0; j < s.length; j++) {
      tks[tks_i++] = s[j];
    }
  }
  for (j = 0; j < tks.length; j++) {
    tks[j] = tks[j].replace(/_/g," ");
  }
  if (normalized) {
    // if (DBUG) dbug(stories[i].tokens);
    for (j = 0; j < tks.length; j++) {
      tks[j] = RiTa.trimPunctuation(tks[j]).toLowerCase();
    }
  }// if (DBUG) dbug(stories[0].tokens_normalized);
  return tks;
}

async function layoutStory(text) {
  // TODO: no y-checking yet
  if (!tks) {
    throw Error("Needs global tks. Tokens are not yet built.");
    return null;
  }
  var rts = [];
  var tks_i = 0;
  for (var i = 0; i < text.length; i++) {
    var wds = text[i].split(" ");
    for (var j = 0; j < wds.length; j++) {
      let wdWidth = storyFont._textWidth(wds[j],fy);
      if (DBUG) dbug(wds[j] + "xPos: " + xPos + " width: " + wdWidth + " R_MARGIN: " +  R_MARGIN);
      if ((xPos + wdWidth) > R_MARGIN) {
        xPos = STORY_X;
        yPos += (fy + ld);
      }
      rts[tks_i] = new RiText(tks[tks_i++], xPos, yPos);
      xPos += (wdWidth + fx);
    }
    xPos = STORY_X;
    yPos += (fy + ld);
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
  return new Promise(resolve => resolve(INFO ? info("cleanUp done") : "cleanUp done"));
}

// ----- GENERAL FUNCTIONS -----
// function randomBetween(lower,higher) {
//   return Math.floor(Math.random() * (higher+1) + lower);
// }

function info(msg) {
  console.log("[INFO] " + msg);
}

function dbug(msg) {
  console.log("[DBUG] " + msg);
}

function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

// UNUSED attempting an interruptable sleep
// async function sleep(seconds) {
//   for (var i = 0; i < seconds; i++) {
//     if (keyIsDown(RIGHT_ARROW)) {
//       return new Promise(resolve => resolve((INFO ? console.log("[INFO] sleep interrupted") : "sleep interrupted")));
//     } else {
//       await _sleep(1000);
//     }
//   }
//   return new Promise(resolve => resolve((DBUG ? console.log("[DBUG] " + seconds + " secs sleep") : "woke up")));
// }

// function _sleep(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

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
//       titleX = L_MARGIN + titleFont._textWidth(story.title[t],italicSize) + fx;
//     } else {
//       titleY += (ld + fy);
//     }
//   }
//   rtTitle[t] = new RiText(story.title[t], titleX, titleY, arsItalic);
//   rtTitle[t].fill(BACKGROUND);
//   rtTitle[t].colorTo(FILL, 3);
//   RiText.defaults.fontSize = FONT_SIZE;
// } else {
// from here: the normal treatment for titles:
