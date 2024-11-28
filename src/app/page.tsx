import Container from "@/app/_components/container";
import { Home } from "@/app/_components/home";
import { Post } from "@/interfaces/post";
import { getAllPosts } from "@/lib/api";
import { Pagenation } from "./_components/pagenation";


type Props = {
  posts: Post[];
  currentPage: number;
  totalPages: number;
};


export default function Index({ searchParams }: { searchParams: { page: string } }) {

  const allPosts = getAllPosts(); 
  const postsPerPage = 10; 

  const currentPage = parseInt(searchParams.page || "1", 10);

  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const posts = allPosts.slice(startIndex, endIndex);

  const totalPages = Math.ceil(allPosts.length / postsPerPage);

  return (
    <main>
      <Container>
        {posts.length > 0 && <Home posts={posts} />}
        <Pagenation currentPage={currentPage} totalPages={totalPages} pathAndQuery={"?page="} />
      </Container>
    </main>
  );
}
