/* globals RiText, Hammer, RiTa, stories, pairs */
// subliteral, by John Cayley
// configuration
var VERSION = "0.3.2";
// 0.3 configurable for multi-tablet exhibition
// 0.3.1 even better handling of keypress interruption
var FULL_PATH = "https://programmatology.shadoof.net/ritajs/subliteral/"
var IVORY_ON_BLACK = true, DBUG = false, INFO = true;
var BLACK = [0, 0, 0, 255];
var IVORY = [255, 255, 240, 255];
var FILL;
var BACKGROUND;
var FLOATING = 0, SURFACING = 1, SINKING = 2;
var BUOYANCY_STRINGS = ["floating","surfacing","sinking"];
var SHOW_INTERTITLES = true, SHOW_CAPTIONTTITLES = false;
var TIME_TO_READ_TITLES = 25;
var TITLES_FX_SECS = .05, SUFLOSI_FX_SECS = 1.25;
var fxSeconds = TITLES_FX_SECS;
// var NO_SPACES = false, NO_APOSTROPHE = false;
var SPC = " ", SPC_NUM = 0;
var ABC = " abcdefghijklmnopqrstuvwxyz";
var DEFAULT_LANGUAGE = "en";
var WIDTH = 1280, HEIGHT = 720;
// var STORY_TITLE_X = 140, STORY_TITLE_Y = 100;
// var RIGHT_MARGIN = 960;
// var STORY_X = 220, STORY_Y = 160;
var RIGHT_MARGIN = 1020;
var STORY_FONT_SIZE = 28; // , leading = STORY_FONT_SIZE + Math.ceil(STORY_FONT_SIZE / 3);
var TITLES_FONT_SIZE = 28;
var STORY_X = 280, STORY_Y = 160;
var STORY_TITLE_X = 180, STORY_TITLE_Y = 100;
var STORY_CAPTION_X = 280, STORY_CAPTION_Y = 1000;
var fontSize, fontWidth, leading; // font size, font (one char) width, leading;
// fontSize = setFont(TITLES_FONT_SIZE);
// leading = setLeading(fontSize);
if (SL_EXHIBITION) {
  WIDTH = 1920, HEIGHT = 1080;
  RIGHT_MARGIN = 1900;
  STORY_FONT_SIZE = 70;
  STORY_X = 200, STORY_Y = 240;
  if (SL_TABLET_NUMBER == 2 || SL_TABLET_NUMBER == 5) STORY_Y = 180;
  if (SL_TABLET_NUMBER == 3) {
    STORY_X = 80;
    STORY_Y = 180;
  }
  if (SL_TABLET_NUMBER == 4) {
    STORY_X = 40;
    STORY_Y = 180;
  }
  SHOW_INTERTITLES = false;
}
var xPos = STORY_X, yPos = STORY_Y;
// var fontSize = STORY_FONT_SIZE, fontWidth; // font size, font (one char) width, leading;
var story;
var tokens = [], tokens_sublit = [];
var rts = [];
var rtTitle = [], titleY = STORY_TITLE_Y;
var italicSize = 30;
var temp;
var titleText = "";

var monoFont,titleFont,serifFont,storyFont;
// NEW STUFF
var promises = [], captions = [];
var standingOrder = "continue", feedback = false;
var statusCaption;
var phase = 0;
// var phase = {value: 0, max: 1, subphase: [{value: 0, max: 0}, {value: 0, max: 1}]};
var showStatusUntil = 0;
var titles = [];
var titlePassage;
var literalAlts;
// gestures
var gestures, canvas;


// ----- P5 FUNCTIONS -----
function preload() {
  titleFont = loadFont((SL_EXHIBITION ? FULL_PATH : "") + "fonts/TrajanPro-Regular.otf");
  // mono possible: DejaVuSansMono, Consolas, AndaleMono, PrestigeEliteStd-Bd.otf
  monoFont = loadFont((SL_EXHIBITION ? FULL_PATH : "") + "fonts/AndaleMono.ttf");
  // serif possible: iowansrm, Constantia, DejaVuSerif, Cambria, Perpetua
  serifFont = loadFont((SL_EXHIBITION ? FULL_PATH : "") + "fonts/iowaosrm.ttf");
  storyFont = monoFont;
  literalAlts = loadStrings((SL_EXHIBITION ? FULL_PATH : "") + "literalalts.json");
//  arsFont = loadFont('../fonts/Perpetua.ttf');
//  arsItalic = loadFont('../fonts/PerpetuaItalic.ttf');
}

