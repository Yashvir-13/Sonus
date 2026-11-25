class ChromaAudioProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super()
    const requestedSize = options?.processorOptions?.bufferSize
    this.bufferSize =
      Number.isInteger(requestedSize) && requestedSize > 0 ? requestedSize : 2048
    this.buffer = new Float32Array(this.bufferSize)
    this.bufferIndex = 0
  }

  process(inputs) {
    const input = inputs[0]
    if (!input || !input[0]) {
      return true
    }

    const channelData = input[0]
    for (let i = 0; i < channelData.length; i++) {
      this.buffer[this.bufferIndex++] = channelData[i]
      if (this.bufferIndex >= this.bufferSize) {
        const frame = new Float32Array(this.buffer)
        this.port.postMessage({ type: 'PCM_FRAME', buffer: frame.buffer }, [frame.buffer])
        this.bufferIndex = 0
      }
    }

    return true
  }
}

registerProcessor('chroma-audio-processor', ChromaAudioProcessor)
