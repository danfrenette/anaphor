"use client";

// Adapted from DialKit 2.0.2 (MIT). See ../licenses/dialkit.txt.
import { handleSliderKey, decimalsForStep, roundValue, snapToDecile, magneticStep } from "#lib/slider-utils";
import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useReducedMotion, animate } from 'motion/react';

export interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  snap?: "standard" | "magnetic";
  releaseThreshold?: number;
}

const CLICK_THRESHOLD = 3;
const DEAD_ZONE = 32;
const MAX_CURSOR_RANGE = 200;
const MAX_STRETCH = 8;

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  unit,
  snap = "standard",
  releaseThreshold = 0.6,
}: SliderProps) {
  const reduceMotion = useReducedMotion();
  const magneticValue = useRef(value);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editingEnded = useRef(false);
  const labelRef = useRef<HTMLSpanElement>(null);
  const valueSpanRef = useRef<HTMLSpanElement>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isValueHovered, setIsValueHovered] = useState(false);
  const [isValueEditable, setIsValueEditable] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Click-vs-drag detection refs
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const isClickRef = useRef(true);
  const animateNextValue = useRef(false);
  const animRef = useRef<ReturnType<typeof animate> | null>(null);
  const wrapperRectRef = useRef<DOMRect | null>(null);
  const scaleRef = useRef(1);

  const percentage = ((value - min) / (max - min)) * 100;
  const isActive = isInteracting || isHovered;

  // Motion values for imperative animation
  const fillPercent = useMotionValue(percentage);
  const fillTransform = useTransform(fillPercent, (pct) => `scaleX(${Math.max(0, pct / 100)})`);
  const handleTransform = useTransform(fillPercent, (pct) =>
    `translateX(max(5px, calc(${pct}% - 9px)))`
  );

  // Rubber band motion values
  const rubberStretchPx = useMotionValue(0);
  const rubberBandWidth = useTransform(
    rubberStretchPx,
    (stretch) => `calc(100% + ${Math.abs(stretch)}px)`
  );
  const rubberBandX = useTransform(
    rubberStretchPx,
    (stretch) => (stretch < 0 ? stretch : 0)
  );

  useEffect(() => {
    if (isInteracting) return;
    const shouldAnimate = animateNextValue.current || animRef.current !== null;
    animateNextValue.current = false;
    animRef.current?.stop();
    animRef.current = null;
    if (shouldAnimate && !reduceMotion) {
      animRef.current = animate(fillPercent, percentage, {
        type: 'spring',
        stiffness: 300,
        damping: 25,
        mass: 0.8,
        onComplete: () => { animRef.current = null; },
      });
    } else {
      fillPercent.jump(percentage);
    }
  }, [percentage, isInteracting, fillPercent, reduceMotion]);

  const positionToValue = useCallback(
    (clientX: number) => {
      const rect = wrapperRectRef.current;
      if (!rect) return value;
      const screenX = clientX - rect.left;
      const sceneX = screenX / scaleRef.current;
      const nativeWidth = wrapperRef.current ? wrapperRef.current.offsetWidth : rect.width;
      const percent = Math.max(0, Math.min(1, sceneX / nativeWidth));
      const rawValue = min + percent * (max - min);
      return Math.max(min, Math.min(max, rawValue));
    },
    [min, max, value]
  );

  const percentFromValue = useCallback(
    (v: number) => ((v - min) / (max - min)) * 100,
    [min, max]
  );

  const computeRubberStretch = useCallback(
    (clientX: number, sign: number) => {
      const rect = wrapperRectRef.current;
      if (!rect) return 0;
      const distancePast =
        sign < 0 ? rect.left - clientX : clientX - rect.right;
      const overflow = Math.max(0, distancePast - DEAD_ZONE);
      return (
        sign *
        MAX_STRETCH *
        Math.sqrt(Math.min(overflow / MAX_CURSOR_RANGE, 1.0))
      );
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (showInput || e.button !== 0) return;
      e.preventDefault();
      e.currentTarget.focus({ preventScroll: true });
      e.currentTarget.setPointerCapture(e.pointerId);
      pointerDownPos.current = { x: e.clientX, y: e.clientY };
      magneticValue.current = value;
      isClickRef.current = true;
      setIsInteracting(true);

      // Capture wrapper rect at pointer down for stable reference
      if (wrapperRef.current) {
        wrapperRectRef.current = wrapperRef.current.getBoundingClientRect();
        const nativeWidth = wrapperRef.current.offsetWidth;
        scaleRef.current = wrapperRectRef.current.width / nativeWidth;
      }
    },
    [showInput, value]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isInteracting || !pointerDownPos.current) return;

      const dx = e.clientX - pointerDownPos.current.x;
      const dy = e.clientY - pointerDownPos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (isClickRef.current && distance > CLICK_THRESHOLD) {
        isClickRef.current = false;
        setIsDragging(true);
      }

      if (!isClickRef.current) {
        // Drag mode — instant update
        const rect = wrapperRectRef.current;
        if (rect && !reduceMotion) {
          if (e.clientX < rect.left) {
            rubberStretchPx.jump(computeRubberStretch(e.clientX, -1));
          } else if (e.clientX > rect.right) {
            rubberStretchPx.jump(computeRubberStretch(e.clientX, 1));
          } else {
            rubberStretchPx.jump(0);
          }
        }

        const rawValue = positionToValue(e.clientX);
        const newValue = snap === "magnetic"
          ? magneticStep(rawValue, magneticValue.current, min, max, step, releaseThreshold)
          : rawValue;
        magneticValue.current = newValue;
        const newPct = percentFromValue(newValue);
        if (animRef.current) {
          animRef.current.stop();
          animRef.current = null;
        }
        fillPercent.jump(newPct);
        onChange(roundValue(newValue, step, min, max));
      }
    },
    [
      isInteracting,
      positionToValue,
      percentFromValue,
      onChange,
      fillPercent,
      rubberStretchPx,
      computeRubberStretch,
      reduceMotion,
      snap,
      releaseThreshold,
      min,
      max,
      step,
    ]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isInteracting) return;

      if (isClickRef.current) {
        // When steps are coarse (≤10 positions), click snaps to the nearest step.
        // Otherwise, the original decile-magnetic behavior is preserved
        const rawValue = positionToValue(e.clientX);
        const discreteSteps = (max - min) / step;
        const snappedValue = snap === "magnetic" ? roundValue(rawValue, step, min, max) : discreteSteps <= 10
          ? Math.max(min, Math.min(max, min + Math.round((rawValue - min) / step) * step))
          : snapToDecile(rawValue, min, max);

        animateNextValue.current = true;
        onChange(roundValue(snappedValue, step, min, max));
      }

      // Spring rubber band back
      if (reduceMotion) {
        rubberStretchPx.jump(0);
      } else if (rubberStretchPx.get() !== 0) {
        animate(rubberStretchPx, 0, {
          type: 'spring',
          visualDuration: 0.35,
          bounce: 0.15,
        });
      }

      setIsInteracting(false);
      setIsDragging(false);
      pointerDownPos.current = null;
    },
    [
      isInteracting,
      positionToValue,
      onChange,
      min,
      max,
      step,
      snap,
      reduceMotion,
      rubberStretchPx,
    ]
  );

  const handlePointerCancel = () => {
    if (!pointerDownPos.current) return;
    rubberStretchPx.jump(0);
    setIsInteracting(false);
    setIsDragging(false);
    pointerDownPos.current = null;
  };

  useEffect(() => () => { animRef.current?.stop(); }, []);

  // Handle value hover delay for editable state
  useEffect(() => {
    if (isValueHovered && !showInput && !isValueEditable) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsValueEditable(true);
      }, 800);
    } else if (!isValueHovered && !showInput) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
    }
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [isValueHovered, showInput, isValueEditable]);

  // Focus input when it appears
  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [showInput]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputSubmit = () => {
    if (editingEnded.current) return;
    editingEnded.current = true;
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      onChange(roundValue(clamped, step, min, max));
    }
    setShowInput(false);
    setIsValueHovered(false);
    setIsValueEditable(false);
  };

  const handleValueClick = (e: React.MouseEvent) => {
    if (isValueEditable) {
      e.stopPropagation();
      e.preventDefault();
      editingEnded.current = false;
      setShowInput(true);
      setInputValue(value.toFixed(decimalsForStep(step, min, max)));
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key !== 'Enter' && e.key !== 'Escape') return;
    e.preventDefault();
    if (e.key === 'Enter') handleInputSubmit();
    else {
      editingEnded.current = true;
      setShowInput(false);
      setIsValueHovered(false);
    }
    queueMicrotask(() => trackRef.current?.focus({ preventScroll: true }));
  };

  const handleInputBlur = () => {
    handleInputSubmit();
  };

  const displayValue = value.toFixed(decimalsForStep(step, min, max));

  const [thresholds, setThresholds] = useState({ left: 30, right: 78 });
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const observer = new ResizeObserver(() => {
      const width = wrapper.offsetWidth;
      if (!width) return;
      setThresholds({
        left: ((10 + (labelRef.current?.offsetWidth ?? 0) + 8) / width) * 100,
        right: ((width - 12 - (valueSpanRef.current?.offsetWidth ?? 0) - 8) / width) * 100,
      });
    });
    observer.observe(wrapper);
    if (labelRef.current) observer.observe(labelRef.current);
    if (valueSpanRef.current) observer.observe(valueSpanRef.current);
    return () => observer.disconnect();
  }, [showInput]);
  const { left: leftThreshold, right: rightThreshold } = thresholds;
  const valueDodge = percentage < leftThreshold || percentage > rightThreshold;
  const handleOpacity = !isActive
    ? 0
    : valueDodge
      ? 0.1
      : isDragging
        ? 0.9
        : 0.5;

  // The ≤ 10 threshold separates discrete sliders
  // (like step=2 on a 0–10 range → 5 steps) from continuous ones.
  const discreteSteps = (max - min) / step;
  const hashMarks = snap === "magnetic" || discreteSteps <= 10
    ? Array.from({ length: Math.ceil(discreteSteps) - 1 }, (_, i) => {
        const pct = ((i + 1) * step) / (max - min) * 100;
        return (
          <div
            key={i}
            className="dialkit-slider-hashmark"
            style={{ left: `${pct}%` }}
          />
        );
      })
    : Array.from({ length: 9 }, (_, i) => {
        const pct = (i + 1) * 10;
        return (
          <div
            key={i}
            className="dialkit-slider-hashmark"
            style={{ left: `${pct}%` }}
          />
        );
      });

  return (
    <div ref={wrapperRef} className="anaphor-slider dialkit-slider-wrapper">
      <motion.div
        ref={trackRef}
        className={`dialkit-slider ${isActive ? 'dialkit-slider-active' : ''}`}
        role="slider"
        tabIndex={showInput ? -1 : 0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${displayValue}${unit ? ` ${unit}` : ''}`}
        onKeyDown={(e) => handleSliderKey(e, value, min, max, step, (next) => {
          animRef.current?.stop(); animRef.current = null;
          fillPercent.jump(percentFromValue(next)); onChange(next);
        }, () => {
          editingEnded.current = false;
          setInputValue(value.toFixed(decimalsForStep(step, min, max))); setShowInput(true);
        })}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handlePointerCancel}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ width: rubberBandWidth, x: rubberBandX }}
      >
        <div className="dialkit-slider-hashmarks">{hashMarks}</div>

        <motion.div
          className="dialkit-slider-fill"
          style={{
            width: '100%',
            transformOrigin: 'left',
            transform: fillTransform,
          }}
        />

        <motion.div className="pointer-events-none absolute inset-0" style={{ transform: handleTransform }}>
          <motion.div
            className="dialkit-slider-handle"
            style={{
              left: 0,
              y: '-50%',
            }}
            animate={{
              opacity: handleOpacity,
              scaleX: reduceMotion || isActive ? 1 : 0.25,
              scaleY: !reduceMotion && isActive && valueDodge ? 0.75 : 1,
            }}
            transition={{
              scaleX: { type: 'spring', visualDuration: 0.25, bounce: 0.15 },
              scaleY: { type: 'spring', visualDuration: 0.2, bounce: 0.1 },
              opacity: { duration: 0.15 },
            }}
          />
        </motion.div>

        <span ref={labelRef} className="dialkit-slider-label">
          {label}
        </span>

        {showInput ? (
          <input
            ref={inputRef}
            type="text"
            className="dialkit-slider-input"
            aria-label={`${label} value`}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onBlur={handleInputBlur}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            ref={valueSpanRef}
            className={`dialkit-slider-value ${isValueEditable ? 'dialkit-slider-value-editable' : ''}`}
            onMouseEnter={() => setIsValueHovered(true)}
            onMouseLeave={() => { setIsValueHovered(false); if (!showInput) setIsValueEditable(false); }}
            onClick={handleValueClick}
            onPointerDown={(e) => isValueEditable && e.stopPropagation()}
            onMouseDown={(e) => isValueEditable && e.stopPropagation()}
            style={{ cursor: isValueEditable ? 'text' : 'default' }}
          >
            {displayValue}
          </span>
        )}
      </motion.div>
    </div>
  );
}