async function setup() {

  info("subliteral version " + VERSION);

  if (SL_EXHIBITION) {
    info("Exhibition: " + SL_EXHIBITION + " Tablet number: " + SL_TABLET_NUMBER);
    SHOW_INTERTITLES = false;
    noCursor();
  }
  if (!DBUG) noCursor();
  createCanvas(WIDTH, HEIGHT);

  literalAlts = JSON.parse(literalAlts.join(""));
  literalAlts = literalAlts[DEFAULT_LANGUAGE];

  FILL  = (IVORY_ON_BLACK ? IVORY : BLACK);
  BACKGROUND = (IVORY_ON_BLACK ? BLACK : IVORY);
  RiText.defaultFill(FILL);
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
    standingOrder = "next";
    // info("swipeleft: " + standingOrder);
  });

  gestures.on("swiperight", function() {
    standingOrder = "previous";
    // info("swiperight: " + standingOrder);
  });

  gestures.on("doubleswipe", function() {
    standingOrder = "quit";
    // info("swipedown: " + standingOrder);
  });

  gestures.on("press", function() {
    showStatusUntil = millis() + 1500;
    // info("press: " + standingOrder);
  });

  gestures.on("pressup", function() {
    standingOrder = "continue";
    // info("pressup: " + standingOrder);
  });

  // gestures.on("doublepress", function() {
  //   standingOrder = "continue";
  //   toggleAudio(paused);
  //   // info("swipeup: audio " + (withAudio ? "on" : "off"));
  // });

  // ---- Titles ----
  fontSize = setFont(storyFont, TITLES_FONT_SIZE);

  titles.push("hearing litoral voices / bearing literal traces");
  titles.push("vi  S U B L I T E R A L   N A R R A T I V E S");
  titles.push("Joanna Howard & John Cayley, 2019");
  titles.push("narrative & ambient poetics");
  titles.push(" –> or mobile swipe-left to move on");
  titles.push("<– or mobile swipe-right to go back");
  titles.push("Q or mobile two-finger swipe-left to quit abruptly");
  titles.push(VERSION + " with thanks to Daniel C. Howe’s RiTa");
  titles.push("programmatology.shadoof.net/?subliteral");

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
    case 1: lineY += leading * .5; break;
    case 2: lineY += leading * .5; break;
    case 3: lineY += leading * .5; break;
    case 6: lineY += leading * .5; break;
    }
    lineY += leading;
  }

  // ---- info Captions ----
  statusCaption = new RiText("titles");
  statusCaption.position(0,TITLES_FONT_SIZE);
  statusCaption.alpha(0);

  // testing doze function
  // let s = TIME_TO_READ_TITLES;
  // info("dozing for " + s + " at " + millis() / 1000);
  // try { await doze(s) } catch(err) { info("woken by " + err.message);} ;
  // info("now " + millis() / 1000);

  // MAIN:
  narrate();

}

function draw() {
  background(BACKGROUND);

  if (SHOW_CAPTIONTTITLES) {
    fill(IVORY);
    textFont(titleFont);
    textSize(28);
    textAlign(CENTER);
    text(titleText, WIDTH/2,STORY_CAPTION_Y);
    textAlign(LEFT);
  }

  if (keyIsDown(16) || (millis() < showStatusUntil)) {
    statusCaption.alpha(95);
  } else {
    statusCaption.alpha(0);
  }

  RiText.drawAll();
}

// ----- MANIFESTATION -----
async function narrate() {
  var narrativePhases = [];
  if (!SL_EXHIBITION) narrativePhases.push(narrativeTitles); // narrativeTitles
  narrativePhases.push(narrativeStories);
  //
  do {
    info("trying phase: " + phase);
    try {
      await narrativePhases[phase]();
      info("promise resolved main do with standingOrder: " + standingOrder);
      if (++phase >= narrativePhases.length) phase = 0;
    } catch (err) {
      //
      standingOrder = handleInterruption(err)
      info("caught " + standingOrder + " in main do loop");
      if (standingOrder == "previous") {
        phase = 0;
        standingOrder = "continue";
      } else if (standingOrder == "next") {
        if (++phase >= narrativePhases.length) phase = 0;
        standingOrder = "continue";
      }
    }
  }
  while (standingOrder == "continue");
  //
}

