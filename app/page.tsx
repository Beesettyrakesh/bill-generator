import Table from "@/components/Table";
import DocumentList from "@/components/DocumentList";
import FuelPriceManager from "@/components/FuelPriceManager";

export default function Home() {
  return (
      <>
        <div className="app-header">
          <h1>Bill Generator</h1>
          <FuelPriceManager />
        </div>
        <Table />
        <DocumentList />
      </>
  );
}
