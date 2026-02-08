import { createFileRoute } from '@tanstack/solid-router'
import { createSignal, For } from 'solid-js'
import { Copy, Check, Github } from 'lucide-solid'

export const Route = createFileRoute('/')({ component: App })

const ENDPOINT = '/ics'

function App() {
  const [copiedPathway, setCopiedPathway] = createSignal<number | null>(null)

  const copyLink = (pathway: number) => {
    const url = `${import.meta.env.VITE_SITE_URL}${ENDPOINT}?pathway=${pathway}&yearStarted=2026&cohort=sc`
    navigator.clipboard.writeText(url)
    setCopiedPathway(pathway)
    setTimeout(() => setCopiedPathway(null), 2000)
  }

  return (
    <div class="min-h-screen bg-gray-950 text-gray-100">
      <div class="max-w-3xl mx-auto px-6 py-16">
        <h1 class="text-3xl font-bold mb-3">
          Griffith Sunshine Coast Medical Calendar 2026
        </h1>
        <p class="text-gray-500 text-sm mb-2">
          Copy your pathway link below and add it as a calendar subscription in
          your calendar app (Google Calendar, Apple Calendar, Outlook, etc.).
          Events not matching your pathway are excluded; shared events are
          kept.
        </p>
        <p class="text-gray-500 text-sm mb-10">
          The links below update within minutes of the ics link provided by the
          university updating. Therefore the only limitation on how up-to-date
          they are is how often your calendar app refreshes subscribed calendars.
          Google Calendar and Outlook will refresh around once a day. Apple calendar
          will depend on user settings.
        </p>

        <div class="space-y-3">
          <For each={[1, 2, 3, 4, 5, 6]}>
            {(pathway) => (
              <div class="flex flex-wrap items-center justify-between gap-3 bg-gray-900 border border-gray-800 rounded-lg px-5 py-4">
                <div class="min-w-0 flex-1">
                  <h3 class="font-semibold text-gray-100">
                    Pathway {pathway}
                  </h3>
                  <p class="text-xs text-gray-500 font-mono">
                    {import.meta.env.VITE_SITE_URL}{ENDPOINT}?pathway={pathway}&yearStarted=2026&cohort=sc
                  </p>
                </div>
                <button
                  onClick={() => copyLink(pathway)}
                  class="shrink-0 flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  {copiedPathway() === pathway ? (
                    <>
                      <Check size={16} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copy Link
                    </>
                  )}
                </button>
              </div>
            )}
          </For>
        </div>
      </div>
      <a
        href="https://github.com/Yavonix/griffith-medical-calendar-pathways"
        target="_blank"
        rel="noopener noreferrer"
        class="fixed bottom-4 right-4 text-gray-600 hover:text-gray-400 transition-colors"
      >
        <Github size={24} />
      </a>
    </div>
  )
}
