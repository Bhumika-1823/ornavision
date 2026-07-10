import { FaceTracker } from './FaceTracker';
import { HandTracker } from './HandTracker';
import { PoseTracker } from './PoseTracker';
import { LandmarkSmoother, ScalarSmootherBundle } from '../smoothing/LandmarkSmoother';
import {
  estimateHeadPose,
  faceWidthPx as calcFaceWidthPx,
  eyeDistancePx as calcEyeDistancePx,
  toPx,
  FACE_IDX,
} from './FacePoseEstimator';
import { HandEstimator } from './HandEstimator';
import { WristEstimator } from './WristEstimator';
import { NeckEstimator } from './NeckEstimator';
import { bodyScaleReference } from './ScaleEstimator';
import {
  BodyState,
  EMPTY_LIGHTING,
  FaceState,
  FingerState,
  FrameState,
  HandState,
  Point3D,
} from '../types';

const HAND_IDX = {
  wrist: 0,
  thumb: { mcp: 2, pip: 3, tip: 4 },
  index: { mcp: 5, pip: 6, tip: 8 },
  middle: { mcp: 9, pip: 10, tip: 12 },
  ring: { mcp: 13, pip: 14, tip: 16 },
  pinky: { mcp: 17, pip: 18, tip: 20 },
};

export interface TrackingNeeds {
  face: boolean;
  hands: boolean;
  body: boolean;
}

/**
 * TrackingManager is the single source of truth for "what does the camera
 * see right now". It owns all MediaPipe model instances and smoothing
 * state, and exposes only a clean FrameState to the rest of the engine.
 */
export class TrackingManager {
  private faceTracker = new FaceTracker();
  private handTracker = new HandTracker();
  private poseTracker = new PoseTracker();

  private faceLandmarkSmoother = new LandmarkSmoother({ minCutoff: 1.4, beta: 0.025, dCutoff: 1.0 });
  private faceScalars = new ScalarSmootherBundle();
  private handLandmarkSmoothers = new Map<string, LandmarkSmoother>();
  private poseLandmarkSmoother = new LandmarkSmoother({ minCutoff: 1.0, beta: 0.015, dCutoff: 1.0 });

  private loaded = { face: false, hands: false, body: false };
  private frameIndex = 0;

  private loadPromises = {
    face: null as Promise<void> | null,
    hands: null as Promise<void> | null,
    body: null as Promise<void> | null,
  };

  loadFace(): Promise<void> {
    if (this.loaded.face) return Promise.resolve();
    if (!this.loadPromises.face) {
      this.loadPromises.face = this.faceTracker.load().then(() => {
        this.loaded.face = true;
      });
    }
    return this.loadPromises.face;
  }

  loadHands(): Promise<void> {
    if (this.loaded.hands) return Promise.resolve();
    if (!this.loadPromises.hands) {
      this.loadPromises.hands = this.handTracker.load().then(() => {
        this.loaded.hands = true;
      });
    }
    return this.loadPromises.hands;
  }

  loadBody(): Promise<void> {
    if (this.loaded.body) return Promise.resolve();
    if (!this.loadPromises.body) {
      this.loadPromises.body = this.poseTracker.load().then(() => {
        this.loaded.body = true;
      });
    }
    return this.loadPromises.body;
  }

  isFaceReady(): boolean {
    return this.faceTracker.isReady();
  }
  isHandsReady(): boolean {
    return this.handTracker.isReady();
  }
  isBodyReady(): boolean {
    return this.poseTracker.isReady();
  }

  /** Send the current source image to whichever trackers are needed this frame. */
  async process(image: HTMLVideoElement | HTMLImageElement, needs: TrackingNeeds): Promise<void> {
    const jobs: Promise<void>[] = [];
    if (needs.face && this.faceTracker.isReady()) jobs.push(this.faceTracker.send(image));
    if (needs.hands && this.handTracker.isReady()) jobs.push(this.handTracker.send(image));
    if (needs.body && this.poseTracker.isReady()) jobs.push(this.poseTracker.send(image));
    await Promise.all(jobs);
  }

  /** Build the smoothed FrameState from whatever the trackers most recently produced. */
  buildFrameState(width: number, height: number): FrameState {
    const t = performance.now() / 1000;
    this.frameIndex += 1;

    const face = this.buildFaceState(width, height, t);
    const hands = this.buildHandState(width, height, t);
    const body = this.buildBodyState(width, height, t, face?.faceWidthPx ?? null);
    
    const wrists = hands.map(h => WristEstimator.estimate(h, body));

    const partialFrame = {
      frameIndex: this.frameIndex,
      timestamp: t,
      width,
      height,
      face,
      hands,
      wrists,
      body,
      lighting: EMPTY_LIGHTING,
    };
    
    const neckMetrics = NeckEstimator.estimate(partialFrame) || undefined;

    return {
      ...partialFrame,
      neckMetrics,
    };
  }

