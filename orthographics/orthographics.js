var PARTIAL_PHRASE_CHANGE = true, WHITE_ON_BLACK = true, WITH_INFO = true;
var OLEFT = 0, ORIGHT = 1;
var BLACK = [0, 0, 0, 255];
var WHITE = [255, 255, 255, 255];
var MIN_SUBLITERAL_DELAY = 4000, MAX_SUBLITERAL_DELAY = 8000;
var MIN_PHRASE_DELAY = 30000, MAX_PHRASE_DELAY = 60000; // NB: not currently used
var MIN_FORM_DELAY = 120000, MAX_FORM_DELAY = 180000;
var WIDTH = 1024, HEIGHT = 576;
var TEXT_Y = 300;
var LENGTH_OF_ONE_AT_LEAST = 6;

var displayedLeft, displayedRight, invisible;
var forms = [ ['a', 'n'], ['n', 'n'], ['v', 'v'], ['v', 'n'], ['n', 'v'], ['r', 'a'] ];
var op;
var subliteralDatum, phraseDatum, formDatum;
var leftAlt = 0, rightAlt = 0, wordToChange, formNum = 0;
var leftDone = [false, false], rightDone = [false, false];
var pairsStArray;
var tags;
var leftPairs, rightPairs, leftTags, rightTags, adjPairs, nounPairs, vbPairs, rbPairs;
var leftLimit, rightLimit,leftIndex,rightIndex;
var leftPair, rightPair;
var newPhrase = false, lDone = false, rDone = false;
var monoFont;
var subliteralInterval,formInterval;

function initialize() {
  monoFont = RiText.createFont("AndaleMono.ttf", 48);
  RiText.defaultFont(monoFont);
  RiText.defaultColor(WHITE_ON_BLACK ? 255 : 0);

  pairsStArray = pairsInFILE; // instead of loading a file

  tags = tagPairsSt(pairsStArray);
  // tags is now a matching [length][2 strings] array

  adjPairs = getPairsWithPoS(pairsStArray, tags, "a");
  // the <pos>Pairs is just a list of csv strings "<pos>,<pos>,<0-2>"
  nounPairs = getPairsWithPoS(pairsStArray, tags, "n");
  vbPairs = getPairsWithPoS(pairsStArray, tags, "v");
  rbPairs = getPairsWithPoS(pairsStArray, tags, "r");

  setForm(formNum);

  op = setNewPairs(LENGTH_OF_ONE_AT_LEAST);
  displayedLeft = new RiText(op.getLeft());
  displayedLeft.align(RiTa.CENTER);
  displayedLeft.position(WIDTH * .25, TEXT_Y);
  displayedRight = new RiText(op.getRight());
  displayedRight.align(RiTa.CENTER);
  displayedRight.position(WIDTH * .75, TEXT_Y);
  subliteralInterval = setInterval(subliteralChange,randomBetween(MIN_SUBLITERAL_DELAY, MAX_SUBLITERAL_DELAY));
  formInterval = setInterval(formChange,randomBetween(MIN_FORM_DELAY, MAX_FORM_DELAY));
  if (WITH_INFO) {
  	console.log(subliteralInterval);
    console.log("[INFO] Beginning ...");
  }
}

function randomBetween(lower,higher) {
	return Math.floor(Math.random() * (higher+1) + lower);
}

function setForm(formNum) {
  if (formNum >= forms.length) {
    formNum = 0;
  }
  for (var i = 0; i < 2; i++) {
    var c = forms[formNum][i];
    var l = new Array();
    switch (c) {
    case 'a':
      {
        l = adjPairs;
        break;
      }
    case 'n':
      {
        l = nounPairs;
        break;
      }
    case 'v':
      {
        l = vbPairs;
        break;
      }
    case 'r':
      {
        l = rbPairs;
      }
    }
    // DEBUG println(l == null);
    // var nl = l.slice();
    if (i == OLEFT) {
      leftPairs = l.slice();
    }
    else {
      rightPairs = l.slice();
    }
  }

  reshuffle();
  return formNum;
}

