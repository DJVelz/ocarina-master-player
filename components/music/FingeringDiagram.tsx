"use client";

type FingeringDiagramProps = {
  holes: boolean[];
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: {
    container: "w-10",
    hole: "h-2.5 w-2.5",
  },
  md: {
    container: "w-14",
    hole: "h-3.5 w-3.5",
  },
  lg: {
    container: "w-20",
    hole: "h-5 w-5",
  },
};

export default function FingeringDiagram({
  holes,
  size = "md",
}: FingeringDiagramProps) {
  const sizes = sizeClasses[size];

  return (
    <div
      className={`${sizes.container} flex flex-wrap justify-center gap-1`}
    >
      {holes.map((covered, index) => (
        <div
          key={index}
          className={[
            sizes.hole,
            "rounded-full border",
            covered
              ? "border-slate-950 bg-slate-950"
              : "border-white bg-white",
          ].join(" ")}
        />
      ))}
    </div>
  );
}