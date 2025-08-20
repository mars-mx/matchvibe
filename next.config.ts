import type { NextConfig } from 'next';
import { withBotId } from 'botid/next/config';

const nextConfig: NextConfig = {
  /* config options here */
};

// Wrap the config with BotId to enable bot protection
export default withBotId(nextConfig);
