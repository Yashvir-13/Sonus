/**
 * AudioWorkletProcessor implementation for streaming PCM audio frames.
 * Runs in the AudioWorkletGlobalScope without blocking the UI thread.
 */

export const CHROMA_PROCESSOR_NAME = 'chroma-audio-processor'

export const CHROMA_PROCESSOR_CODE = `
class ChromaAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048;
    this.buffer = new Float32Array(2048);
    this.bufferIndex = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) {
      return true;
    }

    const channelData = input[0];
    for (let i = 0; i < channelData.length; i++) {
      this.buffer[this.bufferIndex++] = channelData[i];
      if (this.bufferIndex >= this.bufferSize) {
        const frame = new Float32Array(this.buffer);
        this.port.postMessage({ type: 'PCM_FRAME', buffer: frame.buffer }, [frame.buffer]);
        this.bufferIndex = 0;
      }
    }

    return true;
  }
}

registerProcessor('${CHROMA_PROCESSOR_NAME}', ChromaAudioProcessor);
`
