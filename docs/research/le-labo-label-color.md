# Le Labo fragrance-label cream

Researched 2026-10-04. Target: the cream paper label on the eau de parfum bottle, excluding the perfume, glass, cap, and kraft carton. Research only; no Anaphor tokens were changed.

## Finding

**There is no verified official label-paper HEX in the public sources located in this investigation.** Searches for Le Labo label color, Pantone, CIELAB, paper stock, and supplier specifications did not locate a brand or manufacturer specification. The official product pages provide photographs and label personalization, but no substrate color values. Le Labo's [Responsible Practices](https://www.lelabofragrances.com/responsible-practices), [Our Impact](https://www.lelabofragrances.com/our-impact), and its owner's [FY2024 sustainability report, printed page 19](https://media.elcompanies.com/files/e/estee-lauder-companies/global/our-impact/si-s24/sis-2024.pdf#page=18) do not establish a color specification; the latter discusses personalized labels and reusable glass bottles. This is a bounded search finding, not proof that an internal specification does not exist.

The reproducible **photographic approximation is `#D9D7CD`**, sRGB `rgb(217 215 205)`, approximately `oklch(0.8780 0.0137 97.46)`. It represents illuminated blank paper regions in four current official bottle photographs. It is a subdued, slightly yellow cream with some gray, rather than a strongly yellow ivory. It is **not a measured physical-paper color**, and the digits should not be read as substrate accuracy. Sources: [Santal 33 product page](https://www.lelabofragrances.com/santal-33-147.html), [Rose 31 product page](https://www.lelabofragrances.com/rose-31-146.html), and [Another 13 product page](https://www.lelabofragrances.com/another-13-463.html).

For an Anaphor light-theme study with the existing orange focus token, **`#E8E6DC` is the more suitable starting canvas**: `rgb(232 230 220)`, approximately `oklch(0.9237 0.0135 97.45)`. This is an explicit design adaptation that raises lightness while keeping nearly the sampled hue and chroma. It is not an additional Le Labo measurement. Its focus contrast is 3.14:1, whereas the literal photographic approximation gives only 2.72:1. Neither choice alone establishes WCAG conformity; contrast belongs to a foreground/background pair and the rendered component.

## Evidence and sampling

The image URLs below were resolved from Le Labo's product-page HTML, so their provenance is the brand's website even though the assets are hosted on `lelabo.ips.photos`. All four bottle assets were visually inspected before sampling. Each is a 1200 × 1200 RGB JPEG with an embedded **sRGB IEC61966-2.1 ICC profile** and no EXIF capture metadata. No ICC conversion, white balancing, exposure correction, resampling, or image editing was applied. Decoded channel values are used in their declared sRGB space. CSS HEX/RGB notation likewise uses sRGB; see [CSS Color 4: sRGB colors](https://www.w3.org/TR/css-color-4/#sRGB).

The photographs have pronounced light from the left and dark shadow on the right. The blank top strips on the illuminated left portion provide the primary estimate. The regions stay inside the paper and above the large fragrance-name ink; they exclude the curved paper edge, glass glare, liquid, and carton. A second narrow blank column between the personalization keys and values checks the effect of moving farther from the illumination. The paper is attached to a cylindrical bottle: these are locally blank regions, not physically flat samples under uniform illumination.

Coordinates are original-image pixels, zero-based `(left, top, right, bottom)`, with right/bottom excluded. Each RGB result is the per-channel median of all decoded pixels inside its rectangle. Values and HEX are our calculations from the linked assets, not brand-published color codes.

| Official image | Illuminated top-strip region | RGB median | HEX | Second blank-column region | RGB median |
| --- | --- | --- | --- | --- | --- |
| [Santal 33, 50 ml](https://lelabo.ips.photos/lelabo-java/images/skus/050PS33100__PRODUCT_01--IMG_1200--SANTAL33-200129705.jpg) | `(501,759,518,766)` | `218,215,205` | `#DAD7CD` | `(539,866,549,916)` | `210,208,197` |
| [Santal 33, 100 ml](https://lelabo.ips.photos/lelabo-java/images/skus/100PS33100__PRODUCT_01--IMG_1200--SANTAL33-883562345.jpg) | `(486,727,516,733)` | `224,224,213` | `#E0E0D5` | `(516,830,530,877)` | `215,213,201` |
| [Rose 31, 50 ml](https://lelabo.ips.photos/lelabo-java/images/skus/050PR31100__PRODUCT_01--IMG_1200--ROSE31-421446428.jpg) | `(501,759,518,765)` | `214,214,203` | `#D6D6CB` | `(539,866,549,914)` | `206,206,194` |
| [Another 13, 50 ml](https://lelabo.ips.photos/lelabo-java/images/skus/050PA13100__PRODUCT_01--IMG_1200--ANOTHER13--122019503.jpg) | `(501,761,518,767)` | `216,214,205` | `#D8D6CD` | `(539,870,549,918)` | `209,206,195` |

Taking an equally weighted per-channel median across the four **top-strip** medians gives `(217,214.5,205)`. Rounding half up to 8-bit channels gives `(217,215,205)`, hence `#D9D7CD`. The top-strip medians range from R 214–224, G 214–224, B 203–213. That is an observed sample range under this photography, not a confidence interval for the material. Within the top strips, the per-channel 10th–90th-percentile bounds across all four images extend approximately from `(209,209,198)` to `(227,227,218)`; texture, illumination, and JPEG encoding contribute variation.

The blank-column medians are visibly darker than the top-strip medians. In Santal 33 50 ml, the blank top strip on the right at `(686,759,700,766)` has median `(44,40,28)` even though it is also label paper. This large difference is why averaging the whole label or sampling a single arbitrary point would mostly measure the lighting.

The four product photographs share almost the same composition, lighting, and background. Their agreement is evidence about the website's presentation, not four independent calibrated measurements of different paper batches. They may share retouching or a production template; that cannot be verified from their metadata.

An additional [official Another 13 still life](https://lelabo.ips.photos/lelabo-java/images/content/430_SMALL_IMAGE_01_7427_-765998007.jpg), linked from [Our Creations](https://www.lelabofragrances.com/our-creations.html), was inspected for a different lighting setup. It is a 2000 × 877 untagged JPEG with a very small bottle label. The imagery supports a warm, low-chroma appearance, but its label has too few clear blank pixels and a different exposure to improve the primary estimate. It is excluded from the numeric aggregate. Untagged sRGB would be an assumption, rather than an embedded profile fact.

## Accuracy limits

- The sampled photographs have **gray backgrounds, not a calibrated white reference**. Neither the background, cap highlight, glass glare, nor white flowers in the still life supplies known reference reflectance. A clipped white background or specular highlight would also be unusable for recovering white balance or exposure. No normalization against these features was attempted.
- An sRGB ICC tag describes interpretation of encoded pixels. It does not certify the illuminant, camera calibration, exposure, tone curve, retouching, or correspondence to physical paper.
- These estimates preserve the photographed appearance. They cannot disentangle material reflectance from lighting, local shadow, color grading, texture, or bottle curvature. They also cannot establish a Pantone number, CIELAB substrate measurement, supplier, stock name, or batch consistency.
- Generic cream-label manufacturers and unrelated cream Pantone swatches were not treated as Le Labo evidence: no first-party link establishing a supplier or color match was found.
- The way to obtain a materially more accurate result is a brand-supplied substrate specification or a physical label measured with a calibrated spectrophotometer under a documented illuminant/observer/measurement condition. A photograph with a color target and controlled light would improve an estimate, but still would not be a brand specification.

Reliability: **high for source provenance and reproducibility of these pixel statistics; moderate for the current official photographed appearance; low for the true physical-paper color**. There is no defensible numerical tolerance for the physical match from the available evidence.

## Anaphor and WCAG 2.2

Anaphor targets WCAG 2.2 AA in [PRODUCT.md](../../PRODUCT.md) and keeps runtime color values in [styles.css](../../packages/design-system/src/styles.css). [DESIGN.md](../../DESIGN.md) reserves orange for action/focus and Crimson for danger. The light-theme canvas at the time of this research is `oklch(0.985 0.008 85)`, approximately `#FDFAF4`; its raised neutral is `oklch(0.95 0.012 85)`, approximately `#F2EEE6`. The sampled Le Labo appearance is darker and slightly less orange in hue than the current canvas.

WCAG AA requires at least **4.5:1 for ordinary text** and **3:1 for qualifying large text** ([SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)). Required visual information identifying controls/states needs **3:1 against adjacent colors**, subject to the criterion's exceptions ([SC 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)). Focus must also be visible and meet AA's obscuring requirements; passing a color ratio is not sufficient ([SC 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)). The more specific focus-area requirement in [SC 2.4.13](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) is **AAA**, not an additional AA requirement.

The following ratios were calculated against opaque, uniform sRGB candidate canvases. Runtime OKLCH token values were converted to sRGB without rounding before calculating relative luminance. Shown HEX values are rounded conveniences. These are token-pair calculations, not an end-to-end accessibility audit.

| Existing light-theme role | Exact OKLCH | Approximate HEX | Photographic `#D9D7CD` | Adaptation `#E8E6DC` | Lighter adaptation `#F2F0E7` |
| --- | --- | --- | ---: | ---: | ---: |
| Primary text / `font-secondary` | `0.2 0.01 50` | `#1A1512` | 12.56:1 | 14.49:1 | 15.88:1 |
| Muted text / `font-tertiary` | `0.46 0.014 65` | `#5E5750` | 4.95:1 | 5.71:1 | 6.26:1 |
| Focus | `0.618 0.161 39.44` | `#D35C31` | **2.72:1** | 3.14:1 | 3.44:1 |
| Brand/action orange | `0.6217 0.185 39.44` | `#DE531A` | **2.71:1** | 3.13:1 | 3.43:1 |
| Danger fill | `0.4852 0.1691 10.14` | `#A82249` | 4.87:1 | 5.61:1 | 6.15:1 |
| Danger text | `0.4236 0.1691 10.14` | `#930038` | 6.34:1 | 7.31:1 | 8.01:1 |
| Input border | `0.82 0.016 85` | `#C9C4B9` | **1.21:1** | **1.40:1** | **1.53:1** |
| Raised neutral / `foreground` | `0.95 0.012 85` | `#F2EEE6` | 1.25:1 | 1.08:1 | 1.01:1 |

Body/Prose reading text uses primary text at 90% alpha. Composited over these canvases in sRGB, its contrast is respectively **10.07:1, 11.39:1, and 12.31:1**. The calculation uses `rendered = 0.9 × text + 0.1 × canvas` before relative luminance; it does not treat the uncomposited token as the visible color.

Implications for a future study:

- `#D9D7CD` supports existing primary, muted, and danger text. Existing orange focus on this canvas falls below the 3:1 non-text threshold. Keeping this darker canvas would require a revised focus treatment and checks against every adjacent surface.
- `#E8E6DC` preserves those text pairs and clears 3:1 for the current focus. The 3.14:1 margin is modest; composited, tinted, raised, hover, and selected surfaces still need their own checks.
- Orange used as ordinary 12–16 px text does **not** reach 4.5:1 on any of these canvases. Orange control fills and focus indicators have different requirements from text. An existing visual exception does not change a WCAG threshold.
- The current input-border color does not reach 3:1 on these candidates. If that border is necessary to identify a control, another conforming visual treatment is needed. Purely decorative separators are a different case under SC 1.4.11.
- The existing raised neutral has little contrast with the brighter adaptations. Surface ordering and essential control identification should be examined in real compositions before replacing only the canvas token; card separation is not automatically required to be 3:1 when it is decorative.

For clarity, `#F2F0E7` is `rgb(242 240 231)`, approximately `oklch(0.9542 0.0121 96.42)`. Like `#E8E6DC`, it is a deliberate lighter adaptation, not a physical-paper estimate.

Contrast uses the WCAG sRGB transfer function (`c / 12.92` for `c ≤ 0.04045`; otherwise `((c + 0.055) / 1.055)^2.4`), luminance `0.2126R + 0.7152G + 0.0722B`, and `(lighter + 0.05) / (darker + 0.05)`. See the definitions in [WCAG 2.2](https://www.w3.org/TR/WCAG22/#dfn-relative-luminance).

## Reproduction record

Only this Markdown report is saved in the repository. Research downloads were temporary. Future asset replacements can change pixel results, so the SHA-256 hashes of the inspected originals are recorded here:

| Asset | SHA-256 |
| --- | --- |
| Santal 33 50 ml | `ee9c6f7043a68245462e2883d279da6772d068f62a7ee567117154db8a0dd17a` |
| Santal 33 100 ml | `159cd2227e256dcc7ff076a614bbc9aed575c98afea874e4c9e33e63e064576b` |
| Rose 31 50 ml | `71bf5307dc3524e8be0f092ca759183bfeb236d7b580972b5a5c7871293df5ce` |
| Another 13 50 ml | `3629fb752bad9f0b09e31b921484b31b7746714511359dc650f6a7214715fcde` |
| Another 13 still life | `485cc5d86dd28480ca3636c917fac4ca36876a44bf577c5af5440e6c12b2062e` |

With the four linked originals saved under these local names, this Python snippet reproduces the primary estimate using Pillow and NumPy:

```python
from PIL import Image, ImageCms
import io
import numpy as np

samples = [
    ("santal50.jpg", (501, 759, 518, 766)),
    ("santal100.jpg", (486, 727, 516, 733)),
    ("rose50.jpg", (501, 759, 518, 765)),
    ("another50.jpg", (501, 761, 518, 767)),
]
medians = []
for path, box in samples:
    image = Image.open(path)
    profile = ImageCms.ImageCmsProfile(io.BytesIO(image.info["icc_profile"]))
    print(path, ImageCms.getProfileDescription(profile).strip())
    pixels = np.asarray(image.convert("RGB"))
    left, top, right, bottom = box
    patch = pixels[top:bottom, left:right].reshape(-1, 3)
    median = np.median(patch, axis=0)
    medians.append(median)
    print(box, median)
rgb = np.floor(np.median(medians, axis=0) + 0.5).astype(int)
print(rgb, "#" + "".join(f"{channel:02X}" for channel in rgb))
# [217 215 205] #D9D7CD
```
