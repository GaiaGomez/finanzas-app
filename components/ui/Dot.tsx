import { COLOR_CAT } from "@/lib/utils";
interface Props { cat: string; }
export default function Dot({ cat }: Props) {
  return (
    <span
      className="inline-block flex-shrink-0 rounded-full"
      style={{ width: 8, height: 8, background: COLOR_CAT[cat] ?? "#64748b" }}
    />
  );
}
