import { type CliConfig, defineCliConfig } from 'sanity/cli';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';

const cliConfig: CliConfig = defineCliConfig({
  api: { projectId, dataset },
});

export default cliConfig;
