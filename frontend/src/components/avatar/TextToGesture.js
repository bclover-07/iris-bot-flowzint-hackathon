'use strict';

const GREETING_WORDS = /\b(hi|hello|hey|greetings|good\s*morning|good\s*afternoon|good\s*evening|welcome)\b/i;
const FAREWELL_WORDS = /\b(bye|goodbye|see\s*you|farewell|take\s*care|good\s*night|later)\b/i;
const EXTREME_POSITIVE = /\b(awesome|amazing|fantastic|excited|super)\b/i;
const POSITIVE_WORDS = /\b(great|awesome|amazing|excellent|fantastic|wonderful|perfect|brilliant|good\s*job|well\s*done|congrats|congratulations|love|happy|glad|excited|nice|cool|super)\b/i;
const FACEPALM_WORDS = /\b(fail|wrong|mistake|oops|idiot|stupid)\b/i;
const NEGATIVE_WORDS = /\b(sorry|unfortunately|error|fail|wrong|bad|sad|problem|issue|difficult|hard|trouble|worry|afraid|concern|mistake|oops)\b/i;
const AGREEMENT_WORDS = /\b(yes|yeah|correct|right|exactly|absolutely|indeed|agree|true|certainly|sure|definitely|of\s*course)\b/i;
const UNCERTAINTY_WORDS = /\b(maybe|perhaps|possibly|not\s*sure|uncertain|might|could\s*be|hmm|well|depends|unclear)\b/i;
const THINKING_WORDS = /\b(think|consider|ponder|let\s*me\s*see|hmm|interesting|wonder|curious)\b/i;
const WARNING_WORDS = /\b(careful|warning|caution|danger|watch\s*out|beware|alert|important|critical|urgent|attention)\b/i;
const CONCLUSION_WORDS = /\b(finally|in\s*summary|to\s*summarize|in\s*conclusion|overall|so|therefore|thus|hence|wrap\s*up|all\s*in\s*all)\b/i;
const EXPLANATION_WORDS = /\b(because|since|means|explain|reason|basically|essentially|in\s*other\s*words|for\s*example|such\s*as|like|similar)\b/i;
const SELF_WORDS = /\b(i|me|my|mine|myself)\b/i;
const LISTING_PATTERN = /(?:^|\n)\s*(?:\d+[\.\):]|[-•*]|\*)\s/m;
const EMPHASIS_PATTERN = /(?:[A-Z]{3,}|!!|!\?|\*\*[^*]+\*\*)/;

const TALKING_VARIANTS = [
  'TalkNeutral', 'TalkExcited', 'TalkCalm', 'TalkEmphatic',
  'TalkExplain', 'TalkQuestion', 'TalkList', 'TalkConclude',
  'TalkAgree', 'TalkDisagree',
];

const GESTURE_RESULT = {
  gestures: [],
  expression: 'neutral',
  expressionWeight: 0.5,
  browRaise: 0,
};

export class TextToGesture {
  constructor() {
    this.lastGestureTime = 0;
    this.usedGestures = new Set();
    this.talkVariantIndex = 0;
  }

  analyzeUserInput(text) {
    const result = { ...GESTURE_RESULT, gestures: [] };
    if (!text) return result;

    const t = text.trim();

    if (GREETING_WORDS.test(t)) {
      result.gestures.push('WaveHello');
      result.expression = 'happy';
      result.expressionWeight = 0.7;
      return result;
    }

    if (FAREWELL_WORDS.test(t)) {
      result.gestures.push('WaveGoodbye');
      result.expression = 'happy';
      result.expressionWeight = 0.5;
      return result;
    }

    return result;
  }

