/** Manual per-item adjustment layered on top of anatomical placement (from the on-screen d-pad/scale slider). */
export interface UserAdjust {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export const DEFAULT_USER_ADJUST: UserAdjust = { scale: 1, offsetX: 0, offsetY: 0 };