  private buildFaceState(width: number, height: number, t: number): FaceState | null {
    const results = this.faceTracker.getLatest();
    const rawLandmarks: Point3D[] | undefined = results?.multiFaceLandmarks?.[0];
    if (!rawLandmarks) {
      this.faceLandmarkSmoother.notifyMissing();
      return null;
    }

    const smoothed = this.faceLandmarkSmoother.smooth(rawLandmarks, t);
    const pose = estimateHeadPose(smoothed, width, height);
    const roll = this.faceScalars.roll.update(pose.roll);
    const yaw = this.faceScalars.yaw.update(pose.yaw);
    const pitch = this.faceScalars.pitch.update(pose.pitch);

    const rawFaceWidth = calcFaceWidthPx(smoothed, width);
    const faceWidthPxVal = this.faceScalars.scale.update(rawFaceWidth);
    const eyeDistancePxVal = this.faceScalars.distance.update(calcEyeDistancePx(smoothed, width, height));

    const faceLeft = toPx(smoothed[FACE_IDX.faceLeft], width, height);
    const faceRight = toPx(smoothed[FACE_IDX.faceRight], width, height);
    const chin = toPx(smoothed[FACE_IDX.chin], width, height);
    const forehead = toPx(smoothed[FACE_IDX.foreheadCenter], width, height);
    const noseTip = toPx(smoothed[FACE_IDX.noseTip], width, height);
    const leftNostril = toPx(smoothed[FACE_IDX.leftNostril], width, height);
    const rightNostril = toPx(smoothed[FACE_IDX.rightNostril], width, height);

    // MediaPipe FaceMesh ear lobe landmarks:
    // 177 = left ear lobe (viewer's right side), 401 = right ear lobe (viewer's left side)
    // These are the true lobe attachment points for earrings, not the cheekbone edges (234/454).
    const leftEarLobe = toPx(smoothed[177], width, height);
    const rightEarLobe = toPx(smoothed[401], width, height);

    return {
      present: true,
      confidence: 1,
      landmarks: smoothed,
      pose: { roll, yaw, pitch },
      faceWidthPx: faceWidthPxVal,
      eyeDistancePx: eyeDistancePxVal,
      center: { x: (faceLeft.x + faceRight.x) / 2, y: (faceLeft.y + faceRight.y) / 2 },
      jaw: chin,
      // 0% offset — anchored exactly at the chin line
      neckAnchor: { x: (faceLeft.x + faceRight.x) / 2, y: chin.y },
      // Use true earlobe landmarks (177/401) for earring attachment, not cheekbone edges
      leftEar: leftEarLobe,
      rightEar: rightEarLobe,
      foreheadCenter: forehead,
      noseTip,
      leftNostril,
      rightNostril,
    };
  }

  private buildHandState(width: number, height: number, t: number): HandState[] {
    const results = this.handTracker.getLatest();
    const rawHandsList: Point3D[][] | undefined = results?.multiHandLandmarks;
    const handedness: any[] | undefined = results?.multiHandedness;

    if (!rawHandsList || rawHandsList.length === 0) {
      // Notify all existing smoothers that hands were missed this frame.
      this.handLandmarkSmoothers.forEach((s) => s.notifyMissing());
      return [];
    }

    const out: HandState[] = [];
    rawHandsList.forEach((rawLandmarks, i) => {
      const label: 'Left' | 'Right' | 'Unknown' = handedness?.[i]?.label ?? 'Unknown';
      const smootherKey = `${i}`;
      let smoother = this.handLandmarkSmoothers.get(smootherKey);
      if (!smoother) {
        smoother = new LandmarkSmoother({ minCutoff: 1.5, beta: 0.03, dCutoff: 1.0 });
        this.handLandmarkSmoothers.set(smootherKey, smoother);
      }
      const smoothed = smoother.smooth(rawLandmarks, t);

      const wrist = toPx(smoothed[HAND_IDX.wrist], width, height);
      const iMcp3D = smoothed[HAND_IDX.index.mcp];
      const pMcp3D = smoothed[HAND_IDX.pinky.mcp];
      const wrist3D = smoothed[HAND_IDX.wrist];

      const palmNormal = HandEstimator.computePalmNormal(iMcp3D, pMcp3D, wrist3D, label);
      const palmCenter = {
        x: (iMcp3D.x + pMcp3D.x + wrist3D.x) / 3,
        y: (iMcp3D.y + pMcp3D.y + wrist3D.y) / 3,
        z: (iMcp3D.z + pMcp3D.z + wrist3D.z) / 3
      };

      // We determine global hand visibility (e.g. rolled completely away)
      // If normal.z is heavily negative, the back of the hand is facing the camera.
      // But actually, we let individual fingers handle occlusion.
      const isHandRolledAway = palmNormal.z < -0.5;

      const fingers: HandState['fingers'] = {
        thumb: this.buildFinger(smoothed, HAND_IDX.thumb, width, height, palmNormal, isHandRolledAway),
        index: this.buildFinger(smoothed, HAND_IDX.index, width, height, palmNormal, isHandRolledAway),
        middle: this.buildFinger(smoothed, HAND_IDX.middle, width, height, palmNormal, isHandRolledAway),
        ring: this.buildFinger(smoothed, HAND_IDX.ring, width, height, palmNormal, isHandRolledAway),
        pinky: this.buildFinger(smoothed, HAND_IDX.pinky, width, height, palmNormal, isHandRolledAway),
      };

      const iMcp = toPx(iMcp3D, width, height);
      const pMcp = toPx(pMcp3D, width, height);
      const palmWidthPx = Math.hypot(iMcp.x - pMcp.x, iMcp.y - pMcp.y);
      const wristAngle = Math.atan2(
        (iMcp.y + pMcp.y) / 2 - wrist.y,
        (iMcp.x + pMcp.x) / 2 - wrist.x
      );

      out.push({
        present: true,
        confidence: 1,
        handedness: label,
        landmarks: smoothed,
        wrist,
        wristAngle,
        palmNormal,
        palmCenter,
        fingers,
        palmWidthPx,
      });
    });

    return out;
  }

