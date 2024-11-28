import Link from "next/link";
import DateFormatter from "./date-formatter";

type Props = {
  title: string;
  date: string;
  slug: string;
  lang: string;
};

export function PostPreview({
  title,
  date,
  slug,
  lang,
}: Props) {
  return (
    <div>
      <h3 className="text-3xl mb-3 leading-snug">
        <Link href={`/posts/${slug}`} className="hover:underline">
          {title}
        </Link>
      </h3>
      <div className="text-lg mb-4">
        <DateFormatter dateString={date} />
        <span className="bg-sky-200 dark:bg-sky-800 rounded-xl px-2 py-1 ml-4 text-sm">{lang}</span>
      </div>
    </div>
  );
}