function setNewPairsDef() {
  if (leftIndex >= leftLimit || rightIndex >= rightLimit) {
    reshuffle();
  }
  return new OrthoPhrase(setLeftPair(), setRightPair());
}

function setLeftPair() {
  if (leftIndex >= leftLimit) {
    reshuffle();
  }
  var sa = leftPairs[++leftIndex].split(",");
  var ca = leftTags[leftIndex];
  leftPair = new Array(2);
  if (ca[OLEFT] != forms[formNum][OLEFT]) {// (Integer.valueOf(sa[2]) == 1)
    leftPair[OLEFT] = sa[ORIGHT];
    leftPair[ORIGHT] = sa[OLEFT];
  }
  else {
    leftPair[OLEFT] = sa[OLEFT];
    leftPair[ORIGHT] = sa[ORIGHT];
  }
  return leftPair;
}

function setRightPair() {
  if (rightIndex >= rightLimit) {
    reshuffle();
  }
  var sa = rightPairs[++rightIndex].split(",");
  var ca = rightTags[rightIndex];
  rightPair = new Array(2);
  if (ca[OLEFT] != forms[formNum][ORIGHT]) { // (Integer.valueOf(sa[2]) == 1)
    rightPair[OLEFT] = sa[ORIGHT];
    rightPair[ORIGHT] = sa[OLEFT];
  }
  else {
    rightPair[OLEFT] = sa[OLEFT];
    rightPair[ORIGHT] = sa[ORIGHT];
  }
  return rightPair;
}

function setNewPairs(min) {
  var newOp = setNewPairsDef();
  while ( (newOp.getLeft().length < min) && (newOp.getRight().length < min)) {
    newOp = setNewPairsDef();
  }
  return newOp;
}

function reshuffle() {
  // println("made it here " + rightPairs.get(0));
  // println(rightPairs == null);
  leftPairs = rjsShuffle(leftPairs);
  rightPairs = rjsShuffle(rightPairs);
  leftTags = tagPairs(leftPairs);
  rightTags = tagPairs(rightPairs);
  leftLimit = leftPairs.length - 1;
  leftIndex = -1;
  rightLimit = rightPairs.length - 1;
  rightIndex = -1;
}

function rjsShuffle(al) {
  var newAl = al.slice();
  var len = al.length;
  for (var i = 0; i < len; i++) {
    var p = Math.floor(Math.random()*len);
    var t = newAl[i];
    newAl[i] = newAl[p];
    newAl[p] = t;
  }
  return newAl;
};

function tagPairsSt(pairsStArray) {
  var s = new Array();
  for (var i = 0; i < pairsStArray.length; i++) {
    var tags = RiTa.getPosTags(pairsStArray[i]);
    s[i] = tags.slice();
    for (var j = 0; j < s[i].length; j++) {
      s[i][j] = RiTa.posToWordNet(tags[j]);
    }
  }
  return s;
}

function tagPairs(pairsList) {
  var al = pairsList.slice();
  // DEBUG console.log(pairsList);
  for (var i = 0; i < pairsList.length; i++) {
    var s = pairsList[i];
    var sa = s.split(",");
    var ca = new Array(2);
    var tags = RiTa.getPosTags(sa);
    ca[0] = RiTa.posToWordNet(tags[0]);
    ca[1] = RiTa.posToWordNet(tags[1]);
    al[i] = ca;
  }
  return al;
}

function getPairsWithPoS(pairsStArray, tags, pos) {
  var al = new Array();
  var alIndex = -1
  for (var i = 0; i < pairsStArray.length; i++)
  {
    if (tags[i][0] == pos || tags[i][1] == pos) {
      var which = 0;
      if (tags[i][1] == pos)
        which = 1;
      if (tags[i][0] == pos && tags[i][1] == pos)
        which = 2;
      var s = pairsStArray[i][0] + "," + pairsStArray[i][1] + "," + which;
      // DEBUG println(s);
      al[++alIndex] = s;
    }
  }
  return al;
}

function drawAll() {
  RiText.drawAll();
}

