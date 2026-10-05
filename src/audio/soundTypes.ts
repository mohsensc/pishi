export type SoundName =
  | 'ballPop'
  | 'ballSteal'
  | 'coin'
  | 'purchase'
  | 'denied'
  | 'treeChop'
  | 'treeFall'
  | 'pathGravel'
  | 'pathStone'
  | 'pathErase'
  | 'placeDrop'
  | 'propBump'
  | 'trash'
  | 'splash'
  | 'drip'
  | 'lap'
  | 'munch'
  | 'purr'
  | 'trill'
  | 'gulp'
  | 'shake'
  | 'request'
  | 'yawn'
  | 'grumpy'
  | 'collar'
  | 'nameConfirm'
  | 'nameTag'
  | 'unlock'
  | 'tierUp'
  | 'uiTap'
  | 'flutter'
  | 'rustle'
  | 'bubbles'

export interface SoundCue {
  pan: number
  gain: number
  pitch: number
  intensity: number
  delay: number
  step: number
}

export type SoundEmitter = (name: SoundName, cue?: Partial<SoundCue>) => void

export const neutralCue: SoundCue = { pan: 0, gain: 1, pitch: 1, intensity: 1, delay: 0, step: 0 }
