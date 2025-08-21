export const PROGRESS_MESSAGES = {
  // 0-20% - Initialization phase
  initialization: [
    'Initializing vibe analysis engine',
    'Warming up the compatibility matrix',
    'Preparing analysis parameters',
    'Loading user data models',
    'Establishing connection to X',
    'Calibrating vibe sensors',
    'Booting up AI analysis core',
    'Synchronizing data streams',
  ],

  // 20-40% - Profile fetching phase
  profileFetching: [
    'Fetching user profiles from X',
    'Retrieving timeline data',
    'Scanning recent posts',
    'Collecting interaction patterns',
    'Downloading profile metadata',
    'Analyzing posting frequency',
    'Gathering follower insights',
    'Processing user timelines',
  ],

  // 40-60% - Analysis phase
  analysis: [
    'Analyzing communication styles',
    'Detecting personality patterns',
    'Measuring interaction dynamics',
    'Evaluating content preferences',
    'Examining linguistic patterns',
    'Processing behavioral signals',
    'Calculating engagement metrics',
    'Mapping interest overlaps',
  ],

  // 60-80% - Deep analysis phase
  deepAnalysis: [
    'Computing compatibility metrics',
    'Running deep learning models',
    'Analyzing vibe frequencies',
    'Calculating chemistry scores',
    'Processing sentiment patterns',
    'Evaluating shared interests',
    'Measuring wavelength alignment',
    'Detecting common ground',
  ],

  // 80-95% - Finalization phase
  finalization: [
    'Finalizing compatibility report',
    'Generating vibe insights',
    'Compiling analysis results',
    'Preparing detailed breakdown',
    'Calculating final scores',
    'Creating compatibility summary',
    'Assembling vibe report',
    'Polishing the results',
  ],

  // 95-100% - Completion phase
  completion: [
    'Analysis complete!',
    'Vibe check finished!',
    'Compatibility calculated!',
    'Results ready!',
    'All done!',
    'Analysis successful!',
  ],
} as const;

export type ProgressPhase = keyof typeof PROGRESS_MESSAGES;

export function getRandomMessage(phase: ProgressPhase): string {
  const messages = PROGRESS_MESSAGES[phase];
  return messages[Math.floor(Math.random() * messages.length)];
}

export function getProgressPhase(progress: number): ProgressPhase {
  if (progress < 20) return 'initialization';
  if (progress < 40) return 'profileFetching';
  if (progress < 60) return 'analysis';
  if (progress < 80) return 'deepAnalysis';
  if (progress < 95) return 'finalization';
  return 'completion';
}
