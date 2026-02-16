
const PptxGenJS = require("pptxgenjs");
const path = require('path');

// Image Paths
const LOGIN_IMG = '/Users/orensaban/.gemini/antigravity/brain/add09e8c-2588-4e29-8a2c-3c2c59694b97/login_screenshot_1771078299834.png';
const DASHBOARD_IMG = '/Users/orensaban/.gemini/antigravity/brain/add09e8c-2588-4e29-8a2c-3c2c59694b97/dashboard_screenshot_1771078318252.png';
const GROUP_IMG = '/Users/orensaban/.gemini/antigravity/brain/add09e8c-2588-4e29-8a2c-3c2c59694b97/grouptable_screenshot_1771078320533.png';

const pres = new PptxGenJS();

// --- Theme Colors ---
const BLUE = "2563EB"; // blue-600
const DARK_BG = "0F172A"; // slate-950
const WHITE = "FFFFFF";

// --- Slide 1: Title ---
let slide1 = pres.addSlide();
slide1.background = { color: DARK_BG };
slide1.addText("TAGO", { x: 1, y: 2, w: '80%', fontSize: 80, color: WHITE, bold: true, align: 'center' });
slide1.addText("Group Reservation Hub", { x: 1, y: 3.5, w: '80%', fontSize: 24, color: "94A3B8", align: 'center', charSpacing: 5 }); // slate-400
slide1.addShape(pres.ShapeType.line, { x: 3, y: 3.2, w: 4, h: 0, line: { color: BLUE, width: 3 } });

// --- Slide 2: The Challenge ---
let slide2 = pres.addSlide();
slide2.addText("The Challenge", { x: 0.5, y: 0.5, fontSize: 36, color: BLUE, bold: true });
slide2.addText([
    { text: "Manual tracking of complex group reservations", options: { breakLine: true } },
    { text: "High risk of missed deadlines and payments", options: { breakLine: true } },
    { text: "Lack of real-time visibility into profitability", options: { breakLine: true } },
    { text: "Scattered data across emails and spreadsheets", options: { breakLine: true } }
], { x: 0.5, y: 1.5, w: '90%', fontSize: 24, bullet: true, color: "333333", lineSpacing: 40 });

// --- Slide 3: The Solution ---
let slide3 = pres.addSlide();
slide3.addText("Introducing TAGO", { x: 0.5, y: 0.5, fontSize: 36, color: BLUE, bold: true });
slide3.addText([
    { text: "Centralized Dashboard for all airlines and agencies", options: { breakLine: true } },
    { text: "Automated Reminders for deposits and names", options: { breakLine: true } },
    { text: "Real-time Statistics & Financial Insights", options: { breakLine: true } },
    { text: "Secure Role-Based Access", options: { breakLine: true } }
], { x: 0.5, y: 1.5, w: '50%', fontSize: 20, bullet: true, color: "333333", lineSpacing: 35 });

// Add Login Image
try {
    slide3.addImage({ path: LOGIN_IMG, x: 6, y: 1.5, w: 3.5, h: 3 });
} catch (e) { console.log("Error adding login image", e); }


// --- Slide 4: Powerful Dashboard ---
let slide4 = pres.addSlide();
slide4.addText("Powerful Dashboard", { x: 0.5, y: 0.5, fontSize: 36, color: BLUE, bold: true });
slide4.addText("Instant overview of groups, passengers, and revenue with flexible calculation metrics.",
    { x: 0.5, y: 1.0, w: '90%', fontSize: 16, color: "666666" });

try {
    slide4.addImage({ path: DASHBOARD_IMG, x: 0.5, y: 1.5, w: 9, h: 3.8 }); // Maximize image
} catch (e) { console.log("Error adding dashboard image", e); }


// --- Slide 5: Efficient Management ---
let slide5 = pres.addSlide();
slide5.addText("Efficient Management", { x: 0.5, y: 0.5, fontSize: 36, color: BLUE, bold: true });
slide5.addText("Sort, filter, and search all groups. Export data instantly.",
    { x: 0.5, y: 1.0, w: '90%', fontSize: 16, color: "666666" });

try {
    slide5.addImage({ path: GROUP_IMG, x: 0.5, y: 1.5, w: 9, h: 3.8 });
} catch (e) { console.log("Error adding group image", e); }


// --- Slide 6: Live Demo ---
let slide6 = pres.addSlide();
slide6.background = { color: BLUE };
slide6.addText("Live Demo", { x: 1, y: 2.5, w: '80%', fontSize: 60, color: WHITE, bold: true, align: 'center' });
slide6.addText("Let's see TAGO in action", { x: 1, y: 3.8, w: '80%', fontSize: 24, color: "E2E8F0", align: 'center' });

// Save
pres.writeFile({ fileName: "/Users/orensaban/.gemini/antigravity/brain/add09e8c-2588-4e29-8a2c-3c2c59694b97/TAGO_Presentation.pptx" })
    .then(fileName => {
        console.log(`Created file: ${fileName}`);
    })
    .catch(err => {
        console.error(err);
    });
