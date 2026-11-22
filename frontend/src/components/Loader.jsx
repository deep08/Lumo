import { useEffect, useState } from "react";
import dotA from "../assets/loader-a.svg";
import dotB from "../assets/loader-b.svg";
import dotC from "../assets/loader-c.svg";

const FRAMES = [
  [dotA, dotB, dotC],
  [dotB, dotA, dotC],
  [dotB, dotC, dotA],
];

export default function Loader() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFrame((current) => (current + 1) % FRAMES.length);
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <span className="loader" aria-hidden="true">
      {FRAMES[frame].map((src, index) => (
        <img key={`${frame}-${index}`} src={src} alt="" />
      ))}
    </span>
  );
}
