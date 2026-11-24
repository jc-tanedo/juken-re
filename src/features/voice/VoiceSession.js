import { MEANING } from 'src/common/constants';
import { gradeSpeech } from './gradeSpeech';

export const correctionMs = 3000;
const off = { phase: 'off' };

export default class VoiceSession {
  constructor(service, publish, callbacks) {
    this.service = service;
    this.publish = publish;
    this.callbacks = callbacks;
    this.state = off;
    this.generation = 0;
  }

  show(phase, message = '') {
    this.state = { phase, message };
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
    this.show('listening', previous ? previous.message + ' · Try again' : listening);
    let result;
    try {
      result = await this.service.listen(meaning ? 'en-US' : 'ja-JP', current);
    } catch {
      result = { status: 'unavailable' };
    }
    if (!current()) return;
    if (result.status === 'cancelled') return this.stop();
    if (result.status === 'unavailable' || result.status === 'permission') {
      return this.show('manual', 'Speech service unavailable. Reveal and swipe to review.');
    }

    const grade = gradeSpeech(this.callbacks.answers(), result);
    switch (grade.kind) {
      case 'correct': return this.commit(true, 'Correct · “' + result.text + '”');
      case 'pass': return this.pass();
      case 'manual': return this.show('manual', grade.message);
      case 'unclear':
        if (previous) return this.show('manual', grade.message + '. Reveal and swipe.');
        return this.listen({ message: grade.message });
      case 'unscored':
        if (!previous) return this.listen({ ...grade, message: 'Heard “' + result.text + '”' });
        if (previous.normalized !== grade.normalized) {
          return this.show('manual', 'Couldn’t confirm the answer. Reveal and swipe.');
        }
        break;
    }
    this.show('correction', 'Heard “' + result.text + '”');
    this.timer = setTimeout(() => { if (current()) this.commit(false); }, correctionMs);
  }

  retry() {
    if (this.state.phase === 'correction') this.listen();
  }

  pass() {
    if (this.state.phase === 'listening') this.commit(false);
  }

  commit(correct, message) {
    const turn = this.turn;
    this.invalidate();
    const generation = this.generation;
    const { answer } = this.callbacks.answers();
    if (!this.callbacks.commit(turn, correct)) return this.show('off');
    this.show(correct ? 'correct' : 'answer', message || 'Answer · ' + answer);
    this.timer = setTimeout(() => {
      if (generation === this.generation) this.callbacks.advance();
    }, correct ? 650 : 2000);
  }
}
