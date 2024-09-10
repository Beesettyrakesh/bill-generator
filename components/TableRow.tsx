import "../css/TableRow.css"
import {BankBranchInterface} from "@/interfaces/BankBranchInterface";

interface TableRowProps{
    branch: BankBranchInterface
}
const TableRow = (props: TableRowProps) => {
    return(
        <>
            <tr className="bank-row">
                <td>{props.branch.name}</td>
                <td><input type="date"/></td>
                <td><input type="text" placeholder="Enter start reading"/></td>
                <td><input type="text" placeholder="Enter end reading"/></td>
                <td><input type="text" placeholder="Enter no. of hrs"/></td>
                <td><input type="text" placeholder="Enter fuel price"/></td>
                <td><input type="text" placeholder="fuel/hr"/></td>
                <td>{0.00}</td>
            </tr>
        </>
    )
}

export default TableRow;