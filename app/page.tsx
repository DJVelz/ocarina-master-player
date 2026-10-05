import { testSong } from "@/data/testSong";
import { durationInBeats } from "@/lib/music/timing";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <p className="mb-2 text-sm font-medium text-cyan-400">Ocarina Master Player</p>
        <h1 className="text-4xl font-bold">{testSong.title}</h1>
        <p className="mt-2 text-slate-400">
          {testSong.tempo} BPM · {testSong.timeSignature.beats}/{testSong.timeSignature.beatValue} · {testSong.instrument}
        </p>
        <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Initial song data</h2>
          <div className="mt-4 space-y-4">
            {testSong.measures.map((measure) => (
              <div key={measure.number}>
                <h3 className="mb-2 text-sm font-medium text-slate-400">Measure {measure.number}</h3>
                <div className="flex flex-wrap gap-3">
                  {measure.notes.map((note) => (
                    <div key={note.id} className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3">
                      <div className="font-semibold">{note.pitch}</div>
                      <div className="text-sm text-slate-400">
                        {note.duration}{note.dotted ? " · dotted" : ""} · {durationInBeats(note)} beat{durationInBeats(note) === 1 ? "" : "s"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
