var Passage = function Passage(buoyancy) {
  this.buoyancy = buoyancy || 1;
};

Passage.prototype.drift = async function (buoyancy, seconds) { // , language
  // language = language || DEFAULT_LANGUAGE;
  var finish = millis() + seconds * 1000;
  do {
    var rndIndexes = rndIndex(this.model);
    // info(rndIndexes);
    for (var l = 0; l < this.model.length; l++) {
      let rl = rndIndexes[l];
      let modelLetters = this.model[rl].split("");
      let displayLetters = this.display[rl].text().split("");
      var previousLetters = [];
      NEXT_letter: for (var i = 0; i < modelLetters.length; i++) {
        previousLetters.push(displayLetters[i]);
        let diff, theCase;
        switch (buoyancy) {
        case FLOATING:
          // do nothing if SPC's are matching
          if (modelLetters[i] === SPC && displayLetters[i] === SPC) continue NEXT_letter;
          // if heads address a space on the display text that could be a letter
          if (modelLetters[i] !== SPC && (displayLetters[i] === SPC && heads())) {
            // on heads, makes it a model letter
            if (heads()) displayLetters[i] = modelLetters[i];
            else {
              // floating, so on tails make it the alternate
              displayLetters[i] = (modelLetters[i] in literalAlts ? literalAlts[modelLetters[i]] : displayLetters[i]);
            }
            break;
          }
          // check to see if display letter is in the alternates table handles SPC in display
          if (!(displayLetters[i] in literalAlts)) break;
          // on heads, if the model letter is a space maake this so in display
          if ((modelLetters[i] === SPC) && heads()) {
            displayLetters[i] = SPC;
            break;
          }
          // in all other cases on heads, on heads get alternate for what is there
          if (heads()) {
            // if (displayLetters[i] === "i") info("alt for i:" + literalAlts[language][modelLetters[i]]);
            displayLetters[i] = literalAlts[displayLetters[i]];
          } else {
            // on tails get the model letter
            displayLetters[i] = modelLetters[i];
          }
          break;
        case SINKING:
          diff = diffFactor(modelLetters, displayLetters, buoyancy);
          if (displayLetters[i] === SPC) continue NEXT_letter;
          if (!(modelLetters[i] in literalAlts)) {
            if (getRndInteger(0, diff < .3 ? 0 : 1) == 0) displayLetters[i] = SPC;
            continue NEXT_letter;
          }
          // emulating, but improving translation
          theCase = getRndInteger(1,Math.floor(18 * diff + 2));
          switch (theCase) {
          case 1:
          case 2:
            displayLetters[i] = SPC;
            break;
          case 3:
            displayLetters[i] = (modelLetters[i] in literalAlts) ? literalAlts[modelLetters[i]] : SPC;
            break;
          case 4:
            displayLetters[i] = modelLetters[i];
          }
          break;
        case SURFACING:
          if (displayLetters[i] === modelLetters[i]) continue NEXT_letter;
          if (displayLetters[i] === SPC) {
            // info(Math.floor(7 * diffFactor(modelLetters, displayLetters)));
            if  (getRndInteger(0,Math.floor(7 * diffFactor(modelLetters, displayLetters, buoyancy))) == 0) {
              // info("handling SPC with odds: " + Math.floor(7 * diffFactor(modelLetters, displayLetters)));
              if (heads() || (diffFactor(modelLetters, displayLetters, buoyancy) < .1)) displayLetters[i] = modelLetters[i];
              else displayLetters[i] = (modelLetters[i] in literalAlts) ? literalAlts[modelLetters[i]] : modelLetters[i];
            }
          } else {
            if (heads() || (diffFactor(modelLetters, displayLetters, buoyancy) < .4)) displayLetters[i] = modelLetters[i];
          }
        }
      } // NEXT_letter
      if (standingOrder != "continue" && standingOrder != "pressing") {
        // make sure concurrent Promises resolve
        keyLock = true;
        await sleep(fxSeconds * 1.5);
        keyLock = false;
        return Promise.reject(new Error(standingOrder));
      }
      // if (phase != 0) {
      //   // info("line " + rl + ": " + displayLetters[0]);
      //   for (var wi = 0; wi < displayLetters.length; wi++) {
      //     if (displayLetters[wi] !== previousLetters[wi]) {
      //       let fromImage = waveImages[ABC.indexOf(previousLetters[wi])];
      //       let toImage = waveImages[ABC.indexOf(displayLetters[wi])];
      //       this.imgs[rl][wi].xFade(fxSeconds,toImage,fromImage);
      //     }
      //   }
      // }
      textTo(this.display[rl],displayLetters.join(""),fxSeconds, true);
      // info("awaiting begins for " + xfpromises.length);
      await sleep(fxSeconds * 1.2);
      // info("awaiting over");
    } // NEXT_line
    // figure out if we should keep going
    var done = (standingOrder != "continue" && standingOrder != "pressing") ? true : false;
    if (!done)
      done = (seconds > 0) && (millis() > finish);
    if (!done) {
      done = (buoyancy == SURFACING || buoyancy == SINKING);
      done = (done) ? passagesMatch(this.model,this.display,buoyancy) : false;
    }
  } // do
  while (!done);
};

function passagesMatch(modelPassage, displayPassage, buoyancy) {
  var result = true;
  switch (buoyancy) {
  case SURFACING:
    for (var i = 0; i < modelPassage.length; i++) {
      if (modelPassage[i] !== displayPassage[i].text())
        return false;
    }
    break;
  case SINKING:
    for (let rt of displayPassage) {
      let chars = rt.text().split("");
      for (let char of chars) {
        if (char !== SPC) return false;
      }
    }
  }
  return result;
}

function diffFactor(model, display, buoyancy) {
  buoyancy = buoyancy || SURFACING;
  var diff = 0, len = model.length;
  for (var i = 0; i < len; i++) {
    if (buoyancy == SURFACING)
      diff += (display[i] !== model[i] ? 1 : 0);
    else
      diff += (display[i] !== SPC ? 1 : 0);
  }
  return diff / len;
}
