/**
 * @file inputFilter
 * @copyright (c) 2016-2016 Gerd Forstmann
 */


/* eslint-disable */

var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../../js_cov' : '../../js';

var debuglog = require('debug')('erbase.nunit');

const Erbase = require(root + '/match/erbase.js');

const utils = require('abot_utils');

//const inputFiterRules = require(root + '/match/inputFilterRules.js');

const InputFilter = require(root + '/match/inputFilter.js');

const Model = require('fdevsta_monmove').Model;

var theModel = Model.loadModels();
var theModelX = theModel; // Model.loadModels('testmodel',true);


var words = {};

function setMockDebug() {
  var obj = function(s) {
    //console.log(s);
  };
  obj.enabled = true;
  Erbase.mockDebug(obj);
}
if(!debuglog.enabled) {
  setMockDebug();
}


exports.testEvaluteRangeRulesToPosition = function(test) {
  var tokens = ["ABC" , "def" ];
  var fusable = [false,true,false];

  var innerRule =  {
              type : 0,
              matchedString: "AbC DeF",
              lowercaseword : "abc def",
              category : 'uboat',
              _ranking : 777
            };

  var categorizedWords = [
    [],
    [{ word:"DEF", category: "irrelevant",
        _ranking : 111,
        rule : {
          range : {
            low : -1, high :0,
            rule : innerRule
          }
        }
      }
    ]
  ];
  Erbase.evaluateRangeRulesToPosition(tokens,fusable,categorizedWords);
  test.deepEqual(categorizedWords, [[
    {
      string : "ABC def",
      matchedString : "AbC DeF",
      category: "uboat",
      _ranking : 777,
      span: 2,
      rule : innerRule
    }]
   , []
  ], 'correct moved and cleansed res');
  test.done();
}

var r = [
{"category":"category","matchedString":"fiori intent","bitindex":4,"word":"intent","type":0,"lowercaseword":"intent","_ranking":0.95,"range":{"low":-1,"high":0,"rule":{"category":"category","matchedString":"fiori intent","type":0,"word":"fiori intents","bitindex":4,"_ranking":0.95,"lowercaseword":"fiori intents"}}},
{"category":"category","matchedString":"fiori intent","bitindex":4,"word":"intent","type":0,"lowercaseword":"intent","_ranking":0.95,"range":{"low":-1,"high":0,"rule":{"category":"category","matchedString":"fiori intent","type":0,"word":"fiori intent","lowercaseword":"fiori intent","bitindex":4,"_ranking":0.95}}} ];


exports.testEvaluteRangeRulesToPositionSloppyMatch = function(test) {
  var tokens = ["ABC" , "duf" ];
  var fusable = [false,true,false];

  var innerRule =  {
              type : 0,
              matchedString: "AbC DeF",
              lowercaseword : "abc def",
              category : 'uboat',
              _ranking : 777
            };

  var categorizedWords = [
    [],
    [{ word:"DEF", category: "irrelevant",
        _ranking : 111,
        rule : {
          range : {
            low : -1, high :0,
            rule : innerRule
          }
        }
      }
    ]
  ];
  Erbase.evaluateRangeRulesToPosition(tokens,fusable,categorizedWords);
  test.deepEqual(categorizedWords,[ [ { string: 'ABC duf',
      rule:
       { type: 0,
         matchedString: 'AbC DeF',
         lowercaseword: 'abc def',
         category: 'uboat',
         _ranking: 777 },
      matchedString: 'AbC DeF',
      category: 'uboat',
      _ranking: 748.8333685768661,
      levenmatch: 0.9637495091079358,
      span: 2 } ],
  [] ]
  , 'correct moved and cleansed res');
  test.done();
}



exports.testEvaluteRangeRulesToPositionVerySloppyMatch = function(test) {
  var tokens = ["XXX" , "def" ];
  var fusable = [false,true,false];

  var innerRule =  {
              type : 0,
              matchedString: "AbC DeF",
              lowercaseword : "abc def",
              category : 'uboat',
              _ranking : 777
            };

  var categorizedWords = [
    [],
    [{ word:"DEF", category: "irrelevant",
        _ranking : 111,
        rule : {
          range : {
            low : -1, high :0,
            rule : innerRule
          }
        }
      }
    ]
  ];
  Erbase.evaluateRangeRulesToPosition(tokens,fusable,categorizedWords);
  test.deepEqual(categorizedWords, [[],[]]);
  test.done();
}

