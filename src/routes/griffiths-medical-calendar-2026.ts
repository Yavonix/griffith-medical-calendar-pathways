import { createFileRoute } from '@tanstack/solid-router'

const ICS_URL =
  'https://outlook.office365.com/owa/calendar/5479c4c9aea84aa1bfc94f2f7f04b948@griffith.edu.au/a34e5d521f8a46539b841149bb8873fb1914797712579501563/calendar.ics'

let cachedIcs: { text: string; fetchedAt: number } | null = null
const CACHE_TTL = 1000 * 60 * 60 // 1 hour

export const Route = createFileRoute('/griffiths-medical-calendar-2026')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const pathway = Number(url.searchParams.get('pathway'))

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

        let icsText: string
        if (cachedIcs && Date.now() - cachedIcs.fetchedAt < CACHE_TTL) {
          icsText = cachedIcs.text
        } else {
          const response = await fetch(ICS_URL)
          if (!response.ok) {
            return new Response(
              'Failed to fetch calendar data from upstream',
              { status: 502 },
            )
          }
          icsText = await response.text()
          cachedIcs = { text: icsText, fetchedAt: Date.now() }
        }

        const filtered = filterIcsByPathway(icsText, pathway)

        return new Response(filtered, {
          headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': `attachment; filename="griffiths-medical-calendar-2026-pathway-${pathway}.ics"`,
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
