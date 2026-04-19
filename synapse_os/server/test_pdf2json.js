// Quick test of pdf2json
const PDFParser = require("pdf2json");
const fs = require("fs");

const pdfPath = "C:\\Users\\HP\\Downloads\\Python-OOP.pdf";
const buffer = fs.readFileSync(pdfPath);

const pdfParser = new PDFParser(null, 1);

pdfParser.on("pdfParser_dataError", (err) => {
  console.error("Error:", err.parserError);
});

pdfParser.on("pdfParser_dataReady", (pdfData) => {
  // Extract raw text
  const text = pdfParser.getRawTextContent();
  console.log("Extracted text length:", text.length);
  console.log("First 500 chars:\n", text.slice(0, 500));
});

pdfParser.parseBuffer(buffer);
