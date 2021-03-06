/**
 *
 * @module jfseb.erbase
 * @file erbase
 * @copyright (c) 2016 Gerd Forstmann
 *
 * Basic domain based entity recognition
 *
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var WordMatch = require("./inputFilter");
var debug = require("debug");
var debuglog = debug('erbase');
var debuglogV = debug('erbase');
var perflog = debug('perf');
var fdevsta_monmove_1 = require("fdevsta_monmove");
var ERError = require("./ererror");
var AnyObject = Object;
function mockDebug(o) {
    debuglog = o;
    debuglogV = o;
    perflog = o;
}
exports.mockDebug = mockDebug;
var utils = require("abot_utils");
var Sentence = require("./sentence");
/**
 * Given a  string, break it down into components,
 * [['A', 'B'], ['A B']]
 *
 * then categorizeWords
 * returning
 *
 * [ [[ { category: 'systemId', word : 'A'},
 *      { category: 'otherthing', word : 'A'}
 *    ],
 *    // result of B
 *    [ { category: 'systemId', word : 'B'},
 *      { category: 'otherthing', word : 'A'}
 *      { category: 'anothertryp', word : 'B'}
 *    ]
 *   ],
 * ]]]
 *
 *
 *
 */
function tokenizeString(sString, rules, words) {
    var cnt = 0;
    var fac = 1;
    var tokens = fdevsta_monmove_1.BreakDown.tokenizeString(sString);
    if (debuglog.enabled) {
        debuglog("here breakdown" + JSON.stringify(tokens));
    }
    //console.log(JSON.stringify(u));
    words = words || {};
    perflog('this many known words: ' + Object.keys(words).length);
    var res = [];
    var cntRec = {};
    var categorizedSentence = [];
    var hasRecombined = false;
    tokens.tokens.forEach(function (token, index) {
        var seenIt = WordMatch.categorizeAWordWithOffsets(token, rules, sString, words, cntRec);
        /* cannot have this, or need to add all fragment words "UI2 Integration"  if(seenIt.length === 0) {
              return false;
            }
        */
        hasRecombined = hasRecombined || !seenIt.every(function (res) { return !res.rule.range; });
        debuglog(debuglog.enabled ? (" categorized " + token + "/" + index + " to " + JSON.stringify(seenIt))
            : "-");
        debuglog(debuglog.enabled ? (" categorized " + token + "/" + index + " to " +
            seenIt.map(function (it, idx) { return " " + it.rule.wordType + " " + idx + " " + it.rule.bitindex + "  " + it.rule.matchedString + "/" + it.rule.category + " "; }).join("\n"))
            : "-");
        categorizedSentence[index] = seenIt;
        cnt = cnt + seenIt.length;
        fac = fac * seenIt.length;
    });
    // have seen the plain categorization,
    debuglog(" sentences " + tokens.tokens.length + " matches " + cnt + " fac: " + fac);
    if (debuglog.enabled && tokens.tokens.length) {
        debuglog("first match " + JSON.stringify(tokens, undefined, 2));
    }
    debuglog(debuglog.enabled ? " prior RangeRule " + JSON.stringify(categorizedSentence) + " " : '-');
    if (hasRecombined) {
        evaluateRangeRulesToPosition(tokens.tokens, tokens.fusable, categorizedSentence);
    }
    debuglog(debuglog.enabled ? " after RangeRule " + JSON.stringify(categorizedSentence) + " " : '-');
    perflog(" sentences " + tokens.tokens.length + " / " + res.length + " matches " + cnt + " fac: " + fac + " rec : " + JSON.stringify(cntRec, undefined, 2));
    return {
        fusable: tokens.fusable,
        tokens: tokens.tokens,
        categorizedWords: categorizedSentence
    };
}
exports.tokenizeString = tokenizeString;
function isSameRes(present, res) {
    if (!((present.rule.matchedString === res.rule.matchedString)
        && (present.rule.category === res.rule.category)
        && (present.span === res.span)
        && (present.rule.bitindex === res.rule.bitindex))) {
        return 0;
    }
    if (present._ranking < res._ranking) {
        return -1;
    }
    return +1;
}
exports.isSameRes = isSameRes;
function mergeIgnoreOrAppend(result, res) {
    var insertindex = -1;
    var foundNothing = result.every(function (present, index) {
        var r = isSameRes(present, res);
        if (r < 0) {
            //console.log("overwriting worse \n" + JSON.stringify(res) + '\n' + JSON.stringify(present)+ '\n');
            result[index] = res;
            return false;
        }
        else if (r > 0) {
            //console.log('skipping present');
            return false;
        }
        return true;
    });
    if (foundNothing) {
        //debulog('pushing');
        result.push(res);
    }
}
exports.mergeIgnoreOrAppend = mergeIgnoreOrAppend;
function evaluateRangeRulesToPosition(tokens, fusable, categorizedWords) {
    debuglog(debuglog.enabled ? ("evaluateRangeRulesToPosition... " + JSON.stringify(categorizedWords)) : '-');
    categorizedWords.forEach(function (wordlist, index) {
        wordlist.forEach(function (word) {
            if (word.rule.range) {
                //console.log(` got targetindex for RangeRules evaluation : ${targetIndex} ${index} ${fusable.join(" ")}`);
                var targetIndex = fdevsta_monmove_1.BreakDown.isCombinableRangeReturnIndex(word.rule.range, fusable, index);
                //console.log(` got targetindex for RangeRules evaluation : ${targetIndex}`);
                if (targetIndex >= 0) {
                    var combinedWord = fdevsta_monmove_1.BreakDown.combineTokens(word.rule.range, index, tokens);
                    debuglog(debuglog.enabled ? (" test \"" + combinedWord + "\" against \"" + word.rule.range.rule.lowercaseword + "\" " + JSON.stringify(word.rule.range.rule)) : '-');
                    var res = WordMatch.categorizeWordWithOffsetWithRankCutoffSingle(combinedWord, word.rule.range.rule);
                    debuglog(debuglog.enabled ? (" got res : " + JSON.stringify(res)) : '-');
                    if (res) {
                        res.span = word.rule.range.high - word.rule.range.low + 1;
                        categorizedWords[targetIndex] = categorizedWords[targetIndex].slice(0); // avoid invalidation of seenit
                        debuglog("pushed sth at " + targetIndex);
                        mergeIgnoreOrAppend(categorizedWords[targetIndex], res);
                        //         categorizedWords[targetIndex].push(res); // check that this does not invalidate seenit!
                    }
                }
            }
        });
    });
    // filter all range rules !
    categorizedWords.forEach(function (wordlist, index) {
        categorizedWords[index] = wordlist.filter(function (word) { return !word.rule.range; });
    });
}
exports.evaluateRangeRulesToPosition = evaluateRangeRulesToPosition;
var clone = utils.cloneDeep;
function copyVecMembers(u) {
    var i = 0;
    for (i = 0; i < u.length; ++i) {
        u[i] = clone(u[i]);
    }
    return u;
}
// we can replicate the tail or the head,
// we replicate the tail as it is smaller.
// [a,b,c ]
function isSpanVec(vec, index) {
    var effectivelen = vec.reduce(function (prev, mem) { return prev += mem.span ? mem.span : 1; }, 0);
    return effectivelen > index;
}
exports.isSpanVec = isSpanVec;
/**
 * expand an array [[a1,a2], [b1,b2],[c]]
 * into all combinations
 *
 *  if a1 has a span of three, the variations of the lower layer are skipped
 *
 * with the special property
 */
