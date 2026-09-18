import Header from "./Header";
import Sidebar from "./Sidebar";

type PageLayoutProps = {
  children: React.ReactNode;
};

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <>
      <Header />
      <Sidebar />
      <main>{children}</main>
    </>
  );
}