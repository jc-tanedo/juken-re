import { MEANING } from 'src/common/constants';
import { gradeSpeech } from './gradeSpeech';

export const correctionMs = 3000;
const capturePhases = ['preparing', 'listening', 'speaking', 'processing'];
export const canPass = phase => capturePhases.includes(phase);
const off = { phase: 'off' };

export default class VoiceSession {
  constructor(service, publish, callbacks) {
    this.service = service;
    this.publish = publish;
    this.callbacks = callbacks;
    this.state = off;
    this.generation = 0;
  }

  show(phase, message = '', detail = '') {
    this.state = { phase, message, detail };
    this.publish(this.state);
  }

  invalidate() {
    this.generation++;
    clearTimeout(this.timer);
    this.service.cancel();
  }

  setTurn(turn) {
    if (turn === this.turn) return;
    this.turn = turn;
    if (this.state.phase === 'off') return;
    if (!turn || this.state.phase === 'starting') {
      this.invalidate();
      this.show('off');
    } else {
      this.listen();
    }
  }

  async start() {
    if (!this.turn || this.state.phase !== 'off') return;
    const generation = ++this.generation;
    this.show('starting', 'Checking microphone');
    const allowed = await this.service.permission().catch(() => false);
    if (generation !== this.generation) return;
    if (allowed) this.listen();
    else this.show('manual', 'Microphone unavailable. Reveal and swipe to review.');
  }

  stop() {
    const committed = this.state.phase === 'correct' || this.state.phase === 'answer';
    this.invalidate();
    this.show('off');
    if (committed) this.callbacks.advance();
  }

  async listen(previous = null) {
    this.invalidate();
    const generation = this.generation;
    const current = () => generation === this.generation;
    const meaning = this.turn.item.reviewType === MEANING;
    const listening = meaning ? 'Listening in English' : 'Listening in Japanese';
    const hint = previous ? previous.message + ' · Try again' : '';
    let partial = '';
    const onActivity = ({ stage, text }) => {
      if (!current() || !canPass(this.state.phase)) return;
      if (stage === 'preparing') return this.show('preparing', 'Connecting microphone', hint);
      if (stage === 'ready' && this.state.phase === 'preparing') {
        return this.show('listening', listening, hint);
      }
      if (stage === 'partial') partial = text;
      const detail = partial ? '“' + partial + '”' : '';
      if (stage === 'processing' || this.state.phase === 'processing') {
        this.show('processing', 'Checking answer', detail);
      } else if (stage === 'speaking' || stage === 'partial') {
        this.show('speaking', 'Hearing you', detail || listening);
      }
    };
    this.show('preparing', 'Connecting microphone', hint);
    let result;
    try {
      result = await this.service.listen(meaning ? 'en-US' : 'ja-JP', current, onActivity, this.callbacks.vocabulary?.() || []);
    } catch {
      result = { status: 'unavailable' };
    }
    if (!current()) return;
    if (result.status === 'cancelled') return this.stop();
    if (result.status === 'unavailable' || result.status === 'permission') {
      return this.show('manual', 'Speech service unavailable. Reveal and swipe to review.');
    }

    const grade = gradeSpeech(this.callbacks.answers(), result);
    const heard = result.text ? 'Heard “' + result.text + '”' : '';
    switch (grade.kind) {
      case 'correct': return this.commit(true, '“' + (grade.transcript || result.text) + '”');
      case 'pass': return this.pass();
      case 'manual': return this.show('manual', grade.message, heard);
      case 'unclear':
        if (previous) return this.show('manual', grade.message + '. Reveal and swipe.', heard);
        return this.listen({ message: grade.message });
      case 'unscored':
        if (!previous) return this.listen({ ...grade, message: 'Heard “' + result.text + '”' });
        if (previous.normalized !== grade.normalized) {
          return this.show('manual', 'Dictation changed between attempts. Reveal and swipe.', heard);
        }
        break;
    }
    this.show('correction', 'Didn’t match', 'Heard “' + result.text + '”');
    this.timer = setTimeout(() => { if (current()) this.commit(false); }, correctionMs);
  }

  retry() {
    if (this.state.phase === 'correction') this.listen();
  }

  pass() {
    if (canPass(this.state.phase)) this.commit(false, 'Passed');
  }

  commit(correct, message) {
    const turn = this.turn;
    this.invalidate();
    const generation = this.generation;
    const { answer } = this.callbacks.answers();
    if (!this.callbacks.commit(turn, correct)) return this.show('off');
    if (correct) this.show('correct', 'Correct', message);
    else this.show('answer', message || 'Incorrect', 'Answer · ' + answer);
    this.timer = setTimeout(() => {
      if (generation === this.generation) this.callbacks.advance();
    }, correct ? 1000 : 2000);
  }
}
