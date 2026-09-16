import type { Student } from "@/lib/supabase";
import { fmtDate } from "@/lib/hours";

export type ReportRow = { label: string; coverage: string; tasks: string; learnings: string };

type Props = {
  student: Student;
  hours: number;
  rows: ReportRow[];
  onEdit: (i: number, field: "tasks" | "learnings", value: string) => void;
};

const b = "1px solid #000";
const B = "2px solid #000";
const lbl: React.CSSProperties = { fontWeight: 700, fontSize: "9pt", padding: "2px 6px", borderRight: b, borderBottom: b, width: "22%", lineHeight: 1.05, textTransform: "uppercase" };
const val: React.CSSProperties = { fontSize: "10pt", padding: "2px 8px", borderBottom: b };

function Cell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <td style={{ borderRight: b, borderBottom: b, verticalAlign: "top", padding: 0 }}>
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onChange(e.currentTarget.innerText)}
        style={{ whiteSpace: "pre-wrap", fontSize: "9.5pt", lineHeight: 1.35, padding: "6px 8px", minHeight: "100%", outline: "none" }}
      >
        {value}
      </div>
    </td>
  );
}

function Header() {
  return (
    <div style={{ textAlign: "right", fontSize: "8pt", fontStyle: "italic", lineHeight: 1.15, marginBottom: 4 }}>
      FM-AA-INT-19<br />Rev. 1<br />14-Oct-2024
    </div>
  );
}