async function narrativeTitles() {
  // RiText.dispose(rts);
  await cleanUp();
  setStatusCaption("[titles]");
  // make titles are visible and full of spaces
  for (let rt of titlePassage.display) {
    rt.text(rt.text().replace(/./g," "));
    rt.fill(FILL);
    rt.alpha(255);
  }

  try {
    await titlePassage.drift(SURFACING,0);
  } catch (err) {
    standingOrder = handleInterruption(err);
    if (standingOrder != "next") {
      // info("caught " + standingOrder + " in narrativeTitles");
      return Promise.reject(err);
    } else standingOrder = "continue";
  }

  // ensure the complete titles are shown if surfacing is interrupted:
  let i = 0;
  for (let rt of titlePassage.display) {
    rt.text(titlePassage.model[i++]);
  }
  try { await doze(TIME_TO_READ_TITLES); } catch(err) {
    if (err.message != "next") {
      return Promise.reject(err);
    } else standingOrder = "continue";
  }

  try {
    await titlePassage.drift(SINKING,0);
  } catch (err) {
    standingOrder = handleInterruption(err);
    if (standingOrder != "next") {
      return Promise.reject(err);
    } else standingOrder = "continue";
  }
}

async function narrativeStories() {
  setStatusCaption("");
  for (let rt of titlePassage.display) {
    rt.text(rt.text().replace(/./g," "));
  }
  try {
    // SEQUENTIAL_FADES well tested, SHUFFLED_FADES new as of July 2019
    await spellTheStories(stories, "SEQUENTIAL_FADES", fadeSeconds = 3, iterations = 30);
  } catch (err) {
    return Promise.reject(err);
  }
  // one round complete, keep spelling them
  phase = 1;
}

