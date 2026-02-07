import { createFileRoute } from '@tanstack/solid-router'
import { createSignal, For } from 'solid-js'
import { Copy, Check } from 'lucide-solid'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const [copiedPathway, setCopiedPathway] = createSignal<number | null>(null)

  const copyLink = (pathway: number) => {
    const url = `${window.location.origin}/griffiths-medical-calendar-2026?pathway=${pathway}`
    navigator.clipboard.writeText(url)
    setCopiedPathway(pathway)
    setTimeout(() => setCopiedPathway(null), 2000)
  }

  return (
    <div class="min-h-screen bg-gray-950 text-gray-100">
      <div class="max-w-2xl mx-auto px-6 py-16">
        <h1 class="text-3xl font-bold mb-3">
          Griffith Medical Calendar 2026
        </h1>
        <p class="text-gray-400 mb-2">
          Subscribe to a filtered version of the Griffith University School of
          Medicine 2026 calendar that only includes events relevant to your
          pathway.
        </p>
        <p class="text-gray-500 text-sm mb-10">
          Copy your pathway link below and add it as a calendar subscription in
          your calendar app (Google Calendar, Apple Calendar, Outlook, etc.).
          Events not matching your pathway are excluded; shared events are
          kept.
        </p>

        <div class="space-y-3">
          <For each={[1, 2, 3, 4, 5, 6]}>
            {(pathway) => (
              <div class="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-5 py-4">
                <div class="min-w-0">
                  <h3 class="font-semibold text-gray-100">
                    Pathway {pathway}
                  </h3>
                  <p class="text-xs text-gray-500 font-mono truncate">
                    /griffiths-medical-calendar-2026?pathway={pathway}
                  </p>
                </div>
                <button
                  onClick={() => copyLink(pathway)}
                  class="ml-4 shrink-0 flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 rounded-lg text-sm font-medium transition-colors cursor-pointer"
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
    </div>
  )
}
