import Table from "@/components/Table";
import DocumentList from "@/components/DocumentList";

export default function Home() {
  return (
    <div className="w-full max-w-[95%] mx-auto py-2 space-y-6">
      <Table />
      <DocumentList />
    </div>
  );
}
