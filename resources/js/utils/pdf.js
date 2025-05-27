// Direct imports of both libraries
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Export a function that creates a properly configured jsPDF instance
export default function createPdf(options = {}) {
  const doc = new jsPDF(options);
  // Ensure autoTable is available on this instance
  doc.autoTable = function(...args) {
    return autoTable(this, ...args);
  };
  return doc;
}