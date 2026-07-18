import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useEffect, useMemo, useRef, useState } from 'react';
import { uploadImage } from '../../services/uploadService.js';
import { ComparisonDashboard } from './ComparisonDashboard.jsx';

const acceptedTypes = ['image/png', 'image/jpeg', 'image/webp'];
const maxFileSize = 8 * 1024 * 1024;

const validateFile = (file) => {
  if (!acceptedTypes.includes(file.type)) return 'Use a PNG, JPEG, or WebP image.';
  if (file.size > maxFileSize) return 'Image must be 8MB or smaller.';
  return '';
};

export function ComparisonUploader({ beforeResult, beforeScreenshotUrl }) {
  const inputRef = useRef(null);
  const [afterFile, setAfterFile] = useState(null);
  const [afterPreviewUrl, setAfterPreviewUrl] = useState('');
  const [afterResult, setAfterResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const afterFileLabel = useMemo(() => {
    if (!afterFile) return 'No screenshot selected';
    return `${afterFile.name} · ${(afterFile.size / 1024 / 1024).toFixed(1)} MB`;
  }, [afterFile]);

  useEffect(() => {
    if (!afterFile) {
      setAfterPreviewUrl('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(afterFile);
    setAfterPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [afterFile]);

  const selectAfterFile = (file) => {
    if (!file) return;

    const validationError = validateFile(file);
    setAfterResult(null);
    setProgress(0);

    if (validationError) {
      setError(validationError);
      setAfterFile(null);
      return;
    }

    setError('');
    setAfterFile(file);
  };

  const runAfterSimulation = async () => {
    if (!afterFile || isRunning) return;

    setIsRunning(true);
    setError('');
    setProgress(8);

    try {
      const result = await uploadImage(afterFile, setProgress);
      setAfterResult(result);
      setProgress(100);
    } catch (uploadError) {
      setError(uploadError.message);
      setProgress(0);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="mt-8 rounded-lg border border-white/[0.1] bg-[#09090a] p-4 shadow-2xl shadow-black/30"
    >
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-medium text-zinc-500">Upload another screenshot</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-normal text-white">
            Run the after simulation
          </h3>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Add a revised screenshot to rerun the full simulation stack and compare
            improvement against the original baseline.
          </p>
        </div>

        <div className="rounded-md border border-dashed border-white/[0.12] bg-black p-4">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => selectAfterFile(event.target.files?.[0])}
          />
          <div className="grid gap-4 md:grid-cols-[12rem_1fr] md:items-center">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="h-40 overflow-hidden rounded-md border border-white/[0.08] bg-white/[0.035] text-sm text-zinc-400 transition hover:bg-white/[0.06]"
            >
              {afterPreviewUrl ? (
                <img
                  src={afterPreviewUrl}
                  alt="After screenshot preview"
                  className="h-full w-full object-contain"
                />
              ) : (
                'Select after screenshot'
              )}
            </button>

            <div>
              <p className="text-sm font-medium text-white">{afterFileLabel}</p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                <motion.div
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="h-full rounded-full bg-white"
                />
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={runAfterSimulation}
                  disabled={!afterFile || isRunning}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-md bg-white px-5 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isRunning ? `Running ${Math.max(progress, 8)}%` : 'Run after simulation'}
                </button>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={isRunning}
                  className="inline-flex h-11 items-center justify-center rounded-md border border-white/10 px-5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Replace
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {error ? (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-4 rounded-md border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200"
              >
                {error}
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {afterResult && afterPreviewUrl ? (
        <ComparisonDashboard
          beforeResult={beforeResult}
          afterResult={afterResult}
          beforeScreenshotUrl={beforeScreenshotUrl}
          afterScreenshotUrl={afterPreviewUrl}
        />
      ) : null}
    </motion.section>
  );
}

ComparisonUploader.propTypes = {
  beforeResult: PropTypes.object.isRequired,
  beforeScreenshotUrl: PropTypes.string.isRequired,
};
