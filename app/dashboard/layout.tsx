// import {PostAddButton} from "@/components/postaddbutton"
import {PostAddButton} from "@/components/create_form/callbutton"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      {/* <PostAddButton/> */}
      <PostAddButton />
      <div className="inline-block text-center justify-center">
        {children}
      </div>
    </section>
  );
}
