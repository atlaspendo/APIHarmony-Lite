
import { config } from 'dotenv';
config();

import '@/ai/flows/security-vulnerability-scan.ts';
import '@/ai/flows/integration-pattern-analysis.ts'; // Renamed from api-pattern-analysis
import '@/ai/flows/api-documentation-generation.ts';
import '@/ai/flows/api-health-anomaly-detection.ts';
import '@/ai/flows/api-compliance-check.ts';
