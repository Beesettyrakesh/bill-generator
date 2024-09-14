'use client'
import "../css/TableRow.css"
import {IBankBranch} from "@/interfaces/IBankBranch";
import {useEffect, useState} from "react";
import generateDocument from "@/utils/generateDocument";
import calculateTotal from "@/utils/calculateTotal";

interface TableRowProps{
    branch: IBankBranch
}
const TableRow = (props: TableRowProps) => {
    const [branch] = useState(props.branch.name)
    const [date, setDate] = useState("");
    const [startReading, setStartReading] = useState("");
    const [endReading, setEndReading] = useState("");
    const [hours, setHours] = useState("");
    const [fuelPrice, setFuelPrice] = useState("");
    const [total, setTotal] = useState("");

    const reset = () => {
        setDate("")
        setStartReading("")
        setEndReading("")
        setHours("")
        setFuelPrice("")
    }

    useEffect(() => {
        if (hours && fuelPrice && branch){
            const billTotal: number = calculateTotal(Number(hours), Number(fuelPrice), branch)
            setTotal( billTotal.toFixed(2) )
        }
    }, [hours, fuelPrice, branch]);

    return(
        <>
            <tr className="bank-row">
                <td>{props.branch.name}</td>
                <td>
                    <input type="date"
                           value={date}
                           onChange={(event) => setDate(event.target.value)}
                    />
                </td>
                {
                    props.branch.template === "START_AND_END"
                        ? <td>
                            <input type="text"
                                   placeholder="Enter start reading"
                                   value={startReading}
                                   onChange={(event) => setStartReading(event.target.value)}
                            />
                          </td>
                        : <td></td>
                }
                {
                    props.branch.template === "START_AND_END"
                        ? <td>
                            <input type="text"
                                   placeholder="Enter end reading" value={endReading}
                                   onChange={(event) => setEndReading(event.target.value)}
                            />
                          </td>
                        : <td></td>
                }
                <td>
                    <input type="text"
                           placeholder="Enter no. of hrs"
                           value={hours}
                           onChange={(event) => setHours(event.target.value)}
                    />
                </td>
                <td>
                    <input type="text"
                           placeholder="Enter fuel price" value={fuelPrice}
                           onChange={(event) => setFuelPrice(event.target.value)}
                    />
                </td>
                <td>
                    {total}
                </td>
                <td>
                    <button onClick={() => generateDocument({
                        branch,
                        date,
                        startReading,
                        endReading,
                        hours,
                        fuelPrice,
                        total
                    })}>Generate Bill</button>
                </td>
                <td>
                    <button onClick={reset}>Reset</button>
                </td>
            </tr>
        </>
    )
}

export default TableRow;