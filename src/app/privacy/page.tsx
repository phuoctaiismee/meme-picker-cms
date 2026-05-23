"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShieldKeyIcon,
  InformationCircleIcon,
  Mail01Icon,
  Tick01Icon
} from "@hugeicons/core-free-icons";
import { ThemeToggle } from "@/components/theme-toggle";

type Language = "en" | "vi";

export default function PrivacyPolicyPage() {
  const [lang, setLang] = React.useState<Language>("vi");

  const toggleLang = (target: Language) => {
    setLang(target);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Decorative background grid and gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[300px] bg-gradient-to-b from-primary/5 via-primary/0 to-transparent blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="group flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              {/* Inline SVG back arrow */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4 group-hover:-translate-x-0.5 transition-transform"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              <span>CMS Login</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/60">
              <button
                onClick={() => toggleLang("vi")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${lang === "vi"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Tiếng Việt
              </button>
              <button
                onClick={() => toggleLang("en")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${lang === "en"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                English
              </button>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-3xl mx-auto px-4 py-12 relative z-10">
        {/* Page Header */}
        <div className="text-center space-y-4 mb-10">
          <div className="inline-flex relative size-20 items-center justify-center rounded-2xl overflow-hidden bg-primary/5 border border-primary/10 shadow-md">
            <Image
              src="/images/branding/icon.png"
              alt="Meme Picker Logo"
              fill
              className="object-contain p-2"
              priority
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">
              {lang === "vi" ? "Chính Sách Quyền Riêng Tư" : "Privacy Policy"}
            </h1>
            <p className="text-sm font-bold text-primary uppercase tracking-widest flex items-center justify-center gap-1">
              <HugeiconsIcon icon={ShieldKeyIcon} className="size-4" />
              Meme Picker: Smart Meme Keyboard
            </p>
            <p className="text-xs text-muted-foreground">
              {lang === "vi" ? "Cập nhật lần cuối: 23 tháng 5, 2026" : "Last updated: May 23, 2026"}
            </p>
          </div>
        </div>

        {/* Dynamic content rendering based on selected language */}
        {lang === "vi" ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Core statement card */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <HugeiconsIcon icon={Tick01Icon} className="size-5 shrink-0" />
                <h2>Cam kết không thu thập dữ liệu người dùng</h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Chúng tôi đặt quyền riêng tư của bạn lên hàng đầu. Tiện ích mở rộng Chrome{" "}
                <strong className="text-foreground">Meme Picker</strong> hoạt động hoàn toàn dưới cơ chế
                cục bộ trên trình duyệt của bạn. Tiện ích này{" "}
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold underline">
                  không thu thập, lưu trữ, truyền tải hoặc chia sẻ
                </span>{" "}
                bất kỳ thông tin cá nhân, lịch sử duyệt web, phím nhấn, thông tin đăng nhập, hay các nội
                dung hội thoại của bạn.
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-6">
              {/* Section 1: Data Collection */}
              <section className="rounded-xl border bg-card p-6 space-y-3">
                <div className="flex items-center gap-2.5 font-bold text-lg text-foreground">
                  <div className="p-1.5 rounded-lg bg-primary/5 text-primary border border-primary/10 flex items-center justify-center">
                    {/* Inline Lock Icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-4"
                    >
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <h3>1. Thu thập và Sử dụng Dữ liệu</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tiện ích không yêu cầu tài khoản và không có bất kỳ hệ thống thu thập thông tin người dùng
                  nào. Toàn bộ tính năng hoạt động trực tiếp trên máy của bạn:
                </p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Không thu thập địa chỉ IP của người dùng.</li>
                  <li>Không ghi lại lịch sử duyệt web hoặc các trang bạn truy cập.</li>
                  <li>Không chụp ảnh màn hình hoặc ghi nhận thông tin nhập liệu từ bàn phím.</li>
                </ul>
              </section>

              {/* Section 2: Permissions Explained */}
              <section className="rounded-xl border bg-card p-6 space-y-3">
                <div className="flex items-center gap-2.5 font-bold text-lg text-foreground">
                  <div className="p-1.5 rounded-lg bg-primary/5 text-primary border border-primary/10 flex items-center justify-center">
                    <HugeiconsIcon icon={ShieldKeyIcon} className="size-4" />
                  </div>
                  <h3>2. Giải thích quyền truy cập của Tiện ích</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Để cung cấp tính năng dán meme trực tiếp vào khung soạn thảo trên mạng xã hội, Chrome
                  Extension yêu cầu một số quyền tối thiểu sau:
                </p>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      • Quyền truy cập Trang Web (Host Permissions)
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-3 border-l-2 border-primary/20">
                      Áp dụng cho <code className="bg-muted px-1 py-0.5 rounded">facebook.com</code> và{" "}
                      <code className="bg-muted px-1 py-0.5 rounded">twitter.com / x.com</code>. Quyền này chỉ dùng để
                      tích hợp nút chọn Meme kế bên nút emoji/GIF mặc định của mạng xã hội, giúp bạn chèn ảnh meme
                      ngay lập tức. Tiện ích không can thiệp hay đọc bất kỳ bài viết hoặc tin nhắn nào.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      • Quyền Clipboard (clipboardRead / clipboardWrite)
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-3 border-l-2 border-primary/20">
                      Cho phép tiện ích sao chép hình ảnh meme bạn chọn vào khay nhớ tạm để tự động dán vào khung bình
                      luận hoặc khung đăng bài. Tiện ích không bao giờ đọc dữ liệu nhạy cảm sẵn có trong Clipboard của bạn.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      • Quyền Bộ nhớ đệm (Storage)
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-3 border-l-2 border-primary/20">
                      Dùng để ghi nhớ cấu hình ngôn ngữ, giao diện và danh sách meme đã chọn gần đây ngay trên trình duyệt
                      của bạn, giúp việc tải dữ liệu nhanh hơn thông qua cơ chế Stale-While-Revalidate (SWR). Dữ liệu này
                      không được gửi đi bất cứ đâu.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 3: Third-Party & Networks */}
              <section className="rounded-xl border bg-card p-6 space-y-3">
                <div className="flex items-center gap-2.5 font-bold text-lg text-foreground">
                  <div className="p-1.5 rounded-lg bg-primary/5 text-primary border border-primary/10 flex items-center justify-center">
                    {/* Inline Database Icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-4"
                    >
                      <ellipse cx="12" cy="5" rx="9" ry="3" />
                      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                      <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
                    </svg>
                  </div>
                  <h3>3. Truy vấn Mạng và Dịch vụ liên kết</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tiện ích gửi yêu cầu API đến máy chủ CMS của chúng tôi để cập nhật danh sách hình ảnh meme mới nhất.
                  Các yêu cầu này hoàn toàn ẩn danh, không mang theo bất kỳ mã nhận diện định danh người dùng nào và
                  không theo dõi thói quen sử dụng của bạn.
                </p>
              </section>

              {/* Section 4: Contact */}
              <section className="rounded-xl border bg-card p-6 space-y-3">
                <div className="flex items-center gap-2.5 font-bold text-lg text-foreground">
                  <div className="p-1.5 rounded-lg bg-primary/5 text-primary border border-primary/10 flex items-center justify-center">
                    <HugeiconsIcon icon={Mail01Icon} className="size-4" />
                  </div>
                  <h3>4. Liên hệ & Hỗ trợ</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Nếu bạn có bất kỳ câu hỏi nào về chính sách quyền riêng tư này hoặc tính năng của Meme Picker, vui
                  lòng liên hệ với nhà phát triển qua email:
                </p>
                <div className="inline-flex items-center gap-2 text-sm font-semibold bg-muted px-3 py-1.5 rounded-lg border">
                  <HugeiconsIcon icon={Mail01Icon} className="size-4 text-primary" />
                  <a href="mailto:imphuoctai@gmail.com" className="hover:underline">
                    imphuoctai@gmail.com
                  </a>
                </div>
              </section>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Core statement card */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <HugeiconsIcon icon={Tick01Icon} className="size-5 shrink-0" />
                <h2>No User Data Collection Assured</h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Your privacy is our utmost priority. The <strong className="text-foreground">Meme Picker</strong>{" "}
                Chrome Extension operates entirely locally inside your browser. The extension{" "}
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold underline">
                  does not collect, store, transmit, or share
                </span>{" "}
                any personal information, browsing history, keystrokes, social credentials, or media assets.
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-6">
              {/* Section 1: Data Collection */}
              <section className="rounded-xl border bg-card p-6 space-y-3">
                <div className="flex items-center gap-2.5 font-bold text-lg text-foreground">
                  <div className="p-1.5 rounded-lg bg-primary/5 text-primary border border-primary/10 flex items-center justify-center">
                    {/* Inline Lock Icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-4"
                    >
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <h3>1. Data Collection and Usage</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  No accounts are required, and we have built no database or tracking mechanisms to collect user metrics.
                  All features process tasks strictly on your device:
                </p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>No IP addresses are recorded or tracked.</li>
                  <li>No browsing history is logged or accessed.</li>
                  <li>No keystrokes, messages, or screen captures are recorded.</li>
                </ul>
              </section>

              {/* Section 2: Permissions Explained */}
              <section className="rounded-xl border bg-card p-6 space-y-3">
                <div className="flex items-center gap-2.5 font-bold text-lg text-foreground">
                  <div className="p-1.5 rounded-lg bg-primary/5 text-primary border border-primary/10 flex items-center justify-center">
                    <HugeiconsIcon icon={ShieldKeyIcon} className="size-4" />
                  </div>
                  <h3>2. Requested Extension Permissions</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  To insert memes seamlessly into comments and tweets, the extension requests a minimal set of permissions:
                </p>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      • Host / Website Permissions
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-3 border-l-2 border-primary/20">
                      Applies exclusively to <code className="bg-muted px-1 py-0.5 rounded">facebook.com</code> and{" "}
                      <code className="bg-muted px-1 py-0.5 rounded">twitter.com / x.com</code>. This permission is used
                      solely to embed the picker button alongside the native emoji/GIF box. The extension does not read
                      your feeds, posts, or private messages.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      • Clipboard (clipboardRead / clipboardWrite)
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-3 border-l-2 border-primary/20">
                      Allows copying your selected meme to the clipboard so it can be pasted automatically into the text
                      composer. No unrelated clipboard history or sensitive clipboard data is accessed.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      • Storage Permission
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-3 border-l-2 border-primary/20">
                      Stores language options, theme preferences, and cached meme references locally on your device using
                      Stale-While-Revalidate (SWR) cache. None of this data is sent over the network.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 3: Third-Party & Networks */}
              <section className="rounded-xl border bg-card p-6 space-y-3">
                <div className="flex items-center gap-2.5 font-bold text-lg text-foreground">
                  <div className="p-1.5 rounded-lg bg-primary/5 text-primary border border-primary/10 flex items-center justify-center">
                    {/* Inline Database Icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-4"
                    >
                      <ellipse cx="12" cy="5" rx="9" ry="3" />
                      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                      <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
                    </svg>
                  </div>
                  <h3>3. Network & API Communications</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The extension communicates with our CMS server solely to fetch the latest list of available memes.
                  These requests are anonymous and do not contain any session IDs, cookies, tracking tokens, or personal identifiers.
                </p>
              </section>

              {/* Section 4: Contact */}
              <section className="rounded-xl border bg-card p-6 space-y-3">
                <div className="flex items-center gap-2.5 font-bold text-lg text-foreground">
                  <div className="p-1.5 rounded-lg bg-primary/5 text-primary border border-primary/10 flex items-center justify-center">
                    <HugeiconsIcon icon={Mail01Icon} className="size-4" />
                  </div>
                  <h3>4. Contact & Support</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If you have questions regarding this Privacy Policy or the operations of Meme Picker, please feel free to reach out to the developer:
                </p>
                <div className="inline-flex items-center gap-2 text-sm font-semibold bg-muted px-3 py-1.5 rounded-lg border">
                  <HugeiconsIcon icon={Mail01Icon} className="size-4 text-primary" />
                  <a href="mailto:imphuoctai@gmail.com" className="hover:underline">
                    imphuoctai@gmail.com
                  </a>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 bg-muted/20">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            &copy; 2026 Meme Picker. All rights reserved.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs font-semibold text-muted-foreground">
            <Link href="/login" className="hover:text-foreground">
              CMS Dashboard
            </Link>
            <span>&bull;</span>
            <span className="text-emerald-600 dark:text-emerald-400">Privacy Policy Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
