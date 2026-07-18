import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  analyzeWebsiteUrl,
  generateInsights,
  generatePersonas,
  runBehaviorSimulation,
  uploadImage,
} from '../../services/uploadService.js';
import { AnalysisLoadingSequence } from './AnalysisLoadingSequence.jsx';

const acceptedTypes = ['image/png', 'image/jpeg', 'image/webp'];
const maxFileSize = 8 * 1024 * 1024;

const formatFileSize = (bytes) => {
  if (!bytes) return '0 KB';
  const megabytes = bytes / 1024 / 1024;
  return `${megabytes.toFixed(megabytes >= 1 ? 1 : 2)} MB`;
};

const validateFile = (file) => {
  if (!acceptedTypes.includes(file.type)) {
    return 'Use a PNG, JPEG, or WebP image.';
  }

  if (file.size > maxFileSize) {
    return 'Image must be 8MB or smaller.';
  }

  return '';
};

const validateWebsiteUrl = (url) => {
  try {
    const parsedUrl = new URL(url.trim());
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return 'Enter a valid http or https URL.';
    }
    return '';
  } catch {
    return 'Enter a valid URL, including https://.';
  }
};

const getFriendlyAnalysisError = (error) => {
  const message = error?.message || 'Analysis failed. Please try again.';

  if (message.includes('does not exist') || message.includes('MODEL_UNAVAILABLE')) {
    return 'The configured AI model is unavailable or this API key does not have access. Update the provider model settings, then retry.';
  }

  if (message.includes('rate limit') || message.includes('RATE_LIMITED')) {
    return 'The AI provider is rate limited right now. Wait a moment, then retry.';
  }

  return message;
};

