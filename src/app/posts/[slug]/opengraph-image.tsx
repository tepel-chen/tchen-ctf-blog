import { getAllPosts, getPostBySlug } from "@/lib/api";
import { notFound } from "next/navigation";
import { Inter } from "next/font/google";
import cn from "classnames";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const alt = "OGP画像";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";
const inter = Inter({ subsets: ["latin"] });

export default async function OGPImage(props: Params) {
  const params = await props.params;
  const post = getPostBySlug(params.slug);

  if (!post) {
    return notFound();
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          fontFamily: "ui-sans-serif",
          color: "#a5f3fc",
          backgroundColor: "#083344",
          width: "100%",
          height: "100%",
          padding: "64px",
          fontSize: "2.5rem",
          flexDirection: "column",
        }}
      >
        <h1>{post.title}</h1>
        <div style={{ textAlign: "end", color: "#38bdf8", paddingLeft: "760px", paddingTop: "64px" }}>tchen's blog</div>
      </div>
    ),
    {
      ...size,
    }
  );
}

type Params = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const posts = getAllPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}