//export function evaluateRangeRulesToPosition(tokens: string[], fusable : boolean[], categorizedWords : IMatch.ICategorizedStringRanged[][]) {


function simplifyStrings(res) {
  return res.map(function(r) {
    return r.map(word =>  { return word.string + '=>' +  word.matchedString + '/' + word.category + (word.span? '/' + word.span : '') })
  });
}

function simplifyStringsWithBitIndex(res) {
  return res.map(function(r) {
    return r.map(word =>  { return word.string + '=>' +  word.matchedString + '/' + word.category + (word.span? '/' + word.span : '') + ` ${word.rule.wordType}${word.rule.bitindex}`})
  });
}

function simplifySentence(res) {
  return res.map(function(r) {
    return r.map(word =>  { return word.string + '=>' +  word.matchedString + '/' + word.category + (word.span? '/' + word.span : '')})
  });
}



exports.testTokenizeStringElNames = function (test) {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);
  var res = Erbase.tokenizeString('elament names b', theModel.rules, words);
  debuglog('res > ' + JSON.stringify(res, undefined, 2));
  test.deepEqual(simplifyStringsWithBitIndex(res.categorizedWords), [
    [],
    ['names=>element name/category C64',
     'names=>element name/category C32'],
    ['b=>B/element symbol F32']
    ], ' correct result ');
  test.done();
};


exports.testTokenizeStringElNamesAlpha = function (test) {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);
  var res = Erbase.tokenizeString('Alpha Cantauri B', theModel.rules, words);
  debuglog('res > ' + JSON.stringify(res, undefined, 2));
//console.log(JSON.stringify(res));
  test.deepEqual(simplifyStrings(res.categorizedWords),
  [[],[], ['B=>B/element symbol' ] ]
  , ' correct result ');
  test.done();
};






exports.testProcessStringelementNames = function (test) {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);
  var res = Erbase.processString('elaement names nickel ', theModel.rules, words);
  debuglog('\nres > ' + JSON.stringify(res, undefined, 2));

  test.deepEqual(simplifyStringsWithBitIndex(res.sentences),
    [  /* [ 'elaement names=>element name/category/2 C64',
    'nickel=>nickel/element name C32' ], */
    [ 'elaement names=>element name/category/2 C32',
    'nickel=>nickel/element name F32' ]
     ]
    , ' correct result ');
  test.done();
};

exports.testTokenizeStringStartingWith = function (test) {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);
  var res = Erbase.tokenizeString('SemanticObject, SemanticAction with SemanticObject starting with Sup', theModel.rules, words);
  debuglog('\nres > ' + JSON.stringify(res, undefined, 2));

  test.deepEqual(res.categorizedWords[4],
   [ { string: 'starting with',
         matchedString: 'starting with',
         category: 'operator',
         rule:
          { category: 'operator',
            word: 'starting with',
            lowercaseword: 'starting with',
            type: 0,
            matchedString: 'starting with',
            bitindex: 4096,
            bitSentenceAnd: 4095,
            wordType: 'O',
            _ranking: 0.9 },
         _ranking: 0.9,
         span: 2 } ]
    , ' correct result ');

  test.done();
};


exports.testProcessStringStartingWith = function (test) {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);
  var res = Erbase.processString('SemanticObject, SemanticAction with SemanticObject starting with Sup', theModel.rules, words);
  debuglog('\nres > ' + JSON.stringify(res, undefined, 2));

  test.deepEqual(simplifySentence(res.sentences),
    [ [ 'SemanticObject=>SemanticObject/category',
    'SemanticAction=>SemanticAction/category',
    'with=>with/filler',
    'SemanticObject=>SemanticObject/category',
    'starting with=>starting with/operator/2',
    'Sup=>Sup/any' ],
  [ 'SemanticObject=>SemanticObject/category',
    'SemanticAction=>SemanticAction/category',
    'with=>with/filler',
    'SemanticObject=>SemanticObject/category',
    'starting with=>starting with/operator/2',
    'Sup=>Sup/any' ] ]
    , ' correct result ');
 test.deepEqual(res.sentences[0][5],
   { string: 'Sup',
         matchedString: 'Sup',
         category: 'any',
         rule:
          { category: 'any',
            word: 'Sup',
            lowercaseword: 'sup',
            type: 0,
            matchedString: 'Sup',
            exactOnly: true,
            bitindex: 4096,
            bitSentenceAnd: 4095,
            wordType: 'A',
            _ranking: 0.9 },
         _ranking: 0.9 }
    , ' correct result ');


  test.done();
};