function expandTokenMatchesToSentences(tokens, tokenMatches) {
    var a = [];
    var wordMatches = [];
    debuglogV(debuglog.enabled ? JSON.stringify(tokenMatches) : '-');
    tokenMatches.forEach(function (aWordMatches, wordIndex) {
        wordMatches[wordIndex] = [];
        aWordMatches.forEach(function (oWordVariant, wordVariantIndex) {
            wordMatches[wordIndex][wordVariantIndex] = oWordVariant;
        });
    });
    debuglog(debuglog.enabled ? JSON.stringify(tokenMatches) : '-');
    var result = {
        errors: [],
        tokens: tokens,
        sentences: []
    };
    var nvecs = [];
    var res = [[]];
    // var nvecs = [];
    var rvec = [];
    for (var tokenIndex = 0; tokenIndex < tokenMatches.length; ++tokenIndex) {
        //vecs is the vector of all so far seen variants up to k length.
        var nextBase = [];
        //independent of existence of matches on level k, we retain all vectors which are covered by a span
        // we skip extending them below
        for (var u = 0; u < res.length; ++u) {
            if (isSpanVec(res[u], tokenIndex)) {
                nextBase.push(res[u]);
            }
        }
        var lenMatches = tokenMatches[tokenIndex].length;
        if (nextBase.length === 0 && lenMatches === 0) {
            // the word at index I cannot be understood
            //if (result.errors.length === 0) {
            result.errors.push(ERError.makeError_NO_KNOWN_WORD(tokenIndex, tokens));
            //}
        }
        for (var l = 0; l < lenMatches; ++l) {
            //debuglog("vecs now" + JSON.stringify(vecs));
            var nvecs = []; //vecs.slice(); // copy the vec[i] base vector;
            //debuglog("vecs copied now" + JSON.stringify(nvecs));
            for (var u = 0; u < res.length; ++u) {
                if (!isSpanVec(res[u], tokenIndex)) {
                    // for each so far constructed result (of length k) in res
                    nvecs.push(res[u].slice()); // make a copy of each vector
                    nvecs[nvecs.length - 1] = copyVecMembers(nvecs[nvecs.length - 1]);
                    // debuglog("copied vecs["+ u+"]" + JSON.stringify(vecs[u]));
                    nvecs[nvecs.length - 1].push(clone(tokenMatches[tokenIndex][l])); // push the lth variant
                    // debuglog("now nvecs " + nvecs.length + " " + JSON.stringify(nvecs));
                }
            }
            //   debuglog(" at     " + k + ":" + l + " nextbase >" + JSON.stringify(nextBase))
            //   debuglog(" append " + k + ":" + l + " nvecs    >" + JSON.stringify(nvecs))
            nextBase = nextBase.concat(nvecs);
            //   debuglog("  result " + k + ":" + l + " nvecs    >" + JSON.stringify(nextBase))
        } //constru
        //  debuglog("now at " + k + ":" + l + " >" + JSON.stringify(nextBase))
        res = nextBase;
    }
    debuglogV(debuglogV.enabled ? ("APPENDING TO RES" + 0 + ":" + l + " >" + JSON.stringify(nextBase)) : '-');
    result.sentences = res;
    return result;
}
exports.expandTokenMatchesToSentences = expandTokenMatchesToSentences;
// todo: bitindex
function makeAnyWord(token) {
    return { string: token,
        matchedString: token,
        category: 'any',
        rule: { category: 'any',
            type: 0,
            word: token,
            lowercaseword: token.toLowerCase(),
            matchedString: token,
            exactOnly: true,
            bitindex: 4096,
            bitSentenceAnd: 4095,
            wordType: 'A',
            _ranking: 0.9 },
        _ranking: 0.9
    };
}
exports.makeAnyWord = makeAnyWord;
function isSuccessorOperator(res, tokenIndex) {
    if (tokenIndex === 0) {
        return false;
    }
    if (res[res.length - 1].rule.wordType === 'O') {
        //debuglog(` assumuning op at ${tokenIndex} ` + JSON.stringify(res, undefined, 2));
        return true;
    }
    return false;
}
exports.isSuccessorOperator = isSuccessorOperator;
/**
 * expand an array [[a1,a2], [b1,b2],[c]]
 * into all combinations
 *
 *  if a1 has a span of three, the variations of the lower layer are skipped
 *
 * with the special property
 */
