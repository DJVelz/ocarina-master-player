import { testSong } from "@/data/testSong";
import SheetView from "@/components/music/SheetView";
import { buildSongTimeline } from "@/lib/music/timeline";

export default function Home() {

  const timeline = buildSongTimeline(testSong);

  console.log(timeline);
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <p className="mb-2 text-sm font-medium text-cyan-400">
          Ocarina Trainer
        </p>

        <h1 className="text-4xl font-bold">
          {testSong.title}
        </h1>

        <p className="mt-2 text-slate-400">
          {testSong.tempo} BPM ·{" "}
          {testSong.timeSignature.beats}/
          {testSong.timeSignature.beatValue} ·{" "}
          {testSong.instrument}
        </p>

        <section className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">
            Sheet Music
          </h2>

          <SheetView song={testSong} />
        </section>
      </div>
    </main>
  );
}