exports.testProcessStringSameDistinct = function (test) {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);
  var res = Erbase.processString('element name with element name starting with ABC', theModel.rules, words);
  debuglog('\nres > ' + JSON.stringify(res, undefined, 2));

  test.deepEqual(simplifySentence(res.sentences),
   [ [ 'element name=>element name/category/2',
    'with=>with/filler',
    'element name=>element name/category/2',
    'starting with=>starting with/operator/2',
    'ABC=>ABC/any' ],
  [ 'element name=>element name/category/2',
    'with=>with/filler',
    'element name=>element name/category/2',
    'starting with=>starting with/operator/2',
    'ABC=>ABC/any' ],
  [ 'element name=>element number/category/2',
    'with=>with/filler',
    'element name=>element number/category/2',
    'starting with=>starting with/operator/2',
    'ABC=>ABC/any' ] ]
    , ' correct result ');

  test.done();
};






exports.testProcessStringelementNamesSep = function (test) {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);
  var res = Erbase.processString('elaement,  names nickel ', theModel.rules, words);
  debuglog('\nres > ' + JSON.stringify(res, undefined, 2));

  test.deepEqual(simplifySentence(res.sentences),
    [ ]
    , ' correct result ');
  test.done();
};




exports.testExpandEmtpy = function (test) {
  test.ok(1);
  var src = [
    [{ string: 'a', a: 1 },
    { string: 'b', a: 1 }],
    [],
    [{ string: '3', a: 1 }]
  ];
var res = Erbase.expandTokenMatchesToSentences(['a','b','c'],src);
  test.deepEqual(res.sentences, []);
  test.done();
};

exports.testExpandNoBits = function (test) {
  test.ok(1);
  var src = [
    [{ string: 'a', a: 1 },
    { string: 'b', a: 1 }],
    [{ string: '3', a: 1 }, { string: 'c', a: 1 } ]
  ];
var res = Erbase.expandTokenMatchesToSentences(['a','b','c'],src);
  test.deepEqual(res.sentences,[ [ { string: 'a', a: 1 }, { string: '3', a: 1 } ],
  [ { string: 'b', a: 1 }, { string: '3', a: 1 } ],
  [ { string: 'a', a: 1 }, { string: 'c', a: 1 } ],
  [ { string: 'b', a: 1 }, { string: 'c', a: 1 } ] ]  );
  test.done();
};

exports.testExpandWithBits = function (test) {
  test.ok(1);
  var src = [
    [{ string: 'a', a: 1, rule : { bitSentenceAnd : 0x02 } },
    { string: 'b', a: 1 , rule : { bitSentenceAnd : 0x01 } }],
    [{ string: '3', a: 1 , rule : { bitSentenceAnd : 0x02 }  }, { string: 'c', a: 1 ,  rule : { bitSentenceAnd : 0x01 } } ]
  ];
var res = Erbase.expandTokenMatchesToSentences2(['a','b','c'],src);
  test.deepEqual(res.sentences, [
  [ { string: 'a', a: 1, rule: { bitSentenceAnd: 2 } },
    { string: '3', a: 1, rule: { bitSentenceAnd: 2 } } ],
  [ { string: 'b', a: 1, rule: { bitSentenceAnd: 1 } },
    { string: 'c', a: 1, rule: { bitSentenceAnd: 1 } } ] ]);
  test.done();
};



exports.testExpandSpan = function (test) {
  test.ok(1);
  var src = [
    [{ string: 'a', a: 1 },
    { string: 'a b', a: 1 , span : 2}],
    [],
    [{ string: '3', a: 1 }]
  ];
var res = Erbase.expandTokenMatchesToSentences([],src);
  test.deepEqual(res.sentences, [
  [ {string: 'a b', a : 1, span : 2}, {string : '3', a: 1}]]);
  test.done();
};

