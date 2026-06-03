import "./globals.css";

export const metadata = {
  title: "Kerr's Kitchens and Cabinets Cabinetry Visualiser",
  description: "Upload a room photo and generate cabinetry concept images."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-AU">
      <body>{children}</body>
    </html>
  );
} 

