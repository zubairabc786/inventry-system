// "use client";
// import React, { useState } from "react";

// const page = () => {
//   //   const [number1, setNumber1] = useState(0);
//   //   const [number2, setNumber2] = useState(0);
//   const [total, setTotal] = useState(0);

//   const handleSubmit = (formData) => {
//     // e.preventDefault();
//     const value1 = Number(formData.get("number1"));
//     const value2 = Number(formData.get("number2"));
//     setTotal(value1 + value2);
//   };
//   return (
//     <div>
//       <form action={handleSubmit}>
//         <input
//           placeholder="Number 1"
//           name="number1"
//           type="text"
//           //   onChange={(e) => setNumber1(e.target.value)}
//         />
//         <input
//           placeholder="Number 2"
//           type="text"
//           name="number2"
//           //   onChange={(e) => setNumber2(e.target.value)}
//         />
//         <button type="submit">Add</button>
//       </form>
//       <p>Total:{total}</p>
//     </div>
//   );
// };

// export default page;
// "use client";
// import React, { useState } from "react";

// const page = () => {
//   const [number1, setNumber1] = useState(0);
//   const [number2, setNumber2] = useState(0);
//   const [total, setTotal] = useState(0);
//   const [add, setAdd] = useState([
//     {
//       number1: 0,
//       number2: 0,
//       total: 0,
//     },
//   ]);
//   const handleSubmit = (e) => {
//     e.preventDefault();
//     const value1 = Number(number1);
//     const value2 = Number(number2);
//     setAdd([
//       ...add,
//       { number1: number1, number2: number2, total: value1 + value2 },
//     ]);
//   };
//   return (
//     <div>
//       {add.map((item, index) => (
//         <form onSubmit={handleSubmit} key={index}>
//           <input
//             type="text"
//             placeholder="number1"
//             onChange={(e) => setNumber1(e.target.value)}
//           />
//           <input
//             type="text"
//             placeholder="number2"
//             onChange={(e) => setNumber2(e.target.value)}
//           />
//           <button type="submit">Add</button>
//         </form>
//       ))}
//       <p>Total:{total}</p>
//     </div>
//   );
// };

// export default page;

///////////// Add two number and create Add number

// "use client";

// import { useState } from "react";

// export default function Home() {
//   //   const [inputPairs, setInputPairs] = useState([{ a: "", b: "", sum: 0 }]);
//   const [inputPairs, setInputPairs] = useState([{ a: "", b: "", sum: 0 }]);

//   //   const handleAddPair = () => {
//   //     setInputPairs([...inputPairs, { a: "", b: "", sum: 0 }]);
//   //   };

//   const handleAddPair = () => {
//     setInputPairs([...inputPairs, { a: "", b: "", sum: 0 }]);
//   };

//   const handleChange = (index, field, value) => {
//     const newPairs = [...inputPairs];
//     // console.log(newPairs);
//     newPairs[index][field] = value;
//     // console.log((newPairs[index][field] = value));
//     // console.log("newPairs=", newPairs);
//     const a = parseFloat(newPairs[index].a) || 0;
//     // console.log("a=", a);
//     const b = parseFloat(newPairs[index].b) || 0;
//     newPairs[index].sum = a + b;

//     setInputPairs(newPairs);
//   };

//   return (
//     <div className="p-4">
//       <button
//         onClick={handleAddPair}
//         className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
//       >
//         Add
//       </button>

//       {/* {inputPairs.map((pair, index) => (
//         <div key={index} className="mb-4 space-y-2">
//           <input
//             type="number"
//             value={pair.a}
//             onChange={(e) => handleChange(index, "a", e.target.value)}
//             className="border p-2 mr-2"
//             placeholder="Enter a"
//           />
//           <input
//             type="number"
//             value={pair.b}
//             onChange={(e) => handleChange(index, "b", e.target.value)}
//     ()        className="border p-2"
//             placeholder="Enter b"
//           />
//           <div className="mt-1 text-green-600 font-medium">Sum: {pair.sum}</div>
//         </div>
//       ))} */}
//     </div>
//   );
// }

"use client";

import React, { useEffect, useState } from "react";
import { getDropdownDataJornal } from "../action/action";
const AddPair = () => {
  const [inputPairs, setInputPairs] = useState([{ a: "", b: "", sum: 0 }]);
  const handleAddPair = () => {
    setInputPairs([...inputPairs, { a: "", b: "", sum: 0 }]);
  };
  const handleChange = (index, field, value) => {
    const newPairs = [...inputPairs];
    newPairs[index][field] = value;
    const a = parseFloat(newPairs[index].a) || 0;
    const b = parseFloat(newPairs[index].b) || 0;
    newPairs[index].sum = a + b;
    setInputPairs(newPairs);
  };
  useEffect(() => {
    const getData = async () => {
      const data = await getDropdownDataJornal();
      console.log(data);
    };
    getData();
  }, []);
  return (
    <div>
      <button onClick={handleAddPair}>Add Pairs</button>
      {inputPairs.map((pair, index) => (
        <div>
          <input
            type="number"
            value={pair.a}
            onChange={(e) => handleChange(index, "a", e.target.value)}
            placeholder="Enter value for A"
          />
          <input
            type="number"
            value={pair.b}
            onChange={(e) => handleChange(index, "b", e.target.value)}
            placeholder="Enter value for B"
          />
          <div>Sum:{pair.sum}</div>
        </div>
      ))}
    </div>
  );
};

export default AddPair;