exports.testExpandEmtpyErrors = function (test) {
  test.ok(1);
  var src = [
    [{ string: 'a', a: 1 },
    { string: 'xx', a: 1 }],
    [],
    [{ string: '3', a: 1 }]
  ];
var res = Erbase.expandTokenMatchesToSentences(['a','b','c','d'],src);
  test.deepEqual(res.sentences, []);
  test.deepEqual(res.errors.length, 1);
  //console.log(JSON.stringify(res.errors,undefined,2));
  test.deepEqual(res.errors[0].context.token, 'b');
  test.done();
};


exports.testExpandEmtpy2Errors = function (test) {
  test.ok(1);
  var src = [
    [{ string: 'a', a: 1 },
    { string: 'b', a: 1 }],
    [],
    [],
    [{ string: '3', a: 1 }]
  ];
var res = Erbase.expandTokenMatchesToSentences(['a','b','c','d','e'],src);
  test.deepEqual(res.sentences, []);
  test.deepEqual(res.errors.length, 2);
  test.deepEqual(res.errors[0].context.token, 'b');
  test.deepEqual(res.errors[1].context.token, 'c');
  test.done();
};


exports.testExpand0 = function (test) {
  test.ok(1);
  var src = [
    [{ string: 'a', a: 1 },
    { string: 'b', a: 1 }],
    [{ string: '1', a: 1 },
    { string: '2', a: 1 },
    { string: '3', a: 1 }]
  ];
  var res = Erbase.expandTokenMatchesToSentences([], src);
  test.deepEqual(res.sentences, [[{ string: 'a', a: 1 }, { string: '1', a: 1 }],
  [{ string: 'b', a: 1 }, { string: '1', a: 1 }],
  [{ string: 'a', a: 1 }, { string: '2', a: 1 }],
  [{ string: 'b', a: 1 }, { string: '2', a: 1 }],
  [{ string: 'a', a: 1 }, { string: '3', a: 1 }],
  [{ string: 'b', a: 1 }, { string: '3', a: 1 }]], 'correct result');
  test.done();
};


exports.testTokenizeStringOrbitBitFiltered = function (test) {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);
  //console.log(theModel.rules.wordMap["of"]);
  //var augmentedRules = ErIndex.augmentedRules(theModel.rules);
  var res = Erbase.processString2('orbit of the earth', theModel.rules, {});
  debuglog('res > ' + JSON.stringify(res, undefined, 2));
  //console.log('res > ' + JSON.stringify(res, undefined, 2));
  test.deepEqual(simplifyStrings(res.sentences), [
  [ 'orbit=>orbits/category',
    'of=>of/filler',
    'the=>the/filler',
    'earth=>earth/object name' ] ], ' correct result ');
  test.done();
};





exports.testTokenizeStringOrbitEbase = function (test) {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);
  var res = Erbase.processString('orbit of the earth', theModel.rules, words);
  debuglog('res > ' + JSON.stringify(res, undefined, 2));
  //console.log('res > ' + JSON.stringify(res, undefined, 2));
  test.deepEqual(simplifyStrings(res.sentences), [

  /*  [ 'orbit=>orbits/category',
    'of=>of/filler',
    'the=>the/filler',
    'earth=>earth/element name' ], */
  [ 'orbit=>orbits/category',
    'of=>of/filler',
    'the=>the/filler',
    'earth=>earth/object name' ] ], ' correct result ');
  test.done();
};

var theModel2 = Model.loadModels('testmodel2',true);


exports.testCategorizeWordOffsetIntents = function (test) {
  var token = "intents";
  var seenIt = InputFilter.categorizeAWordWithOffsets(token, theModel2.rules,"intents 10", {}, {});
  debuglog(JSON.stringify(seenIt,undefined,2));
  var filter = seenIt.filter(word => word.rule && word.rule.range && (word.rule.range.low === -1)  && word.rule.range.high === 0 );
  var filter2 = seenIt.filter(word => word.rule && !word.rule.range);
  //console.log(JSON.stringify(filter,undefined,2));
  test.equal(filter.length , 2, 'got one with range');
  test.equal(filter2.length, 1,' got one plain');
  test.done();
}