  analyzeResponse(text) {
    const result = { ...GESTURE_RESULT, gestures: [] };
    if (!text) return result;

    const t = text.trim();
    const sentences = t.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const isQuestion = t.endsWith('?');
    const isExclamation = t.includes('!');
    const hasListing = LISTING_PATTERN.test(t);
    const hasEmphasis = EMPHASIS_PATTERN.test(t);
    const isLong = t.length > 200;

    if (GREETING_WORDS.test(t.substring(0, 80))) {
      result.gestures.push('WaveHello');
      result.expression = 'happy';
      result.expressionWeight = 0.7;
      result.browRaise = 0.2;
    }

    if (FAREWELL_WORDS.test(t)) {
      result.gestures.push('WaveGoodbye');
      result.expression = 'happy';
      result.expressionWeight = 0.5;
      return result;
    }

    if (POSITIVE_WORDS.test(t)) {
      if (/\b(congrats|congratulations|well\s*done|good\s*job)\b/i.test(t)) {
        result.gestures.push('Clapping');
      } else {
        result.gestures.push('ThumbsUp');
      }
      result.expression = 'happy';
      result.expressionWeight = 0.8;
      result.browRaise = 0.15;
    }

    if (NEGATIVE_WORDS.test(t)) {
      if (/\b(sorry|unfortunately|afraid)\b/i.test(t)) {
        result.gestures.push('HandOverHeart');
        result.expression = 'sad';
        result.expressionWeight = 0.4;
      } else {
        result.gestures.push('HeadShake');
        result.expression = 'sad';
        result.expressionWeight = 0.3;
      }
    }

    
    if (FACEPALM_WORDS.test(t)) {
      result.gestures.push('Facepalm');
    }
    if (WARNING_WORDS.test(t)) {
      result.gestures.push('Defensive');
    }
    if (EXTREME_POSITIVE.test(t)) {
      result.gestures.push('ExcitedJump');
    }
    if (SELF_WORDS.test(t.substring(0, 50))) {
      result.gestures.push('PointSelf');
    }

    if (WARNING_WORDS.test(t) && false) {
      result.gestures.push('StopHalt');
      result.expression = 'surprised';
      result.expressionWeight = 0.5;
      result.browRaise = 0.3;
    }

    if (UNCERTAINTY_WORDS.test(t)) {
      result.gestures.push('ShrugHeavy');
      result.gestures.push('HeadTilt');
      result.browRaise = 0.2;
    }

    if (AGREEMENT_WORDS.test(t)) {
      if (!result.gestures.some(g => g.includes('Wave') || g === 'Clapping')) {
        result.gestures.push('SlowNod');
      }
    }

    if (hasListing) {
      const listItems = t.match(/(?:^|\n)\s*(?:\d+[\.\):]|[-•*])\s/gm);
      if (listItems && listItems.length >= 3) {
        result.gestures.push('CountOne');
        result.gestures.push('CountTwo');
        result.gestures.push('CountThree');
      } else if (listItems && listItems.length >= 2) {
        result.gestures.push('CountOne');
        result.gestures.push('CountTwo');
      } else {
        result.gestures.push('TalkList');
      }
    }

    if (EXPLANATION_WORDS.test(t)) {
      if (!result.gestures.includes('TalkList')) {
        result.gestures.push('Explain');
        result.gestures.push('PresentBothHands');
      }
    }

    if (isQuestion && !result.gestures.some(g => g.includes('Count'))) {
      result.gestures.push('TalkQuestion');
      result.gestures.push('HeadTilt');
    }

    if (hasEmphasis) {
      result.gestures.push('TalkEmphatic');
      result.gestures.push('ChopMotion');
    }

    if (CONCLUSION_WORDS.test(t)) {
      result.gestures.push('TalkConclude');
      result.gestures.push('PalmDown');
    }

    if (THINKING_WORDS.test(t)) {
      result.gestures.push('Think');
    }

    if (result.gestures.length === 0) {
      result.gestures.push(this._getNextTalkVariant());
    }

    if (isLong && result.gestures.length < 3) {
      const fillers = this._getLongResponseFillers();
      result.gestures.push(...fillers);
    }

    result.gestures = this._deduplicateAndLimit(result.gestures);

    return result;
  }

  analyzeThinking() {
    return {
      gestures: ['ChinTap'],
      expression: 'neutral',
      expressionWeight: 0.2,
      browRaise: 0.15,
    };
  }

  _getNextTalkVariant() {
    const neutralVariants = ['TalkNeutral', 'TalkCalm', 'TalkExplain', 'TalkNeutral'];
    const variant = neutralVariants[this.talkVariantIndex % neutralVariants.length];
    this.talkVariantIndex++;
    return variant;
  }

  _getLongResponseFillers() {
    const fillers = [
      ['PalmUpOpen', 'TalkExplain', 'SlowNod'],
      ['PresentBothHands', 'TalkNeutral', 'ArmSweep'],
      ['AfterYou', 'TalkCalm', 'SlowNod'],
      ['HoldVirtualObject', 'TalkExplain', 'PalmDown'],
    ];
    const set = fillers[this.talkVariantIndex % fillers.length];
    return set.slice(0, 2);
  }

  _deduplicateAndLimit(gestures) {
    const seen = new Set();
    const unique = [];
    for (const g of gestures) {
      if (!seen.has(g)) {
        seen.add(g);
        unique.push(g);
      }
    }
    return unique.slice(0, 6);
  }

  reset() {
    this.talkVariantIndex = 0;
    this.usedGestures.clear();
  }
}
