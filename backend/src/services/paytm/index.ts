import { DemoPaytmDataProvider } from './demo.provider';
import { PaytmDataProvider } from './paytm.provider';
import { config } from '../../config/env.config';

// Instantiates active provider.
// Under hackathon, default is DemoPaytmDataProvider.
// Can be changed based on environment variables or toggle.
export const paytmProvider: PaytmDataProvider = new DemoPaytmDataProvider();