exports.testCategorizeWordOffsetIntentsSloppy = function (test) {
  var token = "intentss";
  var seenIt = InputFilter.categorizeAWordWithOffsets(token, theModel2.rules,"intents 10", {}, {});
  debuglog(JSON.stringify(seenIt,undefined,2));
  var filter = seenIt.filter(word => word.rule && word.rule.range && (word.rule.range.low === -1)  && word.rule.range.high === 0 );
  var filter2 = seenIt.filter(word => word.rule && !word.rule.range);
  //console.log(JSON.stringify(filter,undefined,2));
  test.equal(filter.length, 4, 'got two with range');
  test.equal(filter2.length, 2,'got two without');
  test.done();
}


exports.testCategorizeWordOffsetSemantic = function (test) {
  var token = "semantic";
  var seenIt = InputFilter.categorizeAWordWithOffsets(token, theModel2.rules,"semantic objects", {}, {});
  debuglog(JSON.stringify(seenIt,undefined,2));
  var filter = seenIt.filter(word => word.rule && word.rule.range);
  var filter2 = seenIt.filter(word => word.rule && !word.rule.range);
  //console.log(JSON.stringify(filter,undefined,2));
  test.equal(filter.length, 2, 'got two with range');
  test.equal(filter2.length, 0,'got two without range');
  test.done();
}

exports.testProcessStringSemantic = function (test) {
  var token = "Semantic OBjects";
  // console.log("all" + JSON.stringify(rx, undefined,2));
 // console.log("wordmap: " + JSON.stringify(theModel2.rules.wordMap["element"]));
var res = Erbase.processString('Semantic OBjects', theModel2.rules, {});
  debuglog('res > ' + JSON.stringify(res, undefined, 2));
  //console.log('res > ' + JSON.stringify(res, undefined, 2));
  test.deepEqual(simplifyStrings(res.sentences),
  [ [ 'Semantic OBjects=>SemanticObject/category/2' ] ], ' correct result ');
  test.done();
};

exports.testProcessStringOData = function (test) {
  // console.log("all" + JSON.stringify(rx, undefined,2));
 // console.log("wordmap: " + JSON.stringify(theModel2.rules.wordMap["element"]));
/*
var filtered = theModel2.rules.allRules.filter(rule => rule.type === 0 && rule.word.indexOf('services') === 0
&& rule.range);
console.log(' filtered ' + JSON.stringify(filtered));
console.log('wordmap' + JSON.stringify(theModel2.rules.wordMap['services']));

*/

var res = Erbase.processString('OData Services for UI2SHellService', theModel2.rules, {});
  debuglog('res > ' + JSON.stringify(res, undefined, 2));
  debuglog('res > ' + JSON.stringify(res.errors, undefined, 2));
  test.deepEqual(res.errors[0].text ,'I do not understand "UI2SHellService".', 'correct error message');
  //console.log('res > ' + JSON.stringify(res, undefined, 2));
  test.deepEqual(simplifyStrings(res.sentences), [ ], ' correct result ');
  test.done();
};


exports.testProcessStringODataOK = function (test) {
  // console.log("all" + JSON.stringify(rx, undefined,2));
 // console.log("wordmap: " + JSON.stringify(theModel2.rules.wordMap["element"]));
/*
var filtered = theModel2.rules.allRules.filter(rule => rule.type === 0 && rule.word.indexOf('services') === 0
&& rule.range && rule.range.rule.matchedString.toLowerCase().indexOf('odata')>= 0);
//console.log(' filtered ' + JSON.stringify(filtered));
console.log('wordmap intent' + JSON.stringify(theModel2.rules.wordMap['intent']));
var filtered2 = theModel2.rules.wordMap['intent'].rules.filter(rule => rule.type === 0 && rule.word.indexOf('intent') === 0
&& rule.range && rule.range.rule.matchedString.toLowerCase().indexOf('fiori')>= 0);
console.log("filtered wordmap \n" + filtered2.map( (r,index) => '' + index + " " +  JSON.stringify(r)).join("\n"));
*/
var res = Erbase.processString('OData Services for fiori intent', theModel2.rules, {});
  debuglog('res > ' + JSON.stringify(res, undefined, 2));
  debuglog('res > ' + JSON.stringify(res.errors, undefined, 2));

  //console.log('res > ' + JSON.stringify(res, undefined, 2));
  test.deepEqual(simplifyStrings(res.sentences),
  [ [ 'OData Services=>PrimaryODataServiceName/category/2',
    'for=>for/filler',
    'fiori intent=>fiori intent/category/2' ]]
  , ' correct result ');
  test.done();
};