function subliteralChange() {
	clearInterval(subliteralInterval);
	subliteralInterval = setInterval(subliteralChange,randomBetween(MIN_SUBLITERAL_DELAY, MAX_SUBLITERAL_DELAY));

  wordToChange = Math.floor(Math.random() * 2);

  if (lDone) {
    wordToChange = ORIGHT;
	}
	else if (rDone) {
    wordToChange = OLEFT;
	}

	if (wordToChange == OLEFT) {
    // displayedLeft.setText(op.getLeft(leftAlt));
    leftDone[leftAlt] = true;
    displayedLeft.text(op.getLeft(leftAlt));
    leftAlt = (leftAlt == 1) ? 0 : 1;
  }
  else {
    // displayedRight.setText(op.getRight(rightAlt));
    rightDone[rightAlt] = true;
    displayedRight.text(op.getRight(rightAlt));
    rightAlt = (rightAlt == 1) ? 0 : 1;
  }

  if (leftDone[OLEFT] && leftDone[ORIGHT]) {
    if (!lDone) {
      if (WITH_INFO) {
        console.log("[INFO] Left done. ");
      }
      lDone = true;
    }
  }

  if (rightDone[OLEFT] && rightDone[ORIGHT]) {
    if (!rDone) {
      if (WITH_INFO) {
        console.log("[INFO] Right done. ");
      }
      rDone = true;
    }
  }

  if (lDone && rDone) {
    newPhrase = true;
    doNewPhrase();
  }

}

function doNewPhrase() {
  if (WITH_INFO) {
    console.log("[INFO] phrase change, ");
  }
  newPhrase = false;
  // these are set for the sake of the subliteralChange:
  leftAlt = 0;
  rightAlt = 0;

  for (var i = 0; i < 2; i++) {
    leftDone[i] = false;
    rightDone[i] = false;
  }
  lDone = false;
  rDone = false;

  var c = Math.floor(Math.random() * 3); // equal chance of left, right & both changing

  if (!PARTIAL_PHRASE_CHANGE) {
    c = 2;
  }
  switch (c) {
  	case OLEFT:
    {
      op = new OrthoPhrase(setLeftPair(), rightPair);
      if (WITH_INFO) {
        console.log("Left");
      }
      break;
    }
  	case ORIGHT:
    {
      op = new OrthoPhrase(leftPair, setRightPair());
      if (WITH_INFO) {
        console.log("Right");
      }
      break;
    }
  	default:
    {
      op = setNewPairs(LENGTH_OF_ONE_AT_LEAST);
      if (WITH_INFO) {
        console.log("Both");
      }
    }
  }
}

function formChange() {
  clearInterval(formInterval);
  formInterval = setInterval(formChange,randomBetween(MIN_FORM_DELAY, MAX_FORM_DELAY));
  formNum = setForm(Math.floor(Math.random() * 9));
  if (WITH_INFO) {
    console.log("[INFO] form change, " + formNum + " " + forms[formNum][OLEFT] + "/" + forms[formNum][ORIGHT]);
  }
}

function OrthoPhrase(leftPair,rightPair) {
  var LEFT_DEF = 0, LEFT_ALT = 1, RIGHT_DEF = 2, RIGHT_ALT = 3;
  var left, leftAlt, right, rightAlt;
  var phrase = new Array(4);

  phrase[LEFT_DEF] = leftPair[0];
  phrase[LEFT_ALT] = leftPair[1];
  phrase[RIGHT_DEF] = rightPair[0];
  phrase[RIGHT_ALT] = rightPair[1];
	left = leftPair[0];
	leftAlt = leftPair[1];
	right = rightPair[0];
	rightAlt = rightPair[1];

	this.phrase = function getPhrase() {
		return phrase;
	}


	this.getLeft = function() {
	  return left;
	}

	this.getLeft = function(alt) {
	  return alt == 0 ? left : leftAlt;
	}

  this.getLeftAlt = function() {
    return leftAlt;
  }

	this.getRight = function() {
	  return right;
	}

	this.getRight = function(alt) {
	  return alt == 0 ? right : rightAlt;
	}

	this.getRightAlt = function() {
	  return rightAlt;
	}

} // OrthoPhrase
