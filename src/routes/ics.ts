import { createFileRoute } from '@tanstack/solid-router'

const ICS_URLS: Record<string, Record<string, string>> = {
  '2026': {
    'sc': 'https://outlook.office365.com/owa/calendar/5479c4c9aea84aa1bfc94f2f7f04b948@griffith.edu.au/a34e5d521f8a46539b841149bb8873fb1914797712579501563/calendar.ics'
  }
}

const cache = new Map<string, { text: string; fetchedAt: number }>()
const CACHE_TTL = 1000 * 60 * 1 // 1 minute

export const Route = createFileRoute('/ics')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const pathway = Number(url.searchParams.get('pathway'))
        const year = url.searchParams.get('year') || url.searchParams.get('yearStarted')
        const cohort = url.searchParams.get('cohort')

        if (
          !pathway ||
          pathway < 1 ||
          pathway > 6 ||
          !Number.isInteger(pathway)
        ) {
          return new Response(
            'pathway query parameter must be an integer between 1 and 6',
            { status: 400 },
          )
        }

        if (!year || !cohort) {
          return new Response(
            'year and cohort query parameters are required',
            { status: 400 },
          )
        }

        const icsUrl = ICS_URLS[year]?.[cohort]
        if (!icsUrl) {
          return new Response(
            `no calendar found for year=${year} cohort=${cohort}`,
            { status: 404 },
          )
        }

        const cacheKey = `${year}:${cohort}`
        const cached = cache.get(cacheKey)

        let icsText: string
        if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
          icsText = cached.text
        } else {
          const response = await fetch(icsUrl)
          if (!response.ok) {
            return new Response(
              'Failed to fetch calendar data from upstream',
              { status: 502 },
            )
          }
          icsText = await response.text()
          cache.set(cacheKey, { text: icsText, fetchedAt: Date.now() })
        }

        const filtered = filterIcsByPathway(icsText, pathway)

        return new Response(filtered, {
          headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': `attachment; filename="griffiths-medical-calendar-${year}-${cohort}-pathway-${pathway}.ics"`,
          },
        })
      },
    },
  },
})

function filterIcsByPathway(icsText: string, pathway: number): string {
  const lines = icsText.split(/\r?\n/)

  const headerLines: string[] = []
  const events: string[][] = []
  const footerLines: string[] = []

  let currentEvent: string[] | null = null
  let headerDone = false

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      headerDone = true
      currentEvent = [line]
    } else if (line === 'END:VEVENT') {
      if (currentEvent) {
        currentEvent.push(line)
        events.push(currentEvent)
        currentEvent = null
      }
    } else if (currentEvent) {
      currentEvent.push(line)
    } else if (!headerDone) {
      headerLines.push(line)
    } else {
      footerLines.push(line)
    }
  }

  for (let i = 0; i < headerLines.length; i++) {
    if (headerLines[i].startsWith('X-WR-CALNAME:')) {
      headerLines[i] = `X-WR-CALNAME:[Pathway=${pathway}] ${headerLines[i].substring('X-WR-CALNAME:'.length)}`
      break
    }
  }

  const filteredEvents = events.filter((eventLines) => {
    const unfolded = unfoldLines(eventLines)
    const summaryLine = unfolded.find((l) => l.startsWith('SUMMARY:'))
    if (!summaryLine) return true

    const summary = summaryLine.substring('SUMMARY:'.length)
    const pathways = extractPathways(summary)

    if (pathways === null) return true // no pathway info = all students
    return pathways.includes(pathway)
  })

  const result = [
    ...headerLines,
    ...filteredEvents.flat(),
    ...footerLines,
  ]

  return result.join('\r\n')
}

function unfoldLines(lines: string[]): string[] {
  const result: string[] = []
  for (const line of lines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && result.length > 0) {
      result[result.length - 1] += line.substring(1)
    } else {
      result.push(line)
    }
  }
  return result
}

function extractPathways(summary: string): number[] | null {
  const match = summary.match(/Pathways?\s+([\d\s,&\\]+)/i)
  if (!match) return null

  const numbers = match[1].match(/\d/g)
  return numbers ? numbers.map(Number) : null
}
