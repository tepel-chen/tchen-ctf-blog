import DateFormatter from "./date-formatter";
import { PostTitle } from "@/app/_components/post-title";

type Props = {
  title: string;
  date: string;
  lang: string;
};

export function PostHeader({ title, date, lang }: Props) {
  return (
    <>
      <PostTitle>{title}</PostTitle>
      <DateFormatter dateString={date} />
      <span className="bg-sky-200 dark:bg-sky-800 rounded-xl px-2 py-1 ml-4 text-sm">{lang}</span>
    </>
  );
}
