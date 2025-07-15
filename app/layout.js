import "./globals.css";
import { Inter } from "next/font/google";
// import Navbar from "./components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "FoodieHub - Food Delivery App",
  description: "Order your favorite food online",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* <Navbar /> */}

        <div className="pt-20">{children}</div>
      </body>
    </html>
  );
}
