import Header from "@/components/Header/Header";

export default function BaseLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal?: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      {children}
      {modal}
    </>
  );
}
