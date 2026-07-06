import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getAppBaseUrl,
  getForumBaseUrl,
  isAppHost,
  isForumHost,
} from "@/lib/constants/urls";

function shouldRewriteToForum(pathname: string): boolean {
  return (
    !pathname.startsWith("/forum") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/auth") &&
    pathname !== "/sitemap.xml" &&
    pathname !== "/robots.txt"
  );
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value);
  });
}

export async function updateSession(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const forumSite = isForumHost(host);
  const appSite = isAppHost(host);
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;

  // Ana site domaininde forum yolu açılırsa forum domainine yönlendir
  if (appSite && pathname.startsWith("/forum")) {
    const forumPath = pathname.replace(/^\/forum/, "") || "/";
    const destination =
      forumPath === "/"
        ? getForumBaseUrl()
        : `${getForumBaseUrl()}${forumPath}`;
    return NextResponse.redirect(`${destination}${search}`);
  }

  // Forum domaininde panel ve içerik sayfaları ana siteye yönlendirilir
  if (forumSite && (pathname.startsWith("/dashboard") || pathname.startsWith("/content"))) {
    return NextResponse.redirect(`${getAppBaseUrl()}${pathname}${search}`);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage = pathname.startsWith("/auth");
  const isDashboard = pathname.startsWith("/dashboard");

  if (!user && isDashboard) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    const redirect = url.searchParams.get("redirect");
    if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
      url.pathname = redirect;
      url.search = "";
    } else {
      url.pathname = forumSite ? "/forum" : "/dashboard";
      url.search = "";
    }
    return NextResponse.redirect(url);
  }

  if (forumSite && shouldRewriteToForum(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/forum" : `/forum${pathname}`;
    const rewriteResponse = NextResponse.rewrite(url);
    copyCookies(supabaseResponse, rewriteResponse);
    return rewriteResponse;
  }

  return supabaseResponse;
}
