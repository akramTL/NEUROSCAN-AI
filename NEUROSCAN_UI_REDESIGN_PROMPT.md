You are a senior UI/UX engineer. Redesign NeuroScan AI frontend to match
a clean modern medical dashboard. Reference design uses: soft blue-gray
page background #EBF0F8, pure white cards with subtle box-shadows, blue
gradient accent, narrow 72px sidebar with floating icon pills, clean top
bar with greeting + search + bell icon.

Do NOT change: src/api/, AuthContext.jsx, App.jsx routing, vite.config.js,
or any backend file. Pure visual layer only.

---
STEP 1 — src/styles/theme.css

:root {
  --bg-page:#EBF0F8; --bg-card:#FFFFFF; --bg-input:#F4F7FC;
  --accent-solid:#3B82F6; --accent-light:#EBF3FF; --accent-lighter:#F0F6FF;
  --gradient-accent:linear-gradient(135deg,#4B8EF1,#2563EB);
  --gradient-card:linear-gradient(135deg,#4B8EF1 0%,#2563EB 100%);
  --cn-color:#10B981; --cn-bg:#ECFDF5;
  --mci-color:#F59E0B; --mci-bg:#FFFBEB;
  --ad-color:#EF4444; --ad-bg:#FEF2F2;
  --text-primary:#1E293B; --text-secondary:#64748B; --text-muted:#94A3B8;
  --border:#E2E8F0; --border-light:#F1F5F9;
  --shadow-card:0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04);
  --shadow-hover:0 4px 12px rgba(0,0,0,0.08),0 2px 4px rgba(0,0,0,0.04);
  --shadow-sidebar:2px 0 8px rgba(0,0,0,0.06);
  --radius-sm:4px; --radius-md:12px; --radius-lg:16px;
  --radius-xl:20px; --radius-full:9999px;
}
.card{background:var(--bg-card);border-radius:var(--radius-lg);
  box-shadow:var(--shadow-card);padding:20px 24px;transition:box-shadow 0.2s}
.card:hover{box-shadow:var(--shadow-hover)}
.btn-primary{background:var(--gradient-accent);color:#fff;border:none;
  border-radius:var(--radius-full);padding:10px 24px;font-size:14px;
  font-weight:500;cursor:pointer;transition:opacity 0.15s,transform 0.15s}
.btn-primary:hover{opacity:0.92}.btn-primary:active{transform:scale(0.98)}
.btn-secondary{background:var(--accent-light);color:var(--accent-solid);
  border:none;border-radius:var(--radius-full);padding:10px 24px;
  font-size:14px;font-weight:500;cursor:pointer;transition:background 0.15s}
.btn-secondary:hover{background:#DBEAFE}
.input-field{background:var(--bg-input);border:1.5px solid transparent;
  border-radius:var(--radius-md);padding:11px 16px;font-size:14px;
  color:var(--text-primary);width:100%;outline:none;
  transition:border-color 0.15s;box-sizing:border-box}
.input-field:focus{border-color:var(--accent-solid);background:#fff}
.badge-cn{background:var(--cn-bg);color:var(--cn-color);border-radius:var(--radius-full);padding:4px 12px;font-size:12px;font-weight:600;display:inline-block}
.badge-mci{background:var(--mci-bg);color:var(--mci-color);border-radius:var(--radius-full);padding:4px 12px;font-size:12px;font-weight:600;display:inline-block}
.badge-ad{background:var(--ad-bg);color:var(--ad-color);border-radius:var(--radius-full);padding:4px 12px;font-size:12px;font-weight:600;display:inline-block}
.badge-pending{background:#F1F5F9;color:#6B7280;border-radius:var(--radius-full);padding:4px 12px;font-size:12px;font-weight:500;display:inline-block}
.badge-processing{background:#EFF6FF;color:#3B82F6;border-radius:var(--radius-full);padding:4px 12px;font-size:12px;font-weight:500;display:inline-block}
.badge-completed{background:var(--cn-bg);color:var(--cn-color);border-radius:var(--radius-full);padding:4px 12px;font-size:12px;font-weight:500;display:inline-block}
.badge-failed{background:var(--ad-bg);color:var(--ad-color);border-radius:var(--radius-full);padding:4px 12px;font-size:12px;font-weight:500;display:inline-block}
.avatar{width:40px;height:40px;border-radius:50%;background:var(--accent-light);
  color:var(--accent-solid);display:flex;align-items:center;
  justify-content:center;font-size:13px;font-weight:600;flex-shrink:0}
.progress-track{background:var(--border-light);border-radius:var(--radius-full);height:6px;overflow:hidden}
.progress-fill-cn{height:100%;border-radius:var(--radius-full);background:var(--cn-color);transition:width 0.8s cubic-bezier(0.34,1.56,0.64,1)}
.progress-fill-mci{height:100%;border-radius:var(--radius-full);background:var(--mci-color);transition:width 0.8s cubic-bezier(0.34,1.56,0.64,1)}
.progress-fill-ad{height:100%;border-radius:var(--radius-full);background:var(--ad-color);transition:width 0.8s cubic-bezier(0.34,1.56,0.64,1)}
.progress-fill-accent{height:100%;border-radius:var(--radius-full);background:var(--gradient-accent);transition:width 0.8s ease}
.stat-change-up{color:#10B981;font-size:12px;font-weight:500;background:#ECFDF5;padding:3px 8px;border-radius:var(--radius-full)}
.stat-change-down{color:#EF4444;font-size:12px;font-weight:500;background:#FEF2F2;padding:3px 8px;border-radius:var(--radius-full)}
.page-enter{animation:pageEnter 0.2s ease-out}
@keyframes pageEnter{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
.spin{animation:spin 1s linear infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
.pulse{animation:pulse 1.5s ease-in-out infinite}

Import theme.css as first import in src/main.jsx.
Add to index.html before </head>:
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
Set body style: font-family:'Inter',system-ui,sans-serif; background:#EBF0F8; margin:0

---
STEP 2 — Layout.jsx

SIDEBAR: position fixed left-0 top-0 width-72px height-100vh z-index-100
  bg var(--bg-card), shadow-sidebar, border-radius 0 20px 20px 0
  flex column align-items-center padding 20px 0

  Logo 48x48px: bg gradient-accent, radius-md, Brain icon lucide 24px white, mb-24px

  4 nav buttons 44x44 circles gap 4px:
    Active: gradient-accent bg, white color, box-shadow 0 4px 12px rgba(59,130,246,0.4), border-radius 50%
    Inactive: transparent bg, text-muted color, border-radius 50%
    Hover: accent-lighter bg, accent-solid color
    transition all 0.15s
    Icons (all from lucide-react): LayoutDashboard / Users / Upload / BarChart2
    Routes: "/" , "/patients", "/upload", "/dashboard"

  flex-1 spacer

  Doctor avatar 44x44 circle gradient-accent, white initials 13px-600, mb-16px
    initials from AuthContext doctor.full_name

MAIN CONTENT: margin-left 72px, min-height 100vh, bg var(--bg-page)

TOP BAR (padding 24px 32px 0 32px, flex space-between align-items-center mb-28px):
  LEFT:
    getGreeting(): hour<12="Good morning" hour<17="Good afternoon" else="Good evening"
    "{greeting}, Dr. {full_name} 👋" — 20px 600 text-primary
    "Your progress this week is great" — 14px text-muted mt-2px

  CENTER: search pill (bg-card shadow-card radius-full padding 10px-20px width-300px flex gap-8px)
    Search icon lucide 16px text-muted
    bare input: no border, transparent bg, 14px, flex-1, placeholder "Search patients..."

  RIGHT: flex gap-12px align-items-center
    Bell button 40x40 circle (bg-card shadow-card position-relative):
      Bell icon lucide 18px text-secondary
      Red dot 8x8 absolute top-8px right-8px bg #EF4444 radius-50%
      Show dot only when pending analyses > 0
    Doctor avatar 40x40 circle gradient white initials

PAGE CONTENT: padding 0 32px 32px 32px

---
STEP 3 — Dashboard.jsx

STAT CARDS: CSS grid 3 columns gap-20px

Each .card (flex space-between align-items-flex-start):
  LEFT:
    Icon circle 44x44 radius-md:
      Patients: bg #EFF6FF color accent-solid, Users icon
      Analyses: bg #F0FDF4 color #10B981, Activity icon
      AD count: bg #FEF2F2 color #EF4444, AlertCircle icon
    stat label 13px text-secondary, display block, mt-16px
    big number 28px 700 text-primary mt-4px
    .stat-change-up pill + "vs last month" 12px muted
    sub-stats 13px muted (2 values separated by "·")
  RIGHT: MoreVertical icon lucide 16px text-muted

Animate numbers 0→value count-up 800ms requestAnimationFrame on mount.

2-COLUMN GRID (65%/35% gap-20px mt-20px):

LEFT .card — Analytics:
  Header: "Analytics" 16px-600 + Monthly pill button right (border var(--border) radius-full 13px Calendar icon + "Monthly")
  Big number + .stat-change-up mb-16px
  Recharts BarChart height-220px:
    linearGradient fill: #4B8EF1 → #2563EB
    CartesianGrid: horizontal only, strokeDasharray "3 3", stroke #F1F5F9
    XAxis: Sun Mon Tue Wed Thu Fri Sat, tickLine false, axisLine false, tick fill text-muted fontSize 12
    YAxis: hide completely (hide prop)
    Bar: border-radius [6,6,0,0]
    Tooltip: custom white card with shadow-card radius-md

RIGHT COLUMN — 2 stacked .cards gap-20px:
  Card 1 — Result distribution:
    "Result distribution" 15px-600
    3 rows gap-14px mt-16px: label(13px matching color) + % right + progress bar below
    .progress-fill-cn/mci/ad animate width on mount via useState+setTimeout(50ms)

  Card 2 — Quick actions:
    "Quick actions" 15px-600
    2 full-width buttons gap-10px mt-14px:
      .btn-primary: Upload icon + "New analysis"
      .btn-secondary: UserPlus icon + "Add patient"

RECENT ANALYSES .card full-width mt-20px:
  Header: "Recent analyses" 16px-600 + "View all →" 13px accent ml-auto
  Table width-100% border-collapse-collapse:
    thead: 12px text-muted uppercase letter-spacing 0.5px
    Columns: Patient | Date | Status | Result | Confidence | action
    Rows: padding 14px 0, border-bottom 1px var(--border-light)
      Patient: .avatar 32px + name 14px-500 + date 12px-muted stacked, flex gap-10px
      Status: .badge-{status}
      Result: .badge-{result} or "—"
      Confidence: 60px .progress-track + % text 12px-600
      Action: "View →" 13px accent link
    Row hover: bg accent-lighter cursor-pointer
    Last row: no border-bottom

---
STEP 4 — Patients.jsx

HEADER (flex space-between align-items-flex-start):
  "Patients" 22px-600 + "N patients total" 14px-muted mt-2px
  RIGHT: .input-field width-240px (Search icon position-absolute left-14px, padding-left 40px)
         + "Add patient" .btn-primary UserPlus icon

GRID: auto-fit minmax(280px,1fr) gap-16px mt-24px

Patient .card (flex flex-direction-column):
  Top row (flex align-items-center gap-12px):
    .avatar 44px gradient white initials
    name 15px-600 flex-1
    last result badge ml-auto
  DOB · gender 13px text-muted mt-8px
  Divider 1px var(--border-light) my-14px
  Bottom row (flex align-items-center):
    "Last analysis: X days ago" 13px muted
    "View →" 13px accent 500 ml-auto
  hover: shadow-hover + translateY(-2px) transition-0.2s

ADD PATIENT MODAL:
  Overlay: position fixed inset-0 rgba(15,23,42,0.4) backdrop-blur(4px) z-200
  Card: white bg radius-xl padding-32px max-width-440px centered
    box-shadow 0 20px 60px rgba(0,0,0,0.15)
  Header: "New patient" 18px-600 + X button 32x32 circle hover bg-border-light
  4 .input-field stacked gap-16px (first name, last name, DOB, gender select)
  Buttons: "Cancel" .btn-secondary + "Save patient" .btn-primary gap-12px mt-24px
  Open animation: scale(0.95) opacity(0) → scale(1) opacity(1) 200ms ease-out

EMPTY STATE (centered): Users icon 48px in 80x80 accent-light circle
  "No patients yet" 18px-600 mt-16px
  "Add your first patient" 14px-muted
  "Add patient" .btn-primary mt-20px

---
STEP 5 — PatientDetail.jsx

HERO .card (flex align-items-center gap-20px):
  64x64 circle gradient white initials 22px-600
  name 20px-600 + "DOB · gender" 14px muted below (stacked)
  "New analysis" .btn-primary ml-auto Upload icon

"Analysis history" 16px-600 margin 24px 0 16px

Each analysis .card (grid 140px 120px 120px 1fr auto, align-center gap-16px, p-16px-20px mb-12px):
  Date 14px-500 + time 12px-muted stacked
  .badge-{status}
  .badge-{result} or "—"
  .progress-track + % 12px-600
  "View details →" 13px accent link

EMPTY STATE: Brain icon circle + "No analyses yet" + .btn-primary "Start analysis"

---
STEP 6 — Upload.jsx

STEPPER .card (padding 20px 32px mb-24px):
  Horizontal flex centered 3 steps
  Step circle 32x32:
    Completed: gradient-accent bg, white Check icon, glow shadow
    Active: white bg, 2px solid accent-solid, accent number 600
    Inactive: bg-input bg, 1.5px solid border, muted number
  Label 12px below circle
  Lines between: flex-1 1px solid var(--border) align-self-center mt-[-16px]

STEP CARDS (.card mb-16px):

Step 1 CSV:
  Header row: "Patient biomarker data" 15px-600
    + Required badge (bg #FEF3C7 color #D97706 radius-full 11px ml-auto)
  Drop zone (bg-input dashed border-2px var(--border) radius-lg min-h-160px
    flex-column center gap-8px cursor-pointer transition-all-0.2s padding-24px):
    FileText icon lucide 32px accent-solid
    "Drop your CSV file here" 15px-500 text-primary
    "or click to browse" 13px text-muted
    ".csv" pill (accent-light bg, accent text, radius-full 11px)
    dragover: border-color accent-solid bg accent-lighter
    after drop: CheckCircle 20px green + filename 14px-500 + size 12px-muted
  Helper box (bg-input radius-sm p-12px-16px mt-12px):
    "Expected columns:" 13px muted
    Code pills for each column: bg accent-light color accent-solid
      font-mono 11px padding 2px-6px radius-4px inline-block margin-2px
    Columns: subject_id age gender MMSE CDR eTIV nWBV ASF
  CSV preview: table max-5-rows 12px alternating-bg "Remove" red link
  SANITIZE: strip leading = + - @ from all cell values

Step 2 MRI: Brain icon, "MRI scan", Optional badge (accent-light bg accent text)
  Accepted: .nii .nii.gz .dcm pills

Step 3 PET: Activity icon, "PET scan", Optional badge, same formats

NAV .card (flex space-between p-16px-24px):
  "Back" .btn-secondary ArrowLeft icon (hidden on step 1)
  "Next" / "Submit" .btn-primary (ArrowRight/Upload icon)
  Submit loading: Loader2 spin + "Analysing..." button disabled opacity-0.8

---
STEP 7 — Result.jsx

LOADING (min-height 60vh, flex center):
  .card max-w-480px p-48px text-center:
    Spinner: 80x80 circle border-3px-solid var(--border) border-top accent-solid
      radius-50% animation spin 1s linear infinite
    "Analysing patient data" 20px-600 mt-24px
    "Processing biomarkers..." 14px muted mt-8px
    Steps (flex column gap-12px mt-32px text-left):
      3 rows: (CheckCircle 16px green / Loader2 16px spin / Circle 16px muted) + label 14px
      Animate through steps every 2000ms

RESULT .card (max-w-520px margin-40px-auto p-40px):
  HERO (text-center):
    Icon circle 80x80:
      CN: cn-bg + CheckCircle 40px cn-color
      MCI: mci-bg + AlertTriangle 40px mci-color
      AD: ad-bg + AlertCircle 40px ad-color
    Result name 32px-700 matching color mt-16px
    .badge-{result} mt-8px

  Divider 1px var(--border-light) my-24px

  CONFIDENCE:
    flex: "Model confidence" 14px-500 + % 14px-600 ml-auto
    .progress-track h-8px mt-8px
    .progress-fill-accent animate 0→value on mount
    "Based on XGBoost biomarker analysis" 12px muted mt-6px

  FEATURE IMPORTANCE (if feature_importance exists):
    "What drove this result" 14px-600 margin 20px 0 12px
    Max 5 bars sorted descending:
      Row: feature name 13px secondary + score % 12px-600 right
      .progress-track h-4px + .progress-fill-accent
      Stagger: each bar delay index*80ms

  Divider 1px var(--border-light) my-24px

  BUTTONS (flex space-between):
    "Back to patient" .btn-secondary ArrowLeft
    "Download report" .btn-primary opacity-0.5 cursor-not-allowed disabled
      Download icon + "Report (coming soon)"

FAILED .card (max-w-480px centered p-40px text-center):
  80x80 circle ad-bg + XCircle 40px ad-color
  "Analysis failed" 20px-600 ad-color mt-16px
  error_message 14px muted max-w-320px mx-auto
  "Try again" .btn-primary mt-24px

---
STEP 8 — Login.jsx

FULL PAGE: display flex, min-height 100vh, bg var(--bg-page)

LEFT PANEL (width 45%, hide <768px):
  bg gradient-card, border-radius 0 radius-xl radius-xl 0, height 100vh
  flex column justify-center padding-64px color-white position-relative overflow-hidden

  Brain icon lucide 64px white opacity-0.9 mb-16px
  "NeuroScan AI" 32px-600
  "Advanced Alzheimer's detection" 16px opacity-0.8 mt-8px

  Feature list (flex column gap-16px mt-48px):
    3 rows: CheckCircle 18px white opacity-0.9 + text 14px opacity-0.9
    "AI-powered AD / MCI / CN classification"
    "Multimodal — CSV, MRI, and PET scans"
    "Instant results with confidence scores"

  Decorative: 2 circles position absolute opacity-0.08 white
    300x300 bottom-[-80px] right-[-80px]
    150x150 top-60px right-40px

RIGHT PANEL (flex-1 flex align-items-center justify-content-center):
  Container: max-w-400px width-100% padding 0 32px

  "Welcome back" 24px-600 text-primary
  "Sign in to your account" 14px muted mt-4px mb-32px

  Email (label 13px-500 secondary mb-6px):
    position-relative wrapper:
      Mail icon lucide 16px muted absolute left-14px top-50% translateY(-50%)
      .input-field padding-left-44px

  Password mt-16px (label "Password"):
    position-relative wrapper:
      Lock icon left-14px
      .input-field padding-left-44px padding-right-44px
      Eye/EyeOff toggle absolute right-14px top-50% translateY(-50%) 16px muted cursor-pointer

  Row flex align-items-center mt-12px:
    Checkbox label (flex gap-8px align-items-center cursor-pointer):
      input[type=checkbox] 16x16 radius-4px accent-checked
      "Remember me" 13px text-secondary
    "Forgot password?" 13px accent-solid ml-auto

  .btn-primary full-width h-48px mt-24px "Sign in"

  Error alert (show on auth error, mt-12px):
    flex align-items-center gap-8px p-12px-16px
    bg ad-bg color ad-color radius-md
    AlertCircle 16px + error text 13px

  Divider (flex align-items-center gap-12px mt-24px):
    div flex-1 h-1px bg var(--border)
    "or continue with" 13px muted no-wrap
    div flex-1 h-1px bg var(--border)

  Social row (flex gap-12px justify-center mt-16px):
    4 buttons 44x44 border-1.5px-solid-border radius-md white-bg cursor-pointer
    14px-500 text-secondary transition border-color-0.15s color-0.15s
    hover: border accent-solid color accent-solid
    Labels: F  G  in  X
    onClick: showToast("Social login coming soon", "info")

  "Dont have an account? Register" centered 13px mt-24px
    "Register" accent-solid 500 cursor-pointer onClick navigate /register

---
STEP 9 — Register.jsx

Same two-panel layout. Right panel:
  "Create account" 24px-600
  "Join NeuroScan AI today" 14px-muted mb-32px

  4 fields gap-16px:
    Full name (User icon)
    Email (Mail icon)
    Password (Lock icon + Eye toggle)
    Confirm password (Lock icon)

  Password strength bar (below password mt-8px flex align-items-center gap-8px):
    .progress-track flex-1 h-4px
    Fill: 25% #EF4444 / 50% #F59E0B / 75% #10B981 / 100% #10B981
    Strength label 11px matching color: Weak/Fair/Good/Strong

  Confirm mismatch (show when both filled + not matching mt-6px):
    flex align-items-center gap-6px
    AlertCircle 14px ad-color + "Passwords dont match" 13px ad-color

  .btn-primary full-width "Create account" mt-24px

  "Already have an account? Sign in" centered 13px mt-16px
    "Sign in" accent-solid 500 onClick navigate /login

---
STEP 10 — Toast.jsx + ToastContext.jsx

Create ToastContext with useToast hook.
ToastContainer: position fixed top-24px right-24px z-9999 flex-column gap-8px

Each toast (.card min-w-300px max-w-380px):
  border-left 4px solid:
    success: cn-color | error: ad-color | info: accent-solid | warning: mci-color
  flex align-items-flex-start gap-12px p-14px-16px
  Icon 16px: CheckCircle/XCircle/Info/AlertTriangle matching border color
  flex-1: title 14px-500 + message 13px muted (if provided)
  X button 16px muted ml-auto cursor-pointer
  Enter: translateX(120%)→translateX(0) 250ms ease-out
  Exit: translateX(120%) opacity(0) 200ms ease-in
  Auto-dismiss: 4000ms

API: showToast(message, type="info", title?)
  type options: "success" | "error" | "info" | "warning"

Add ToastProvider as wrapper in App.jsx root (only change to App.jsx).
Use showToast in: patient create success, upload submitted,
  analysis completed, auth login errors, social login buttons.

---
EXECUTION ORDER:
1 theme.css
2 main.jsx (import theme.css first)
3 index.html (Inter font, body styles)
4 Toast.jsx + ToastContext.jsx
5 Layout.jsx
6 Login.jsx
7 Register.jsx
8 Dashboard.jsx
9 Patients.jsx
10 PatientDetail.jsx
11 Upload.jsx
12 Result.jsx
13 StatusBadge.jsx (use .badge-{status} classes)
14 ResultBadge.jsx (use .badge-{result} classes)
15 App.jsx (ToastProvider wrapper only)

---
QUALITY CHECKLIST — verify after each file:
[ ] No hardcoded hex colors, all CSS variables
[ ] Zero neumorphic inset box-shadows
[ ] Page background is var(--bg-page) #EBF0F8
[ ] All cards: var(--bg-card) white + var(--shadow-card)
[ ] Primary buttons: gradient-accent
[ ] Secondary buttons: accent-light bg + accent-solid text
[ ] Sidebar active icon: gradient + blue glow shadow
[ ] Login: gradient left panel + clean form right
[ ] CSV cells sanitized (strip = + - @ leading chars)
[ ] Lucide React icons only throughout
[ ] Toast fires on all key user actions
[ ] Mobile (<768px): sidebar collapses to bottom tab navigation