async function spellTheStories(stories, mode, fadeSeconds = 3, iterations = 1) {
  console.log(stories);
  if (SL_EXHIBITION) {
    let i = 0;
    for (var key in stories) {
      if (i++ == SL_TABLET_NUMBER) break;
    }
    stories = { "tabletStory": stories[key] };
  }
  if (DBUG) console.log(stories);
  let storyNum = 0;
  for (var key in stories) {
    setStatusCaption("[narrative " + (++storyNum) + " of " + Object.keys(stories).length + "]");
    story = stories[key];
    if (INFO) info("story is: " + key);
    // display the title; special treatment for "ars":
    if (SHOW_INTERTITLES) {
      // if (DBUG) dbug("key: " + key + " " + (key == "ars"));
      titleY = STORY_TITLE_Y;
      leading = setLeading(TITLES_FONT_SIZE);
      for (let i = 0; i < story.title.length; i++) {
        rtTitle[i] = new RiText(story.title[i], STORY_TITLE_X, titleY, titleFont);
        rtTitle[i].fill(BACKGROUND);
        rtTitle[i].colorTo(FILL, 3);
        titleY += leading;
      }
      if (DBUG) dbug("tseconds: " + story.tseconds);

      try { await doze(story.tseconds) } catch(err) {
        if (err.message != "next") {
          for (let rt of rtTitle) {
            RiText.dispose(rt);
          }
          return Promise.reject(err);
        } else standingOrder = "continue";
      }

      // for (let i = 0; i < story.tseconds; i++) {
      //   await sleep(1);
      //   if (standingOrder == "next") {
      //     standingOrder = "continue";
      //     break;
      //   } else if (standingOrder != "continue" && standingOrder != "pressing") {
      //     for (let rt of rtTitle) {
      //       RiText.dispose(rt);
      //     }
      //     return Promise.reject(new Error(standingOrder));
      //   }
      // }
      for (let i = 0; i < story.title.length; i++) {
        rtTitle[i].colorTo(BACKGROUND,2);
      }
      await sleep(2.5);
      for (let i = 0; i < story.title.length; i++) {
        RiText.dispose(rtTitle[i]);
      }
    } else if (SL_EXHIBITION) {
      titleText = story.exhibTitle[0];
      SHOW_CAPTIONTTITLES = true;
      info(titleText + " " + SHOW_CAPTIONTTITLES);
    }
    // end of story title display

    // now, the story itself
    // RiText.defaultFont(monoFont, STORY_FONT_SIZE);
    // RiText.defaultFontSize(STORY_FONT_SIZE);
    tokens = buildTokens(story, false);
    tokens_sublit = buildTokens(story, true);
    rts = await(layoutStory(story.text));
    await fadeIn(rts);
    try {
      await spellStory(mode, story.seconds, fadeSeconds, iterations);
    } catch (err) {
      if (err.message == "next") {
        standingOrder = "continue";
        await cleanUp();
        // await sleep(3);
        continue; // to top of for loop
      } else return Promise.reject(err);
      // standingOrder = handleInterruption(err.message);
      // if (standingOrder != "continue")
      //   return Promise.reject(new Error(standingOrder));
    }
    await cleanUp();
    if (DBUG) dbug("waited to cleanUp ...");
    // await sleep(3);
  } // for stories loop
  return new Promise(resolve => resolve(INFO ? info("a round of stories completed ..") : "one round of stories"));
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

async function sequentialFades(storySeconds, fadeSeconds, iterations) {
  var sublit = true;
  var initialWait = true;
  while (standingOrder == "continue") {
    let readingTimeBeforeSequence = storySeconds / 3;
    if (initialWait) {
      dbug("about to wait (beginning of while): " + readingTimeBeforeSequence);
      try { await doze(readingTimeBeforeSequence) } catch(err) {
        if (err.message != "next") {
          return Promise.reject(err);
        }
        standingOrder = "next";
        break; // out of while loop
      }
      standingOrder = "continue";
      initialWait = false;
    }
    // if (keyIsDown(RIGHT_ARROW) !== true) await sleep(storySeconds / 3);
    for (var j = 0; j < tokens.length; j++) {
      var testAgainst = (sublit ? tokens_sublit[j].valueOf() : tokens[j].valueOf());
      // if (DBUG)
      //   dbug(rts[j].text().valueOf() + " " + testAgainst + " " + (rts[j].text().valueOf() != testAgainst));
      // wd = RiTa.trimPunctuation(rts[j].text());
      if (rts[j].text().valueOf() != testAgainst) {
        textTo(rts[j], (sublit ? tokens_sublit[j] : tokens[j]) , fadeSeconds);
        // info("about to wait: " + (storySeconds / tokens.length) * 1.5);
        try { await doze((storySeconds / tokens.length) * 1.2) } catch(err) {
          if (err.message != "next") {
            return Promise.reject(err);
          }
          standingOrder = "next";
          break; // out of tokens for loop
        }
        standingOrder = "continue";
        // if (keyIsDown(RIGHT_ARROW) !== true) await sleep(storySeconds / tokens.length * 1.5);
      }
      // if (standingOrder != "continue" && standingOrder != "pressing") {
        // make sure concurrent Promises resolve
      //   await sleep(fxSeconds * 1.5);
      //   return Promise.reject(new Error(standingOrder));
      // }
      // if (keyIsDown(RIGHT_ARROW))
      //   break;
    } // end of tokens for loop
    if (standingOrder == "next") break; // out of while

    try { await doze(storySeconds / 5) } catch(err) {
      if (err.message != "next") {
        return Promise.reject(err);
      }
    }
    standingOrder = "continue";
    sublit = !sublit;
  } // while continue loop
  await cleanUp();
  standingOrder = "continue";
  if (INFO) info("sequentialFades complete for one story");
}

async function shuffledFades(storySeconds, fadeSeconds, iterations) {
  var sublit = true;
  while (standingOrder == "continue") {
    if (keyIsDown(RIGHT_ARROW) !== true) await sleep(fxSeconds * 1.5); //storySeconds / 3);
    var rndTokenIndex = rndIndex(tokens);
    for (var t = 0; t < tokens.length; t++) {
      var j = rndTokenIndex[t];
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
        await sleep(fadeSeconds * 1.5);
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
    sublit = !sublit;
    if (INFO) info("iteration completed");
  }
  if (INFO) info("shuffledFades complete");
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

function handleInterruption(interruptError, fb = true) {
  // info(interruption + " at beginning of handleInterruption");
  let interruption = interruptError.message;
  switch (interruption) {
  case "quit":
    info("quitting");
    noLoop();
    setStatusCaption("[quit]");
    if (fb) showStatusUntil = millis() + 3000;
    draw();
    break;
  case "next":
  case "previous":
  case "continue":
    break;
  default:
    info("unknown error " + interruption + " in handleInterruption");
    console.log(interruptError.stack);
    noLoop();
    throw new Error(interruption);
  }
  return interruption;
}

function keyPressed() {
  info("---- key press ----");
  // feedback = true;
  switch (keyCode) {
  // case 32: // space
  //   standingOrder = handleInterruption("continue", true);
  //   toggleAudio(paused);
  //   break;
  case 37: // left arrow
    standingOrder = "previous";
    // info("standingOrder: " + standingOrder);
    break;
  case 39: // right arrow
    standingOrder = "next";
    // info("standingOrder: " + standingOrder);
    break;
  // case 84: // t
  //   info("t pressed");
  //   standingOrder = "continue";
  //   phase = 0;
  //   break;
  case 81: // q
    standingOrder = "quit";
  }
}

function setStatusCaption(captionText) {
  statusCaption.text(captionText);
}

function setFont(fn, fs, ldFactor = 1.3) {
  RiText.defaultFont(fn,fs);
  RiText.defaultFontSize(fs);
  // these two are global:
  fontWidth = fn._textWidth(" ",fs);
  leading = setLeading(fs, ldFactor);
  return fs;
  // RiText.defaultFont(storyFont,TITLES_FONT_SIZE);
  // RiText.defaultFontSize(TITLES_FONT_SIZE);
  // fontWidth = storyFont._textWidth(" ",STORY_FONT_SIZE);
  // leading = STORY_FONT_SIZE / 2;
}

function setLeading(fs, ldFactor = 1.3) {
  return Math.ceil(fs * ldFactor);
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
  fontSize = setFont(storyFont,STORY_FONT_SIZE, 1.8);
  var rts = [];
  var tokens_i = 0;
  for (var i = 0; i < text.length; i++) {
    var wds = text[i].split(" ");
    for (var j = 0; j < wds.length; j++) {
      let wdWidth = storyFont._textWidth(wds[j],fontSize);
      if (DBUG) dbug(wds[j] + "xPos: " + xPos + " width: " + wdWidth + " RIGHT_MARGIN: " +  RIGHT_MARGIN);
      if ((xPos + wdWidth) > RIGHT_MARGIN) {
        xPos = STORY_X;
        yPos += leading;
      }
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
    rts[i].colorTo(BACKGROUND, 2);
  }
  for (let rt of titlePassage.display) {
    rt.colorTo(BACKGROUND, 2);
  }
  await sleep(2.5);
  RiText.dispose(rts);
  xPos = STORY_X;
  yPos = STORY_Y;
  return new Promise(resolve => resolve(INFO ? info("cleanUp done") : "cleanUp done"));
}

// UNUSED speccial multiFont titles (because fontSize not working)
// if (key.valueOf() == "ars") {
//   var t = 0;
//   rtTitle[t] = new RiText(story.title[t], STORY_TITLE_X, titleY, arsItalic);
//   // rtTitle[t].fontSize(italicSize);
//   titleX = STORY_TITLE_X + arsItalic._textWidth(story.title[t],italicSize);
//   rtTitle[t].fontSize(48);
//   rtTitle[t].fill(BACKGROUND);
//   rtTitle[t].colorTo(FILL, 3);
//   // if (DBUG) console.log("titleX: " + titleX);
//   for (var t = 1; t < story.title.length - 1; t++) {
//     rtTitle[t] = new RiText(story.title[t], (t == 1 ? titleX : STORY_TITLE_X), titleY, arsFont);
//     rtTitle[t].fill(BACKGROUND);
//     rtTitle[t].colorTo(FILL, 3);
//     if (t == (story.title.length - 2)) {
//       titleX = STORY_TITLE_X + titleFont._textWidth(story.title[t],italicSize) + fontWidth;
//     } else {
//       titleY += (leading + fontSize);
//     }
//   }
//   rtTitle[t] = new RiText(story.title[t], titleX, titleY, arsItalic);
//   rtTitle[t].fill(BACKGROUND);
//   rtTitle[t].colorTo(FILL, 3);
//   RiText.defaults.fontSize = STORY_FONT_SIZE;
// } else {
// from here: the normal treatment for titles:
