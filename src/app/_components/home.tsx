import { Post } from "@/interfaces/post";
import { PostPreview } from "./post-preview";
import Header from "./header";

type Props = {
  posts: Post[];
};

export function Home({ posts }: Props) {
  return (
    <section>
      <Header></Header>
      
      <div className="grid grid-cols-1 gap-y-8 md:gap-y-12 mb-12">
        {posts.map((post) => (
          <PostPreview
            key={post.slug}
            title={post.title}
            date={post.date}
            slug={post.slug}
            lang={post.lang}
          />
        ))}
      </div>
    </section>
  );
}