export default function ReportTemplate({ student, hours, rows, onEdit }: Props) {
  const page1 = rows.slice(0, 2);
  const page2 = rows.slice(2, 4);
  const d = (iso: string | null) => (iso ? fmtDate(iso, { month: "long", day: "numeric", year: "numeric" }) : "");
  const rowH = "92mm";

  const weekRow = (r: ReportRow, i: number) => (
    <tr key={i} style={{ height: rowH }}>
      <td style={{ borderRight: b, borderBottom: b, verticalAlign: "middle", fontSize: "9pt", padding: "4px 6px" }}>
        {r.label}<br />({r.coverage})
      </td>
      <Cell value={r.tasks} onChange={(v) => onEdit(i, "tasks", v)} />
      <Cell value={r.learnings} onChange={(v) => onEdit(i, "learnings", v)} />
    </tr>
  );

  return (
    <div className="report-root" style={{ color: "#000", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <style>{`
        @page { size: A4; margin: 10mm 12mm; }
        .report-page { background:#fff; width: 210mm; min-height: 297mm; padding: 10mm 12mm; margin: 0 auto 16px; box-shadow: 0 4px 24px rgba(0,0,0,.12); box-sizing: border-box; }
        .report-page table { border-collapse: collapse; width: 100%; table-layout: fixed; }
        @media print {
          .report-page { box-shadow: none; margin: 0; padding: 0; width: auto; min-height: auto; page-break-after: always; }
          .report-page:last-child { page-break-after: auto; }
        }
        @media screen and (max-width: 820px) { .report-scale { zoom: .45; } }
      `}</style>
      <div className="report-scale">
        {/* Page 1 */}
        <div className="report-page">
          <Header />
          <div style={{ border: B }}>
            <table>
              <tbody>
                <tr>
                  <td style={{ width: "13%", borderRight: B, borderBottom: B, textAlign: "center", padding: 4 }}>
                    <img src="/psu-logo.png" alt="" style={{ width: "22mm", height: "22mm", objectFit: "contain" }} onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
                  </td>
                  <td style={{ borderBottom: B, textAlign: "center", padding: 6 }}>
                    <div style={{ fontSize: "17pt", fontWeight: 700 }}>PRACTICUM/INTERNSHIP WEEKLY REPORT</div>
                    <div style={{ fontSize: "8pt" }}>PANGASINAN STATE UNIVERSITY</div>
                    <div style={{ fontSize: "8pt", fontStyle: "italic", fontWeight: 700, textDecoration: "underline" }}>
                      {student.campus ? `${student.campus} Campus` : "_________Campus"}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <table>
              <tbody>
                <tr><td style={lbl}>Name of Student-Intern</td><td style={val}>{student.name}</td></tr>
                <tr><td style={lbl}>Internship Instructor</td><td style={val}>{student.instructor}</td></tr>
                <tr><td style={lbl}>Name of Company</td><td style={val}>{student.company}</td></tr>
                <tr style={{ height: "11mm" }}><td style={lbl}>Job Description</td><td style={val}>{student.job_description}</td></tr>
                <tr><td style={lbl}>Start Date</td><td style={val}>{d(student.start_date)}</td></tr>
                <tr><td style={lbl}>End Date</td><td style={val}>{d(student.end_date)}</td></tr>
                <tr><td style={{ ...lbl, borderBottom: B }}>Number of Hours</td><td style={{ ...val, borderBottom: B }}>{hours.toFixed(2)} hours</td></tr>
              </tbody>
            </table>
            <table>
              <colgroup><col style={{ width: "20.5%" }} /><col style={{ width: "39%" }} /><col /></colgroup>
              <tbody>
                <tr style={{ fontSize: "9pt", fontWeight: 700, textAlign: "center" }}>
                  <td style={{ borderRight: b, borderBottom: b, padding: 2 }}>DATE</td>
                  <td style={{ borderRight: b, borderBottom: b, padding: 2 }}>TASKS ACCOMPLISHED</td>
                  <td style={{ borderBottom: b, padding: 2 }}>KNOWLEDGE, SKILLS, VALUES LEARNED</td>
                </tr>
                {page1.map((r, i) => weekRow(r, i))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Page 2 */}
        <div className="report-page">
          <Header />
          <div style={{ border: B }}>
            <table>
              <colgroup><col style={{ width: "20.5%" }} /><col style={{ width: "39%" }} /><col /></colgroup>
              <tbody>
                {page2.map((r, i) => weekRow(r, i + 2))}
                {page2.length < 2 &&
                  Array.from({ length: 2 - page2.length }).map((_, k) => (
                    <tr key={`blank${k}`} style={{ height: "80mm" }}>
                      <td style={{ borderRight: b, borderBottom: b }} /><td style={{ borderRight: b, borderBottom: b }} /><td style={{ borderBottom: b }} />
                    </tr>
                  ))}
                <tr style={{ height: "60mm" }}>
                  <td style={{ borderRight: b, borderBottom: B }} /><td style={{ borderRight: b, borderBottom: B }} /><td style={{ borderBottom: B }} />
                </tr>
              </tbody>
            </table>
            <table>
              <tbody>
                <tr>
                  <td style={{ width: "50%", padding: "6px 8px 14px", verticalAlign: "top", fontSize: "9pt" }}>
                    <b>PREPARED BY:</b>
                    <div style={{ marginTop: "12mm", textAlign: "center" }}>
                      <div style={{ fontSize: "10pt", fontWeight: 700 }}>{student.name}</div>
                      <div style={{ borderTop: "1px solid #888", width: "60%", margin: "0 auto", fontStyle: "italic" }}>Signature of Student-Intern</div>
                    </div>
                    <div style={{ marginTop: "6mm", marginLeft: "10mm", fontStyle: "italic" }}>Date: ______________________</div>
                  </td>
                  <td style={{ width: "50%", padding: "6px 8px 14px", verticalAlign: "top", fontSize: "9pt" }}>
                    <b>NOTED BY:</b>
                    <div style={{ marginTop: "12mm", textAlign: "center" }}>
                      <div style={{ fontSize: "10pt" }}>&nbsp;</div>
                      <div style={{ borderTop: "1px solid #888", width: "60%", margin: "0 auto", fontStyle: "italic" }}>Signature over printed name of<br />On-Site Supervisor</div>
                    </div>
                    <div style={{ marginTop: "6mm", marginLeft: "10mm", fontStyle: "italic" }}>Date: ______________________</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
