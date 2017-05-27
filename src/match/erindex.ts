/**
 *
 * @module jfseb.fdevstart.analyze
 * @file erbase
 * @copyright (c) 2016 Gerd Forstmann
 *
 * Basic domain based entity recognition
 */


import * as WordMatch from './inputFilter';

import * as debug from 'debug';


var debuglog = debug('erindex');
var perflog = debug('perf');

import { BreakDown as breakdown}  from 'fdevsta_monmove';
import * as ERError from './ererror';

const AnyObject = <any>Object;

export function mockDebug(o) {
  debuglog = o;
  perflog = o;
}

import * as utils from 'abot_utils';
import * as IFErBase from './iferbase';
import { IFModel  as IMatch}  from 'fdevsta_monmove';
import { IFModel  as IFModel}  from 'fdevsta_monmove';



import * as Sentence from './sentence';

import * as Word from './word';

import * as Algol from './algol';


