import React from "react";

export const metadata = {
  title: "Login Page",
  description: "Login to Moodle"
}

export default function RootLayout({ children }:{ children: React.ReactNode}){
  return (
    <html lang="en">
      <head>
        <link rel="icon" href = "/favicon.ico" />
      </head>
      <body className="bg-gray-100 text-gray-900 min-h-screen flex items-center justify-center">
        {children}
      </body>
    </html>
  )
}