import { CHROMA_PROCESSOR_CODE, CHROMA_PROCESSOR_NAME } from './chroma-processor'

/**
 * Loads the chroma audio processor into the given AudioContext and returns an AudioWorkletNode.
 */
export async function createAudioWorkletNode(ctx: AudioContext): Promise<AudioWorkletNode> {
  const blob = new Blob([CHROMA_PROCESSOR_CODE], { type: 'application/javascript' })
  const url = URL.createObjectURL(blob)

  try {
    await ctx.audioWorklet.addModule(url)
  } finally {
    URL.revokeObjectURL(url)
  }

  return new AudioWorkletNode(ctx, CHROMA_PROCESSOR_NAME)
}
