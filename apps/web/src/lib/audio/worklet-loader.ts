import { CHROMA_PROCESSOR_NAME } from './chroma-processor'

const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
export const CHROMA_WORKLET_URL = `${baseUrl}/worklets/chroma-audio-processor.js`

export type PcmCaptureHandle = {
  node: AudioNode
  mode: 'worklet' | 'script-processor'
  connectSilent: (ctx: AudioContext) => void
  disconnect: () => void
}

/**
 * Loads the static same-origin chroma audio processor into the given AudioContext
 * and returns an AudioWorkletNode without creating blob: URLs.
 */
export async function createAudioWorkletNode(ctx: AudioContext): Promise<AudioWorkletNode> {
  if (!ctx.audioWorklet || typeof ctx.audioWorklet.addModule !== 'function') {
    throw new Error('AudioWorklet is not supported in this AudioContext')
  }
  await ctx.audioWorklet.addModule(CHROMA_WORKLET_URL)
  return new AudioWorkletNode(ctx, CHROMA_PROCESSOR_NAME)
}

/**
 * Creates a live PCM audio capture node backed by AudioWorklet, falling back to
 * ScriptProcessorNode only when AudioWorklet is unavailable (e.g. happy-dom tests).
 */
export async function createPcmCaptureHandle(
  ctx: AudioContext,
  onFrame: (samples: Float32Array) => void,
  fallbackBufferSize = 4096
): Promise<PcmCaptureHandle> {
  const canUseWorklet =
    Boolean(ctx.audioWorklet) &&
    typeof ctx.audioWorklet.addModule === 'function' &&
    typeof AudioWorkletNode === 'function'

  let silentGain: GainNode | null = null
  const attachSilent = (node: AudioNode, audioCtx: AudioContext) => {
    silentGain = audioCtx.createGain()
    silentGain.gain.setValueAtTime(0, audioCtx.currentTime)
    node.connect(silentGain)
    silentGain.connect(audioCtx.destination)
  }
  const detachSilent = () => {
    if (silentGain) {
      try {
        silentGain.disconnect()
      } catch {
        // already disconnected
      }
      silentGain = null
    }
  }

  if (canUseWorklet) {
    const workletNode = await createAudioWorkletNode(ctx)
    workletNode.port.onmessage = (event: MessageEvent<{ type?: string; buffer?: ArrayBuffer }>) => {
      const payload = event.data
      if (payload?.type === 'PCM_FRAME' && payload.buffer instanceof ArrayBuffer) {
        onFrame(new Float32Array(payload.buffer))
      } else if (payload instanceof Float32Array) {
        onFrame(payload)
      }
    }
    return {
      node: workletNode,
      mode: 'worklet',
      connectSilent: (audioCtx: AudioContext) => attachSilent(workletNode, audioCtx),
      disconnect: () => {
        workletNode.port.onmessage = null
        try {
          workletNode.disconnect()
        } catch {
          // already disconnected
        }
        detachSilent()
      },
    }
  }

  const scriptNode = ctx.createScriptProcessor(fallbackBufferSize, 1, 1)
  scriptNode.onaudioprocess = (event) => {
    const channelData = event.inputBuffer.getChannelData(0)
    onFrame(channelData)
  }
  return {
    node: scriptNode,
    mode: 'script-processor',
    connectSilent: (audioCtx: AudioContext) => attachSilent(scriptNode, audioCtx),
    disconnect: () => {
      scriptNode.onaudioprocess = null
      try {
        scriptNode.disconnect()
      } catch {
        // already disconnected
      }
      detachSilent()
    },
  }
}
