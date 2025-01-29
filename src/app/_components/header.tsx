import Link from "next/link";

const Header = () => {
  return (
    <div className="flex mb-20 mt-8">
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight md:tracking-tighter leading-tight mr-12 flex items-center">
        <Link href="/" className="hover:underline">
          tchen's blog
        </Link>
        .
      </h2>
      <div className="flex bg-cyan-50 px-4 py-1 rounded-full ml-80 mt-4">
        <a href="https://github.com/tepel-chen" className="mx-3 mt-0.5">
          <img src="/assets/github-mark.svg" height="24" width="24" />
        </a>
        <a href="https://x.com/tepelchen501" className="mx-3 mt-1">
          <img src="/assets/x-mark.png" height="22" width="22" />
        </a>
        <a href="https://www.youtube.com/@t-chen7013" className="mx-3">
          <img src="/assets/youtube-mark.svg" height="32" width="32" />
        </a>
      </div>
    </div>
  );
};

export default Header;
