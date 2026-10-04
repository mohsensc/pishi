import type { DragTarget } from './types'

export const BALL_RADIUS = 11
export const CAT_BODY_LENGTH = 64
export const LAWN_TOP_RATIO = 0.14
export const MIN_VISIBLE_CATS = 6
export const CAT_COUNT = 8
export const BALL_COUNT = 5
export const WORLD_SEED = 20260925

export const LAWN_TOP_MARGIN = 34
export const LAWN_BOTTOM_MARGIN = 14
export const COMPACT_DOCK_WIDTH = 640
export const COMPACT_DOCK_CLEARANCE = 48
export const LAWN_SIDE_MARGIN = 64

export const GRAVITY = 1500
export const BALL_RESTITUTION = 0.56
export const BALL_GROUND_FRICTION = 1.5
export const BALL_AIR_DRAG = 0.05
export const BALL_REST_SPEED = 55
export const BALL_WALL_RESTITUTION = 0.7
export const POND_DRIFT_SPEED = 42
export const POND_DAMPING = 3.2

export const POP_EXTRA_RADIUS = 10
export const POP_PRESSED_BONUS = 7
export const POP_MAX_HEIGHT = 40
export const POP_LIFETIME = 1.2
export const POP_STARTLE_RADIUS = 170

export const MAX_HIDDEN_CATS = 2
export const BALL_RESPAWN_MIN = 2.2
export const BALL_RESPAWN_MAX = 4.5
export const BALL_ARRIVAL_GAP = 0.7
export const LIVELY_WAVE_SECONDS = 80
export const LIVELY_WAVE_AMPLITUDE = 0.08
export const CATCH_EXCITEMENT = 0.12
export const MAX_EXCITEMENT = 0.3
export const EXCITEMENT_DECAY_SECONDS = 7

export const STASH_RETRIEVE_MIN = 6
export const STASH_RETRIEVE_MAX = 9
export const STASH_FORCE_EJECT = 10
export const REGRAB_COOLDOWN = 0.6
export const MAX_CARRY_SECONDS = 11
export const BALL_GRAB_RADIUS = 26
export const MAX_CHASERS_PER_BALL = 2

export const CAT_WALK_RUN_THRESHOLD = 0.5
export const HELD_BALL_LIFT = 16

export const REFERENCE_WIDTH = 1440
export const REFERENCE_HEIGHT = 900
export const POND_ASPECT = 0.62
export const BUTTERFLY_COUNT = 4
export const CAT_TREE_LEVELS = [0.42, 0.72, 1] as const
export const CAT_TREE_PLATFORM_OFFSETS = [-0.62, 0.62, 0] as const

export const EMOTE_LIFETIME = 1.2
export const ACTION_LIFETIME = 1.6
export const EFFECT_LIFETIME = 1.4
export const AGITATION_DECAY = 1.5
export const URGENCY_CHECK_INTERVAL = 0.25
export const CAT_POKE_COOLDOWN = 1.1
export const DAY_LENGTH_SECONDS = 360

export const DRAG_START_DISTANCE = 6
export const DRAG_LIFT: Record<DragTarget, number> = { prop: 26, cat: 38, ball: 30, treat: 24 }
export const MAX_EXTRA_TOYS = 12
export const FOLLOW_DURATION = 10
export const CAT_CARD_DELAY = 0.6
export const TREAT_BAG_SHAKE_LIFETIME = 3
