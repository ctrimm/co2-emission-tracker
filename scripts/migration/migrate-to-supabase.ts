import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import dotenv from 'dotenv'
import pLimit from 'p-limit'

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Limit concurrent operations
const limit = pLimit(10)

interface EmissionRecord {
  date: string
  domain: string
  name: string
  industry: string
  domainType?: string
  agency?: string
  organization?: string
  isGreen: boolean
  estimatedCO2: number
  totalBytes: number
}

interface ErrorRecord {
  url: string
  type: string
  error: string
  timestamp?: string
}

async function ensureMonitoredSitesExist(emissions: any[]) {
  console.log('Ensuring all domains exist in monitored_sites...')
  
  // Get unique domains from emissions data
  const uniqueDomains = [...new Set(emissions.map(record => record.domain))]
  console.log(`Found ${uniqueDomains.length} unique domains`)

  // Get existing domains from monitored_sites
  const { data: existingSites } = await supabase
    .from('monitored_sites')
    .select('domain')
  
  const existingDomains = new Set(existingSites?.map(site => site.domain) || [])
  
  // Find domains that need to be added
  const missingDomains = uniqueDomains.filter(domain => !existingDomains.has(domain))
  
  if (missingDomains.length > 0) {
    console.log(`Adding ${missingDomains.length} missing domains to monitored_sites`)
    
    // Create records for missing domains
    const newSites = missingDomains.map(domain => {
      const emissionRecord = emissions.find(record => record.domain === domain)
      return {
        domain: domain,
        name: emissionRecord.name,
        industry: emissionRecord.industry,
        domain_type: emissionRecord.domain_type,
        agency: emissionRecord.agency,
        organization: emissionRecord.organization,
        monitoring_frequency: 'daily', // default to daily
        is_active: true,
        created_at: new Date().toISOString()
      }
    })

    // Insert in chunks
    const chunkSize = 100
    for (let i = 0; i < newSites.length; i += chunkSize) {
      const chunk = newSites.slice(i, i + chunkSize)
      const { error } = await supabase
        .from('monitored_sites')
        .upsert(chunk, {
          onConflict: 'domain',
          ignoreDuplicates: true
        })

      if (error) {
        console.error(`Error adding monitored sites chunk ${i}-${i + chunk.length}:`, error)
      } else {
        console.log(`Added monitored sites ${i} to ${i + chunk.length}`)
      }
      
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
}

async function migrateEmissionsData() {
  try {
    console.log('Starting emissions data migration...')
    
    const emissionsData: EmissionRecord[] = JSON.parse(
      readFileSync('./public/data/emissions_results.json', 'utf-8')
    )

    console.log(`Total emissions records to migrate: ${emissionsData.length}`)

    // Transform data without modifying dates
    const uniqueEmissions = new Map<string, any>()
    
    const formattedEmissions = emissionsData.map(record => ({
      date: record.date, // Keep the original date
      domain: record.domain,
      name: record.name || null,
      industry: record.industry || null,
      domain_type: record.domainType || null,
      agency: record.agency || null,
      organization: record.organization || null,
      is_green: record.isGreen,
      estimated_co2_grams: record.estimatedCO2 || 0,
      total_bytes: record.totalBytes || 0,
      created_at: new Date().toISOString()
    }))

    // Remove duplicates within the dataset
    formattedEmissions.forEach(record => {
      const key = `${record.date}-${record.domain}`
      uniqueEmissions.set(key, record)
    })

    const dedupedEmissions = Array.from(uniqueEmissions.values())
    
    console.log(`
      Data Summary:
      Original records: ${formattedEmissions.length}
      Unique records: ${dedupedEmissions.length}
      Sample record: ${JSON.stringify(dedupedEmissions[0], null, 2)}
    `)

    // Ensure all domains exist before migrating emissions
    await ensureMonitoredSitesExist(dedupedEmissions)

    const chunkSize = 100
    let successCount = 0
    let failureCount = 0

    for (let i = 0; i < dedupedEmissions.length; i += chunkSize) {
      const chunk = dedupedEmissions.slice(i, i + chunkSize)
      try {
        const { error, count } = await supabase
          .from('website_emissions')
          .upsert(chunk, {
            onConflict: 'date,domain',
            ignoreDuplicates: true  // Changed to true to skip duplicates
          })

        if (error) {
          if (error.code === '42501' && error.message.includes('daily_emission_stats')) {
            console.log(`Note: Materialized view update skipped for chunk ${i}-${i + chunk.length} - ${error.message}`)
            successCount += chunk.length
          } else {
            console.error(`Error in chunk ${i}-${i + chunk.length}:`, error)
            console.error('Error details:', error)
            failureCount += chunk.length
          }
          continue
        }

        successCount += count || chunk.length
        console.log(`Progress: ${successCount}/${dedupedEmissions.length} records processed`)
        
        // Add a small delay between chunks
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Unexpected error in chunk ${i}-${i + chunk.length}:`, error)
        failureCount += chunk.length
      }
    }

    console.log(`
      Migration Summary:
      Total original records: ${formattedEmissions.length}
      Total unique records: ${dedupedEmissions.length}
      Successfully migrated: ${successCount}
      Failed: ${failureCount}
    `)

  } catch (error) {
    console.error('Error migrating emissions data:', error)
    throw error
  }
}

async function migrateErrorLogs() {
  try {
    console.log('Starting error log migration...')
    
    const errorLogs: ErrorRecord[] = JSON.parse(
      readFileSync('./public/data/error_log.json', 'utf-8')
    )

    console.log(`Total error logs to migrate: ${errorLogs.length}`)

    const formattedErrors = errorLogs.map(record => ({
      url: record.url,
      error_type: record.type,
      error_message: record.error,
      error_severity: 'error',
      error_details: record,
      created_at: record.timestamp || new Date().toISOString()
    }))

    let successCount = 0
    let failureCount = 0
    const chunkSize = 100

    for (let i = 0; i < formattedErrors.length; i += chunkSize) {
      const chunk = formattedErrors.slice(i, i + chunkSize)
      try {
        const { error, count } = await supabase
          .from('error_log')
          .upsert(chunk, {
            onConflict: 'url,created_at',
            ignoreDuplicates: false,
            count: 'exact'
          })

        if (error) {
          console.error(`Error in chunk ${i}-${i + chunk.length}:`, error)
          failureCount += chunk.length
          continue
        }

        successCount += count || chunk.length
        console.log(`Progress: ${successCount}/${formattedErrors.length} error logs processed`)
        
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Unexpected error in chunk ${i}-${i + chunk.length}:`, error)
        failureCount += chunk.length
      }
    }

    console.log(`
      Error Log Migration Summary:
      Total records: ${formattedErrors.length}
      Successfully migrated: ${successCount}
      Failed: ${failureCount}
    `)

  } catch (error) {
    console.error('Error migrating error logs:', error)
    throw error
  }
}

async function migrateMonitoredSites() {
  try {
    console.log('Starting monitored sites migration...')
    
    // Read both daily and weekly sites
    const dailySites = JSON.parse(
      readFileSync('./websites-to-check-daily-list.json', 'utf-8')
    )
    const weeklySites = JSON.parse(
      readFileSync('./websites-to-check-weekly-list.json', 'utf-8')
    )

    // Transform and combine the data
    const formattedSites = [
      ...dailySites.map(site => ({
        ...site,
        monitoring_frequency: 'daily'
      })),
      ...weeklySites.map(site => ({
        ...site,
        monitoring_frequency: 'weekly'
      }))
    ].map(site => ({
      domain: site.website,
      name: site.name,
      industry: site.industry,
      domain_type: site.domainType || null,
      agency: site.agency || null,
      organization: site.organization || null,
      monitoring_frequency: site.monitoring_frequency,
      is_active: true,
      created_at: new Date().toISOString()
    }))

    // Insert all sites
    const { error } = await supabase
      .from('monitored_sites')
      .upsert(formattedSites, {
        onConflict: 'domain',
        ignoreDuplicates: true
      })

    if (error) {
      console.error('Error migrating monitored sites:', error)
      throw error
    }

    console.log(`Migrated ${formattedSites.length} monitored sites`)
  } catch (error) {
    console.error('Error migrating monitored sites:', error)
    throw error
  }
}

async function runMigration() {
  try {
    // Changed order to ensure monitored sites are handled first
    await migrateEmissionsData() // This now includes ensuring monitored sites exist
    await migrateErrorLogs()
    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

// Run the migration
runMigration()