exports.testCategorizeWordOffset = function (test) {
  var token = "element";
  var seenIt = InputFilter.categorizeAWordWithOffsets(token, theModel2.rules,"element number 10", {}, {});
  debuglog(JSON.stringify(seenIt,undefined,2));
  var filter = seenIt.filter(word => word.rule && (word.rule.range.low === 0)  && word.rule.range.high === 1 );
  //console.log(JSON.stringify(filter,undefined,2));
  test.equal(filter.length > 0,true);
  test.done();
}

exports.testprocessStringModel2 = function (test) {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);
  var words = {};
  var rx = theModel2.rules.allRules.filter(function(r) {
   return  r.lowercaseword === "element";
  });
 // console.log("all" + JSON.stringify(rx, undefined,2));
 // console.log("wordmap: " + JSON.stringify(theModel2.rules.wordMap["element"]));
var res = Erbase.processString('element number 10', theModel2.rules, {});
  debuglog('res > ' + JSON.stringify(res, undefined, 2));
  //console.log('res > ' + JSON.stringify(res, undefined, 2));
  test.deepEqual(simplifyStrings(res.sentences), [ [ 'element number=>element number/category/2',
    '10=>10/element number' ],
  [ 'element number=>element name/category/2',
    '10=>10/element number' ] ], ' correct result ');
  test.done();
};



exports.testTokenizeStringOrbitWhatis = function (test) {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);
  var res = Erbase.processString('orbit of the earth', theModelX.rules, words);
  debuglog('res > ' + JSON.stringify(res, undefined, 2));
  test.deepEqual(simplifyStrings(res.sentences),

[ /*[ 'orbit=>orbits/category',
    'of=>of/filler',
    'the=>the/filler',
    'earth=>earth/element name' ], */
  [ 'orbit=>orbits/category',
    'of=>of/filler',
    'the=>the/filler',
    'earth=>earth/object name' ] ]


//  [ 'orbit of=>orbital period/category',
//    'the=>the/filler',
//    'earth=>earth/object name' ]

//  [ 'orbit of the=>orbits/category', 'earth=>earth/element name' ],
//  [ 'orbit of the=>orbits/category', 'earth=>earth/object name' ]
  , ' correct result ');
  test.done();
};

/*
exports.testProcessStringGovernmentType = function (test) {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);
  var res = Whatis.processString('"Communist state"', theModel2.rules, {});
  console.log("OBject.keys " + Object.keys(theModel2.rules));
  console.log("allrues " + JSON.stringify(theModel2.rules.allRules.filter(function(o) {
    return o.lowercaseword === "communist state";
  })));
  console.log(" here rule wormap exact: " + theModel2.rules.wordMap["communist state"]);
  debuglog('res > ' + JSON.stringify(res, undefined, 2));
  test.deepEqual(simplifyStrings(res.sentences),
  [ 'orbit of=>orbital period/category/2',
    'the=>the/filler',
    'earth=>earth/element name' ], ' correct exact match');
    test.done();
};
*/


exports.testTokenizeStringOrbitCompletelyNothingEbase = function (test) {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  //console.log(theModel.mRules);
  var res = Erbase.processString('orbit of Nomacthforthis the earth', theModel.rules, words);
  debuglog('res > ' + JSON.stringify(res, undefined, 2));
  test.deepEqual(simplifyStrings(res.sentences), []);
  test.deepEqual(res.errors[0].err_code , "NO_KNOWN_WORD" );
  test.deepEqual(res.errors[0].text , "I do not understand \"Nomacthforthis\"." );
  test.done();
};
