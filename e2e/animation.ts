import { expect, type Locator, type Page } from "@playwright/test";

// Hold finite Web Animations at their start so assertions can seek through the
// real browser interpolation without racing the runner's frame rate.
export async function holdAnimations(page: Page) {
  await page.addInitScript(() => {
    const play = Animation.prototype.play;
    Animation.prototype.play = function () {
      play.call(this);
      if (this.effect?.getTiming().iterations !== Infinity && Number(this.effect?.getTiming().duration) > 0) this.pause();
    };
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const animation = animate.apply(this, args);
      if (animation.effect?.getTiming().iterations !== Infinity && Number(animation.effect?.getTiming().duration) > 0) animation.pause();
      return animation;
    };
  });
}

export async function seekAnimations(locator: Locator, progress: number) {
  await locator.evaluate(() => new Promise(requestAnimationFrame));
  await expect.poll(() => locator.evaluate(element => element.getAnimations({ subtree: true })
    .filter(animation => animation.effect?.getTiming().iterations !== Infinity).length)).toBeGreaterThan(0);
  return locator.evaluate((element, fraction) => {
    const animations = element.getAnimations({ subtree: true })
      .filter(animation => animation.effect?.getTiming().iterations !== Infinity);
    const durations = animations.map(animation => Number(animation.effect!.getTiming().duration));
    animations.forEach((animation, index) => {
      animation.pause();
      animation.currentTime = durations[index]! * fraction;
      if (fraction === 1) animation.finish();
    });
    return durations;
  }, progress);
}
