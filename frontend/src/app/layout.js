import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";

export const metadata = {
  title: "Miping Dashboard",
  description: "Modern Responsive Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
