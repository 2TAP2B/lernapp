import cron from 'node-cron'
import { syncCountries } from '../services/countriesSync'

export function startSyncJob(): void {
  // Run every day at 03:00
  cron.schedule('0 3 * * *', async () => {
    try {
      await syncCountries()
    } catch (err) {
      console.error('[syncJob] Error during scheduled sync:', err)
    }
  })
  console.log('[syncJob] Daily sync job scheduled for 03:00.')
}