function expandTokenMatchesToSentences2(tokens, tokenMatches) {
    var a = [];
    var wordMatches = [];
    debuglogV(debuglog.enabled ? JSON.stringify(tokenMatches) : '-');
    tokenMatches.forEach(function (aWordMatches, wordIndex) {
        wordMatches[wordIndex] = [];
        aWordMatches.forEach(function (oWordVariant, wordVariantIndex) {
            wordMatches[wordIndex][wordVariantIndex] = oWordVariant;
        });
    });
    debuglog(debuglog.enabled ? JSON.stringify(tokenMatches) : '-');
    var result = {
        errors: [],
        tokens: tokens,
        sentences: []
    };
    var nvecs = [];
    var res = [[]];
    // var nvecs = [];
    var rvec = [];
    for (var tokenIndex = 0; tokenIndex < tokenMatches.length; ++tokenIndex) {
        //vecs is the vector of all so far seen variants up to tokenIndex length.
        var nextBase = [];
        // independent of existence of matches on level k, we retain all vectors which are covered by a span
        // we skip extending them below
        for (var u = 0; u < res.length; ++u) {
            if (isSpanVec(res[u], tokenIndex)) {
                nextBase.push(res[u]);
            }
            else if (isSuccessorOperator(res[u], tokenIndex)) {
                res[u].push(makeAnyWord(tokens[tokenIndex]));
                nextBase.push(res[u]);
            }
        }
        // independent of existence of matches on level tokenIndex, we extend all vectors which
        // are a successor of a binary extending op ( like "starting with", "containing" with the next token)
        /*   for(var resIndex = 0; resIndex < res.length; ++resIndex) {
          if (isSuccessorOperator(res[resIndex], tokenIndex)) {
            res[resIndex].push(makeAnyWord(tokens[tokenIndex]));
            nextBase.push(res[resIndex]);
          }
        }
        */
        var lenMatches = tokenMatches[tokenIndex].length;
        if (nextBase.length === 0 && lenMatches === 0) {
            // the word at index I cannot be understood
            //if (result.errors.length === 0) {
            result.errors.push(ERError.makeError_NO_KNOWN_WORD(tokenIndex, tokens));
            //}
        }
        for (var l = 0; l < lenMatches; ++l) {
            //debuglog("vecs now" + JSON.stringify(vecs));
            var nvecs = []; //vecs.slice(); // copy the vec[i] base vector;
            //debuglog("vecs copied now" + JSON.stringify(nvecs));
            for (var u = 0; u < res.length; ++u) {
                if (!isSpanVec(res[u], tokenIndex) && !isSuccessorOperator(res[u], tokenIndex)) {
                    // for each so far constructed result (of length k) in res
                    nvecs.push(res[u].slice()); // make a copy of each vector
                    nvecs[nvecs.length - 1] = copyVecMembers(nvecs[nvecs.length - 1]);
                    // debuglog("copied vecs["+ u+"]" + JSON.stringify(vecs[u]));
                    nvecs[nvecs.length - 1].push(clone(tokenMatches[tokenIndex][l])); // push the lth variant
                    // debuglog("now nvecs " + nvecs.length + " " + JSON.stringify(nvecs));
                }
            }
            //   debuglog(" at     " + k + ":" + l + " nextbase >" + JSON.stringify(nextBase))
            //   debuglog(" append " + k + ":" + l + " nvecs    >" + JSON.stringify(nvecs))
            nextBase = nextBase.concat(nvecs);
            //   debuglog("  result " + k + ":" + l + " nvecs    >" + JSON.stringify(nextBase))
        } //constru
        //  debuglog("now at " + k + ":" + l + " >" + JSON.stringify(nextBase))
        res = nextBase;
    }
    debuglogV(debuglogV.enabled ? ("APPENDING TO RES" + 0 + ":" + l + " >" + JSON.stringify(nextBase)) : '-');
    res = res.filter(function (sentence, index) {
        var full = 0xFFFFFFFF;
        //console.log(`sentence  ${index}  \n`)
        return sentence.every(function (word, index2) {
            full = full & word.rule.bitSentenceAnd;
            //console.log(` word  ${index2} ${full} "${word.matchedString}" ${word.rule.bitSentenceAnd}  ${tokens[index2]} \n`);
            return full !== 0;
        });
    });
    result.sentences = res;
    return result;
}
exports.expandTokenMatchesToSentences2 = expandTokenMatchesToSentences2;
function processString(query, rules, words) {
    words = words || {};
    if (!process.env.ABOT_NO_TEST1) {
        return processString2(query, rules, words);
    }
    var tokenStruct = tokenizeString(query, rules, words);
    evaluateRangeRulesToPosition(tokenStruct.tokens, tokenStruct.fusable, tokenStruct.categorizedWords);
    if (debuglog.enabled) {
        debuglog("After matched " + JSON.stringify(tokenStruct.categorizedWords));
    }
    var aSentences = expandTokenMatchesToSentences(tokenStruct.tokens, tokenStruct.categorizedWords);
    if (debuglog.enabled) {
        debuglog("after expand" + aSentences.sentences.map(function (oSentence) {
            return Sentence.rankingProduct(oSentence) + ":" + Sentence.dumpNice(oSentence); //JSON.stringify(oSentence);
        }).join("\n"));
    }
    aSentences.sentences = WordMatch.reinForce(aSentences.sentences);
    if (debuglog.enabled) {
        debuglog("after reinforce" + aSentences.sentences.map(function (oSentence) {
            return Sentence.rankingProduct(oSentence) + ":" + JSON.stringify(oSentence);
        }).join("\n"));
    }
    return aSentences;
}
exports.processString = processString;
/**
 * Return true if the identical word is interpreted
 * (within the same domain and the same wordtype)
 * as a differnent  (e.g. element numb is one interpreted as 'CAT' element name, once as CAT 'element number' in
 * same domain IUPAC elements )
 * @param sentence
 */
