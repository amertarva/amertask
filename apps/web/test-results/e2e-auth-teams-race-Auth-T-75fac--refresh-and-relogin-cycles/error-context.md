# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\auth-teams-race.spec.ts >> Auth + Teams Stability >> home team state stays consistent after refresh and relogin cycles
- Location: e2e\auth-teams-race.spec.ts:8:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/home" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e6]: A
        - heading "Selamat Datang" [level=1] [ref=e7]
        - paragraph [ref=e8]: Masuk dan kelola ruang kerja setiap hari!
      - generic [ref=e9]:
        - generic [ref=e10]:
          - generic [ref=e11]: Email
          - generic [ref=e12]:
            - img [ref=e13]
            - textbox "Email" [disabled] [ref=e16]:
              - /placeholder: Masukkan email Anda
              - text: alvinferinaputra2023@student.unas.ac.id
        - generic [ref=e17]:
          - generic [ref=e18]: Kata Sandi
          - generic [ref=e19]:
            - img [ref=e20]
            - textbox "Kata Sandi" [disabled] [ref=e23]:
              - /placeholder: Masukkan kata sandi
              - text: "12345678"
            - button "Tampilkan kata sandi" [ref=e24]:
              - img [ref=e25]
        - generic [ref=e28]:
          - checkbox "Ingat saya" [disabled] [ref=e29]
          - generic [ref=e30]: Ingat saya
        - button "Memproses..." [disabled] [ref=e31]:
          - img [ref=e32]
          - generic [ref=e34]: Memproses...
      - generic [ref=e35]:
        - text: Belum mendaftar?
        - link "Buat akun dari sini" [ref=e36] [cursor=pointer]:
          - /url: /auth/register
    - alert
  - button "Open Next.js Dev Tools" [ref=e42] [cursor=pointer]:
    - generic [ref=e45]:
      - text: Rendering
      - generic [ref=e46]:
        - generic [ref=e47]: .
        - generic [ref=e48]: .
        - generic [ref=e49]: .
  - alert [ref=e50]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.use({ baseURL: "http://localhost:3001" });
  4  | 
  5  | test.describe("Auth + Teams Stability", () => {
  6  |   test.setTimeout(180000);
  7  | 
  8  |   test("home team state stays consistent after refresh and relogin cycles", async ({ page, context }) => {
  9  |     const email = "alvinferinaputra2023@student.unas.ac.id";
  10 |     const password = "12345678";
  11 | 
  12 |     const getHomeSnapshot = async () => {
  13 |       await page.goto("/home");
  14 |       await expect(page.getByText("Ruang Kerja Anda")).toBeVisible({ timeout: 15000 });
  15 | 
  16 |       const emptyCount = await page.getByText("Belum Ada Proyek").count();
  17 |       const projectCards = page.locator('a[href^="/projects/"]');
  18 |       const projectCount = await projectCards.count();
  19 | 
  20 |       let firstProjectText = "";
  21 |       if (projectCount > 0) {
  22 |         firstProjectText = (await projectCards.first().innerText()).trim();
  23 |       }
  24 | 
  25 |       return {
  26 |         empty: emptyCount > 0,
  27 |         projectCount,
  28 |         firstProjectText,
  29 |       };
  30 |     };
  31 | 
  32 |     const doLogin = async () => {
  33 |       await page.goto("/auth/login");
  34 |       await page.fill("#admin-email", email);
  35 |       await page.fill("#admin-password", password);
  36 |       await page.getByRole("button", { name: "Masuk" }).click();
> 37 |       await page.waitForURL("**/home", { timeout: 30000 });
     |                  ^ TimeoutError: page.waitForURL: Timeout 30000ms exceeded.
  38 |     };
  39 | 
  40 |     // Scenario 1: login
  41 |     await doLogin();
  42 |     const baseline = await getHomeSnapshot();
  43 | 
  44 |     // Scenario 2: refresh while logged in
  45 |     await page.reload();
  46 |     const afterRefresh = await getHomeSnapshot();
  47 |     expect(afterRefresh.empty).toBe(baseline.empty);
  48 |     expect(afterRefresh.projectCount).toBe(baseline.projectCount);
  49 |     if (baseline.projectCount > 0) {
  50 |       expect(afterRefresh.firstProjectText).toContain(
  51 |         baseline.firstProjectText.split("\n")[0],
  52 |       );
  53 |     }
  54 | 
  55 |     // Scenario 4: open new tab while logged in
  56 |     const secondTab = await context.newPage();
  57 |     await secondTab.goto("http://localhost:3001/home");
  58 |     await expect(secondTab.getByText("Ruang Kerja Anda")).toBeVisible({ timeout: 15000 });
  59 |     const secondTabProjects = await secondTab.locator('a[href^="/projects/"]').count();
  60 |     expect(secondTabProjects).toBe(baseline.projectCount);
  61 |     await secondTab.close();
  62 | 
  63 |     // Scenario 3: login -> logout -> login cycle x3
  64 |     for (let i = 0; i < 3; i += 1) {
  65 |       await page.goto("/home/settings");
  66 |       await page.getByRole("button", { name: "Keluar Dari Sesi Akun" }).click();
  67 |       await Promise.race([
  68 |         page.waitForURL("**/", { timeout: 20000 }),
  69 |         page.waitForURL("**/auth/login", { timeout: 20000 }),
  70 |       ]);
  71 | 
  72 |       await doLogin();
  73 |       const cycleSnapshot = await getHomeSnapshot();
  74 |       expect(cycleSnapshot.empty).toBe(baseline.empty);
  75 |       expect(cycleSnapshot.projectCount).toBe(baseline.projectCount);
  76 |       if (baseline.projectCount > 0) {
  77 |         expect(cycleSnapshot.firstProjectText).toContain(
  78 |           baseline.firstProjectText.split("\n")[0],
  79 |         );
  80 |       }
  81 |     }
  82 |   });
  83 | });
  84 | 
```