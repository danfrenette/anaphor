import { expect, type Locator, type Page } from "@playwright/test";

type AnimatedProperty = "clip-path" | "opacity" | "transform";
type AnimationTiming = {
  property: AnimatedProperty;
  duration: number;
  delay: number;
};

// Hold finite Web Animations at their start so assertions can seek through the
// real browser interpolation without racing the runner's frame rate.
export async function holdAnimations(page: Page) {
  await page.addInitScript(() => {
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const animation = animate.apply(this, args);
      const effect = animation.effect;
      if (effect) {
        const timing = effect.getTiming();
        if (timing.iterations === Infinity || Number(timing.duration) <= 0) return animation;
        // A library can set startTime after animate(), which resumes a paused
        // animation. A zero playback rate keeps that restart deterministic too.
        animation.playbackRate = 0;
        animation.pause();
      }
      return animation;
    };
  });
}

export async function seekAnimations(locator: Locator, progress: number) {
  await locator.evaluate(() => new Promise(requestAnimationFrame));
  await expect.poll(() => locator.evaluate(element => element.getAnimations({ subtree: true })
    .filter(animation => animation.effect?.getTiming().iterations !== Infinity).length)).toBeGreaterThan(0);
  return locator.evaluate((element, fraction) => {
    if (fraction < 0 || fraction > 1) throw new Error("Animation progress must be between 0 and 1");
    const records: Array<{ animation: Animation; delay: number; duration: number }> = [];
    for (const animation of element.getAnimations({ subtree: true })) {
      const effect = animation.effect;
      if (!effect) continue;
      const timing = effect.getTiming();
      if (timing.iterations === Infinity) continue;
      records.push({
        animation,
        delay: Number(timing.delay),
        duration: Number(timing.duration),
      });
    }
    for (const { animation, delay, duration } of records) {
      animation.pause();
      animation.currentTime = delay + duration * fraction;
      if (fraction === 1) {
        animation.playbackRate = 1;
        animation.finish();
      }
    }
    return records.map(({ duration }) => duration);
  }, progress);
}

export async function readAnimationTimings(locator: Locator) {
  return locator.evaluate(element => new Promise<AnimationTiming[]>((resolve) => {
    requestAnimationFrame(() => {
      const timings: AnimationTiming[] = [];
      for (const animation of element.getAnimations()) {
        const effect = animation.effect;
        if (!(effect instanceof KeyframeEffect)) throw new Error("Expected a keyframe effect");
        const keyframes = effect.getKeyframes();
        if (keyframes.length === 0) throw new Error("Expected at least one animation keyframe");
        let property: AnimatedProperty;
        if (keyframes.some(keyframe => "opacity" in keyframe)) property = "opacity";
        else if (keyframes.some(keyframe => "transform" in keyframe)) property = "transform";
        else if (keyframes.some(keyframe => "clipPath" in keyframe)) property = "clip-path";
        else throw new Error("Expected an opacity, transform, or clip-path animation");
        const timing = effect.getTiming();
        timings.push({
          property,
          duration: Number(timing.duration),
          delay: Number(timing.delay),
        });
      }
      resolve(timings);
    });
  }));
}
