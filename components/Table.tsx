import TableRow from "@/components/TableRow";
import "../css/Table.css"

import branchData from "../branches.json";

const Table = () => {
    return(
        <>
            <table className="banks-table">
                <thead>
                <tr className="bank-table-rows">
                    <th>Branch</th>
                    <th>Date</th>
                    <th>Start reading</th>
                    <th>End reading</th>
                    <th>Total Hours</th>
                    <th>Fuel Price</th>
                    <th>Fuel consumption/Hour</th>
                    <th>Total</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {branchData.map((branch) => (
                    <TableRow key={branch.id}
                              branch={branch}
                    />
                ))}

                </tbody>
            </table>
        </>
    )
}

export default Table;