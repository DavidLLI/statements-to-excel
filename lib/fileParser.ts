// File parsing utilities for PDF, Excel, and CSV

import pdfParse from "pdf-parse";
import * as XLSX from "xlsx";
import Papa from "papaparse";

export interface ParsedFileContent {
  text: string;
  type: "pdf" | "excel" | "csv";
  structuredData?: any;
}

export async function parseFile(file: File): Promise<ParsedFileContent> {
  try {
    const filename = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    if (buffer.length === 0) {
      throw new Error("File is empty");
    }

    if (filename.endsWith(".pdf")) {
      return await parsePDF(buffer);
    } else if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
      return await parseExcel(buffer);
    } else if (filename.endsWith(".csv")) {
      return await parseCSV(buffer);
    } else {
      throw new Error(`Unsupported file type: ${filename}`);
    }
  } catch (error) {
    console.error("File parsing error:", error);
    throw new Error(`Failed to parse file: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function parsePDF(buffer: Buffer): Promise<ParsedFileContent> {
  try {
    const data = await pdfParse(buffer);
    if (!data.text || data.text.trim().length === 0) {
      throw new Error("PDF appears to be empty or unreadable");
    }
    return {
      text: data.text,
      type: "pdf",
    };
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function parseExcel(buffer: Buffer): Promise<ParsedFileContent> {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error("Excel file appears to be empty or corrupted");
    }

    const sheets: any[] = [];

    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
      sheets.push({
        name: sheetName,
        data: jsonData,
      });
    });

    // Convert to text representation for Gemini
    const text = sheets
      .map(
        (sheet) =>
          `Sheet: ${sheet.name}\n${sheet.data
            .map((row: any[]) => row.join("\t"))
            .join("\n")}`
      )
      .join("\n\n");

    if (!text || text.trim().length === 0) {
      throw new Error("Excel file contains no readable data");
    }

    return {
      text,
      type: "excel",
      structuredData: sheets,
    };
  } catch (error) {
    console.error("Excel parsing error:", error);
    throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function parseCSV(buffer: Buffer): Promise<ParsedFileContent> {
  try {
    const text = buffer.toString("utf-8");
    
    if (!text || text.trim().length === 0) {
      throw new Error("CSV file is empty");
    }

    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors && parsed.errors.length > 0) {
      console.warn("CSV parsing warnings:", parsed.errors);
    }

    const structuredData = parsed.data;
    
    if (!structuredData || structuredData.length === 0) {
      throw new Error("CSV file contains no readable data");
    }

    const textRepresentation = structuredData
      .map((row: any) => Object.values(row).join("\t"))
      .join("\n");

    return {
      text: `CSV Data:\n${textRepresentation}`,
      type: "csv",
      structuredData,
    };
  } catch (error) {
    console.error("CSV parsing error:", error);
    throw new Error(`Failed to parse CSV file: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

