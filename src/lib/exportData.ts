import { getStudentByEmail } from '@/services/studentService';
import { getMyRegistration } from '@/services/schedulingApi';

export async function exportAcademicData(email: string) {
    try {
        // Fetch student data using existing service
        const student = await getStudentByEmail(email);
        
        if (!student) throw new Error("Failed to fetch student data");
        
        // Fetch registration data (optional)
        let regData: any = null;
        try {
            regData = await getMyRegistration();
        } catch (e) {
            console.error("No registration data found", e);
        }

        // Open a new window for printing the PDF
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert("Please allow pop-ups to generate your PDF");
            return false;
        }

        const latestSem = student.education?.semesters[student.education.semesters.length - 1];

        // Generate styled HTML for the PDF
        let html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>${student.account?.name || 'Student'} - Academic Record</title>
            <style>
                @page { size: auto; margin: 20mm; }
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
                    color: #1f2937; 
                    line-height: 1.5; 
                    max-width: 800px; 
                    margin: 0 auto; 
                    padding: 20px; 
                }
                .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 15px; margin-bottom: 25px; }
                .header h1 { color: #1e3a8a; margin: 0 0 5px 0; font-size: 26px; }
                .header p { margin: 0; color: #6b7280; font-size: 13px; }
                
                .section-title { 
                    color: #111827; 
                    font-size: 18px; 
                    border-bottom: 1px solid #e5e7eb; 
                    padding-bottom: 8px; 
                    margin-top: 35px; 
                    margin-bottom: 15px; 
                }
                
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
                .card { background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 15px; }
                .label { font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
                .value { font-size: 15px; font-weight: 600; color: #111827; }
                
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
                th { background: #f3f4f6; padding: 10px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; }
                td { padding: 10px; border-bottom: 1px solid #e5e7eb; color: #4b5563; }
                
                .sem-header { 
                    background: #1e3a8a; 
                    color: white; 
                    padding: 10px 15px; 
                    border-radius: 6px 6px 0 0; 
                    display: flex; 
                    justify-content: space-between; 
                    font-weight: 600; 
                    margin-top: 25px; 
                    font-size: 14px;
                }
                
                /* Print specific styles */
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .card { break-inside: avoid; }
                    .sem-header { break-after: avoid; }
                    table { break-inside: auto; }
                    tr { break-inside: avoid; break-after: auto; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>NUPAL Academic Record</h1>
                <p>Official Student Report &bull; Generated on ${new Date().toLocaleDateString()}</p>
            </div>

            <div class="grid">
                <div class="card">
                    <div class="label">Student Name</div>
                    <div class="value">${student.account?.name || 'Unknown'}</div>
                </div>
                <div class="card">
                    <div class="label">University Email</div>
                    <div class="value">${student.account?.email || email}</div>
                </div>
                <div class="card">
                    <div class="label">Total Credits Earned</div>
                    <div class="value">${student.education?.totalCredits || 0}</div>
                </div>
                <div class="card">
                    <div class="label">Cumulative GPA</div>
                    <div class="value">${latestSem?.cumulativeGpa?.toFixed(2) || 'N/A'}</div>
                </div>
            </div>
        `;

        if (regData && regData.selectedBlock) {
            html += `
            <div class="section-title">Current Registration (${regData.selectedBlock.semester || 'N/A'})</div>
            <table>
                <thead>
                    <tr>
                        <th>Course Name</th>
                        <th>Credits</th>
                        <th>Schedule / Time</th>
                    </tr>
                </thead>
                <tbody>
            `;
            if (regData.selectedBlock.courses && regData.selectedBlock.courses.length > 0) {
                regData.selectedBlock.courses.forEach((c: any) => {
                    html += `<tr>
                        <td style="font-weight:600;color:#111827;">${c.courseName || c.course_name}</td>
                        <td>${c.credit || 3}</td>
                        <td>${c.day} ${c.start}-${c.end}</td>
                    </tr>`;
                });
            } else {
                html += `<tr><td colspan="3" style="text-align:center;font-style:italic;">No courses registered</td></tr>`;
            }
            html += `</tbody></table>`;
        }

        if (student.education?.semesters && student.education.semesters.length > 0) {
            html += `<div class="section-title">Full Academic Transcript</div>`;
            const semesters = [...student.education.semesters].reverse();
            semesters.forEach((sem: any) => {
                html += `
                <div class="sem-header">
                    <span>${sem.term}</span>
                    <span>Sem GPA: ${sem.semesterGpa?.toFixed(2)} | Cum GPA: ${sem.cumulativeGpa?.toFixed(2)}</span>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style="width:60%">Course Name</th>
                            <th style="width:20%">Credits</th>
                            <th style="width:20%">Final Grade</th>
                        </tr>
                    </thead>
                    <tbody>
                `;
                if (sem.courses && sem.courses.length > 0) {
                    sem.courses.forEach((c: any) => {
                        html += `<tr>
                            <td style="font-weight:500;color:#111827;">${c.courseName}</td>
                            <td>${c.credit}</td>
                            <td><strong style="color:${['A','A+'].includes(c.grade) ? '#059669' : ['B','B+'].includes(c.grade) ? '#2563eb' : ['C','C+'].includes(c.grade) ? '#d97706' : '#dc2626'};">${c.grade}</strong></td>
                        </tr>`;
                    });
                } else {
                    html += `<tr><td colspan="3" style="text-align:center;font-style:italic;">No courses found for this semester</td></tr>`;
                }
                html += `</tbody></table>`;
            });
        }

        html += `
            <script>
                window.onload = function() { 
                    setTimeout(() => {
                        window.print();
                        window.onafterprint = function() { window.close(); };
                    }, 250);
                };
            </script>
        </body>
        </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        
        return true;
    } catch (error) {
        console.error("Export failed:", error);
        return false;
    }
}