  private buildFinger(
    landmarks: Point3D[],
    idx: { mcp: number; pip: number; tip: number },
    width: number,
    height: number,
    palmNormal: Point3D,
    isHandRolledAway: boolean
  ): FingerState {
    const mcp3D = landmarks[idx.mcp];
    const pip3D = landmarks[idx.pip];
    const tip3D = landmarks[idx.tip];
    
    const mcp = toPx(mcp3D, width, height);
    const pip = toPx(pip3D, width, height);
    const tip = toPx(tip3D, width, height);
    const widthPx = Math.hypot(mcp.x - pip.x, mcp.y - pip.y);
    const angle = Math.atan2(pip.y - mcp.y, pip.x - mcp.x) - Math.PI / 2;
    
    const curlAngle = HandEstimator.computeFingerCurl(mcp3D, pip3D, tip3D);
    
    // Heuristic: If finger is heavily curled (> 1.2 rad) it usually points into palm, occluding rings.
    // Or if the hand is rolled away, the back of hand might hide rings on the inner finger (though rings go all around,
    // usually we hide the front of the ring). We just set isVisible based on curl for now.
    const isVisible = curlAngle < 1.2;

    return { 
      mcp3D, pip3D, tip3D,
      mcp, pip, tip, 
      widthPx, angle,
      curlAngle,
      isVisible
    };
  }

  private buildBodyState(
    width: number,
    height: number,
    t: number,
    faceWidthHint: number | null
  ): BodyState | null {
    const results = this.poseTracker.getLatest();
    const raw: Point3D[] | undefined = results?.poseLandmarks;
    if (!raw) {
      this.poseLandmarkSmoother.notifyMissing();
      return null;
    }
    const smoothed = this.poseLandmarkSmoother.smooth(raw, t);
    // Pose landmark indices: 11 = left shoulder, 12 = right shoulder (mirrored in image space).
    const leftShoulder = toPx(smoothed[11], width, height);
    const rightShoulder = toPx(smoothed[12], width, height);
    
    // Elbow indices: 13 = left elbow, 14 = right elbow
    const leftElbow = smoothed[13] ? toPx(smoothed[13], width, height) : undefined;
    const rightElbow = smoothed[14] ? toPx(smoothed[14], width, height) : undefined;

    const shoulderWidthPx = Math.hypot(leftShoulder.x - rightShoulder.x, leftShoulder.y - rightShoulder.y);
    const bodyRotation = Math.atan2(rightShoulder.y - leftShoulder.y, rightShoulder.x - leftShoulder.x);

    void bodyScaleReference(faceWidthHint ?? shoulderWidthPx / 2.8, shoulderWidthPx);

    return {
      present: true,
      confidence: 1,
      leftShoulder,
      rightShoulder,
      leftElbow,
      rightElbow,
      shoulderWidthPx,
      bodyRotation,
      chestCenter: {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (leftShoulder.y + rightShoulder.y) / 2 + shoulderWidthPx * 0.35,
      },
    };
  }

  reset(): void {
    this.faceLandmarkSmoother.notifyMissing();
    this.faceScalars.reset();
    this.handLandmarkSmoothers.forEach((s) => s.notifyMissing());
    this.poseLandmarkSmoother.notifyMissing();
  }
}