function isDistinctInterpretationForSame(sentence) {
    var mp = {};
    var res = sentence.every(function (word, index) {
        var seen = mp[word.string];
        if (!seen) {
            mp[word.string] = word;
            return true;
        }
        if (!seen.rule || !word.rule) {
            return true;
        }
        if (seen.rule.bitindex === word.rule.bitindex
            && seen.rule.matchedString !== word.rule.matchedString) {
            //  console.log("skipping this" + JSON.stringify(sentence,undefined,2));
            return false;
        }
        return true;
    });
    return res;
}
exports.isDistinctInterpretationForSame = isDistinctInterpretationForSame;
function filterNonSameInterpretations(aSentences) {
    var discardIndex = [];
    var res = Object.assign({}, aSentences);
    res.sentences = aSentences.sentences.filter(function (sentence, index) {
        if (!isDistinctInterpretationForSame(sentence)) {
            discardIndex.push(index);
            return false;
        }
        return true;
    });
    if (discardIndex.length) {
        res.errors = aSentences.errors.filter(function (error, index) {
            if (discardIndex.indexOf(index) >= 0) {
                return false;
            }
            return true;
        });
    }
    return res;
}
exports.filterNonSameInterpretations = filterNonSameInterpretations;
function processString2(query, rules, words) {
    words = words || {};
    var tokenStruct = tokenizeString(query, rules, words);
    evaluateRangeRulesToPosition(tokenStruct.tokens, tokenStruct.fusable, tokenStruct.categorizedWords);
    if (debuglog.enabled) {
        debuglog("After matched " + JSON.stringify(tokenStruct.categorizedWords));
    }
    var aSentences = expandTokenMatchesToSentences2(tokenStruct.tokens, tokenStruct.categorizedWords);
    if (debuglog.enabled) {
        debuglog("after expand" + aSentences.sentences.map(function (oSentence) {
            return Sentence.rankingProduct(oSentence) + ":" + Sentence.dumpNice(oSentence); //JSON.stringify(oSentence);
        }).join("\n"));
    }
    var aSentences = filterNonSameInterpretations(aSentences);
    aSentences.sentences = WordMatch.reinForce(aSentences.sentences);
    if (debuglog.enabled) {
        debuglog("after reinforce" + aSentences.sentences.map(function (oSentence) {
            return Sentence.rankingProduct(oSentence) + ":" + JSON.stringify(oSentence);
        }).join("\n"));
    }
    return aSentences;
}
exports.processString2 = processString2;
function simplifySentence(res) {
    return res.map(function (r) {
        return r.map(function (word) { return word.string + '=>' + word.matchedString + '/' + word.category + (word.span ? '/' + word.span : ''); });
    });
}
exports.simplifySentence = simplifySentence;

//# sourceMappingURL=erbase.js.map