export function UploadScreen({ embedded = false, compact = false, onSimulationReady }) {
  const inputRef = useRef(null);
  const transitionTimeoutRef = useRef(null);
  const activeRunIdRef = useRef(0);
  const isRunningRef = useRef(false);
  const isMountedRef = useRef(true);
  const retainedPreviewUrlRef = useRef('');
  const [mode, setMode] = useState('upload');
  const [file, setFile] = useState(null);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
  const [error, setError] = useState('');
  const [pendingSession, setPendingSession] = useState(null);

  const fileMeta = useMemo(() => {
    if (!file) return null;

    return {
      name: file.name,
      type: file.type.replace('image/', '').toUpperCase(),
      size: formatFileSize(file.size),
    };
  }, [file]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => {
      if (retainedPreviewUrlRef.current !== objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [file]);

  useEffect(() => () => {
    isMountedRef.current = false;
    activeRunIdRef.current += 1;
    isRunningRef.current = false;
    window.clearTimeout(transitionTimeoutRef.current);
    retainedPreviewUrlRef.current = '';
  }, []);

  const isCurrentRun = (runId) =>
    isMountedRef.current && activeRunIdRef.current === runId;

  const resetRunState = () => {
    window.clearTimeout(transitionTimeoutRef.current);
    setError('');
    setPendingSession(null);
    setProgress(0);
    setActiveStageIndex(0);
    setIsAnalysisComplete(false);
  };

  const failRun = (error, runId) => {
    if (!isCurrentRun(runId)) return;

    isRunningRef.current = false;
    window.clearTimeout(transitionTimeoutRef.current);
    setIsUploading(false);
    setPendingSession(null);
    setIsAnalysisComplete(false);
    setProgress(0);
    setActiveStageIndex(0);
    setError(getFriendlyAnalysisError(error));
  };

  const setSelectedFile = (nextFile) => {
    if (!nextFile) return;

    const validationError = validateFile(nextFile);
    resetRunState();
    if (retainedPreviewUrlRef.current) {
      URL.revokeObjectURL(retainedPreviewUrlRef.current);
      retainedPreviewUrlRef.current = '';
    }

    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }

    setMode('upload');
    setFile(nextFile);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    setSelectedFile(event.dataTransfer.files?.[0]);
  };

  const finishWithReport = (session, runId) => {
    if (!isCurrentRun(runId)) return;

    setPendingSession(session);
    setProgress(100);
    setActiveStageIndex(4);
    setIsAnalysisComplete(true);

    transitionTimeoutRef.current = window.setTimeout(() => {
      if (isCurrentRun(runId)) {
        isRunningRef.current = false;
        if (onSimulationReady) {
          onSimulationReady(session);
        } else {
          setIsUploading(false);
        }
      }
    }, 520);
  };

  const runExistingPipeline = async ({ productUnderstanding, baseSession, runId }) => {
    if (!isCurrentRun(runId)) return;
    setActiveStageIndex(1);
    setProgress(34);
    const personaResponse = await generatePersonas(productUnderstanding);

    if (!isCurrentRun(runId)) return;
    setActiveStageIndex(2);
    setProgress(54);
    const simulation = await runBehaviorSimulation({
      productUnderstanding,
      personas: personaResponse.personas || [],
    });

    if (!isCurrentRun(runId)) return;
    setActiveStageIndex(3);
    setProgress(74);
    const insights = await generateInsights({
      productUnderstanding,
      personas: personaResponse.personas || [],
      simulation,
    });

    if (!isCurrentRun(runId)) return;
    setActiveStageIndex(4);
    setProgress(92);
    finishWithReport({
      ...baseSession,
      productUnderstanding,
      personas: personaResponse.personas || [],
      simulation,
      insights,
    }, runId);
  };

  const handleScreenshotUpload = async () => {
    if (!file || isUploading || isRunningRef.current) return;

    const screenshotUrl = previewUrl || URL.createObjectURL(file);
    retainedPreviewUrlRef.current = screenshotUrl;
    if (!previewUrl) {
      setPreviewUrl(screenshotUrl);
    }

    const immediateSession = {
      screenshotUrl,
      fileName: file.name,
      sourceType: 'upload',
    };
    const runId = activeRunIdRef.current + 1;
    activeRunIdRef.current = runId;
    isRunningRef.current = true;
    setIsUploading(true);
    resetRunState();
    setPendingSession(immediateSession);
    setProgress(8);
    setActiveStageIndex(0);

    try {
      const productUnderstanding = await uploadImage(file, (value) => {
        if (isCurrentRun(runId)) {
          setProgress(Math.min(28, 8 + Math.round(value * 0.2)));
        }
      });

      if (!isCurrentRun(runId)) return;

      setProgress(28);
      await runExistingPipeline({ productUnderstanding, baseSession: immediateSession, runId });
    } catch (uploadError) {
      failRun(uploadError, runId);
    }
  };

  const handleWebsiteAnalysis = async () => {
    if (isUploading || isRunningRef.current) return;

    const validationError = validateWebsiteUrl(websiteUrl);
    if (validationError) {
      setError(validationError);
      return;
    }

    const runId = activeRunIdRef.current + 1;
    activeRunIdRef.current = runId;
    isRunningRef.current = true;
    setIsUploading(true);
    resetRunState();
    setProgress(8);
    setActiveStageIndex(0);

    const normalizedUrl = websiteUrl.trim();
    const baseSession = {
      fileName: normalizedUrl,
      sourceUrl: normalizedUrl,
      sourceType: 'url',
    };

    setPendingSession(baseSession);

    try {
      const productUnderstanding = await analyzeWebsiteUrl(normalizedUrl);
      if (!isCurrentRun(runId)) return;
      setProgress(28);
      await runExistingPipeline({ productUnderstanding, baseSession, runId });
    } catch (urlError) {
      failRun(urlError, runId);
    }
  };

  const clearSelection = () => {
    activeRunIdRef.current += 1;
    isRunningRef.current = false;
    window.clearTimeout(transitionTimeoutRef.current);
    if (retainedPreviewUrlRef.current) {
      URL.revokeObjectURL(retainedPreviewUrlRef.current);
      retainedPreviewUrlRef.current = '';
    }
    setFile(null);
    setWebsiteUrl('');
    setError('');
    setPendingSession(null);
    setProgress(0);
    setActiveStageIndex(0);
    setIsAnalysisComplete(false);
    setIsUploading(false);

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const switchMode = (nextMode) => {
    if (isUploading) return;
    setMode(nextMode);
    setError('');
  };

  const Shell = embedded ? 'section' : 'main';

  return (
    <Shell
      id="upload"
      className={compact ? 'relative' : `relative px-5 sm:px-6 lg:px-8 ${
        embedded
          ? 'border-t border-white/[0.08] py-24 sm:py-28'
          : 'min-h-screen py-6'
      }`}
    >
      {!compact ? (
        <>
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.14),transparent_34rem)]" />
          <div className="absolute inset-x-0 top-20 -z-10 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </>
      ) : null}

      {!embedded && !compact ? (
        <header className="mx-auto flex h-12 max-w-6xl items-center justify-between">
          <a href="#" className="flex items-center gap-3" aria-label="PersonaLab home">
            <span className="grid h-8 w-8 place-items-center rounded-md border border-white/10 bg-white text-xs font-semibold text-black">
              P
            </span>
            <span className="text-sm font-medium text-white">PersonaLab</span>
          </a>
          <span className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-400">
            Screenshot or URL
          </span>
        </header>
      ) : null}

      <div
        className={compact ? 'w-full' : `mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] ${
          embedded ? '' : 'min-h-[calc(100vh-6rem)] py-12'
        }`}
      >
        {!compact ? (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl"
          >
            <p className="text-sm font-medium text-zinc-500">Start analysis</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal text-white sm:text-5xl lg:text-6xl">
              Analyze a screenshot or URL.
            </h1>
            <p className="mt-5 text-base leading-7 text-zinc-400">
              Choose the fastest input. PersonaLab converts it into the same
              structured AI workflow and returns a launch-readiness report.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {['PNG', 'JPEG', 'URL'].map((type) => (
                <div
                  key={type}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.025] p-4 text-center text-sm font-medium text-zinc-300"
                >
                  {type}
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}

        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-white/[0.1] bg-[#09090a] p-3 shadow-2xl shadow-black/60"
        >
          <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/35 p-1">
            {[
              ['upload', 'Upload Screenshot'],
              ['url', 'Analyze Website URL'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => switchMode(value)}
                disabled={isUploading}
                className={`h-10 rounded-lg text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  mode === value
                    ? 'bg-white text-black shadow-lg shadow-white/10'
                    : 'text-zinc-400 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {mode === 'upload' ? (
              <motion.div
                key="upload-mode"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                <div
                  role="button"
                  tabIndex={0}
                  aria-disabled={isUploading}
                  onClick={() => {
                    if (!isUploading) inputRef.current?.click();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      if (!isUploading) inputRef.current?.click();
                    }
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (isUploading) return;
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`relative overflow-hidden rounded-xl border border-dashed p-4 transition duration-200 sm:p-5 ${
                    isDragging
                      ? 'border-white/40 bg-white/[0.07]'
                      : 'border-white/[0.12] bg-black'
                  }`}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(event) => setSelectedFile(event.target.files?.[0])}
                  />

                  <div className="flex min-h-[30rem] flex-col">
                    <AnimatePresence mode="wait">
                      {previewUrl ? (
                        <motion.div
                          key="preview"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.25 }}
                          className="flex flex-1 flex-col"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.03]">
                            <img
                              src={previewUrl}
                              alt="Selected upload preview"
                              className="h-full w-full object-contain"
                            />
                            <AnimatePresence>
                              {isUploading && pendingSession ? (
                                <AnalysisLoadingSequence
                                  activeStageIndex={activeStageIndex}
                                  progress={progress}
                                  isComplete={isAnalysisComplete}
                                />
                              ) : null}
                            </AnimatePresence>
                          </div>

                          <div className="mt-4 rounded-lg border border-white/[0.08] bg-white/[0.025] p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-white">
                                  {fileMeta?.name}
                                </p>
                                <p className="mt-1 text-xs text-zinc-500">
                                  {fileMeta?.type} · {fileMeta?.size}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  clearSelection();
                                }}
                                disabled={isUploading}
                                className="h-10 rounded-lg border border-white/10 px-4 text-sm text-zinc-300 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Replace
                              </button>
                            </div>

                            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                              <motion.div
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.25, ease: 'easeOut' }}
                                className="h-full rounded-full bg-white"
                              />
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="empty"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.25 }}
                          className="grid flex-1 place-items-center text-center"
                        >
                          <div>
                            <div className="mx-auto grid h-16 w-16 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
                              <div className="h-7 w-7 rounded-md border border-white/30" />
                            </div>
                            <h2 className="mt-6 text-xl font-medium text-white">
                              Drop image here
                            </h2>
                            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                              Choose a PNG, JPEG, or WebP image up to 8MB.
                            </p>
                            <button
                              type="button"
                              className="mt-6 h-11 rounded-lg bg-white px-5 text-sm font-medium text-black transition hover:bg-zinc-200"
                            >
                              Select image
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleScreenshotUpload}
                    disabled={!file || isUploading}
                    className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-white px-5 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {isUploading ? 'Simulation in progress...' : 'Analyze screenshot'}
                  </button>
                  <button
                    type="button"
                    onClick={clearSelection}
                    disabled={!file || isUploading}
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-white/10 px-5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Clear
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="url-mode"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="relative overflow-hidden rounded-xl border border-white/[0.12] bg-black p-5"
              >
                <AnimatePresence>
                  {isUploading && pendingSession ? (
                    <AnalysisLoadingSequence
                      activeStageIndex={activeStageIndex}
                      progress={progress}
                      isComplete={isAnalysisComplete}
                    />
                  ) : null}
                </AnimatePresence>

                <div className="flex min-h-[30rem] flex-col justify-between">
                  <div>
                    <div className="grid h-14 w-14 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-xl text-white">
                      ↗
                    </div>
                    <h2 className="mt-6 text-2xl font-semibold tracking-normal text-white">
                      Analyze Website URL
                    </h2>
                    <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
                      Recommended for most websites. PersonaLab automatically
                      captures a screenshot before analysis.
                    </p>

                    <label htmlFor="website-url" className="mt-8 block text-sm font-medium text-zinc-300">
                      Website URL
                    </label>
                    <input
                      id="website-url"
                      type="url"
                      value={websiteUrl}
                      onChange={(event) => {
                        setWebsiteUrl(event.target.value);
                        setError('');
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          handleWebsiteAnalysis();
                        }
                      }}
                      disabled={isUploading}
                      placeholder="https://example.com"
                      className="mt-3 h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                      <motion.div
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="h-full rounded-full bg-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleWebsiteAnalysis}
                      disabled={!websiteUrl.trim() || isUploading}
                      className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-white px-5 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {isUploading ? 'Analyzing website...' : 'Analyze URL'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error ? (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-red-100">Analysis could not complete</p>
                    <p className="mt-1 text-sm leading-6 text-red-200/85">{error}</p>
                    <p className="mt-1 text-xs text-red-200/65">
                      No report was generated. Check the input and try again.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={mode === 'upload' ? handleScreenshotUpload : handleWebsiteAnalysis}
                    disabled={isUploading || (mode === 'upload' ? !file : !websiteUrl.trim())}
                    className="h-10 shrink-0 rounded-lg bg-red-100 px-4 text-sm font-medium text-red-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Retry
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </div>
    </Shell>
  );
}

UploadScreen.propTypes = {
  embedded: PropTypes.bool,
  compact: PropTypes.bool,
  onSimulationReady: PropTypes.func,
};
